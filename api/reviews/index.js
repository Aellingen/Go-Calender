import { parse } from 'cookie';
import { getAuthUser, sendError } from '../_lib/auth-middleware.js';
import { getSupabase } from '../_lib/supabase.js';
import { toCamelAction } from '../_lib/transform.js';
import { getNextPeriodStart, getNextPeriodEnd, isPeriodExpired } from '../_lib/dates.js';
import { z } from 'zod';

const submitSchema = z.object({
  reviewType: z.enum(['weekly', 'monthly']),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  note: z.string().default(''),
  actionSnapshots: z.array(z.object({
    actionId: z.string().min(1),
    sealedValue: z.number(),
  })),
});

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    }
    if (req.method === 'POST') {
      return await handlePost(req, res);
    }
    return res.status(405).json({ data: null, error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
}

// ── GET /api/reviews?pending=true  OR  GET /api/reviews ──
async function handleGet(req, res) {
  const { pending, type } = req.query;

  if (pending === 'true') {
    return await handleGetPending(req, res);
  }

  // History: fetch all completed reviews from Supabase
  const { supabase, user } = await getAuthUser(req);

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('workspace_id', user.workspace_id)
    .order('completed_at', { ascending: false });

  if (type) {
    query = query.eq('review_type', type);
  }

  const { data: reviews, error } = await query;
  if (error) return res.status(500).json({ data: null, error: 'Failed to fetch reviews' });

  return res.status(200).json({ data: reviews, error: null });
}

// ── Pending reviews: computed from actions with expired periods ──
async function handleGetPending(req, res) {
  const { supabase, user } = await getAuthUser(req);

  // 1. Fetch all active actions
  const { data: actionRows } = await supabase
    .from('actions')
    .select('*')
    .eq('workspace_id', user.workspace_id)
    .eq('status', 'active');

  const allActions = (actionRows || []).map(toCamelAction);

  // 2. Filter to actions with expired periods
  const expiredActions = allActions.filter(
    (a) => a.periodType && a.periodEnd && a.recurrenceMode !== 'none' && isPeriodExpired(a.periodEnd),
  );

  if (expiredActions.length === 0) {
    return res.status(200).json({ data: [], error: null });
  }

  // 3. Fetch all goals (for parent goal names)
  const goalIds = [...new Set(expiredActions.map((a) => a.parentGoalId))];
  const { data: goalRows } = await supabase
    .from('goals')
    .select('id, name')
    .in('id', goalIds);

  const goalMap = {};
  for (const g of goalRows || []) {
    goalMap[g.id] = g;
  }

  // 4. Compute currentValue for each expired action from logs
  const actionIds = expiredActions.map((a) => a.id);
  const { data: logRows } = await supabase
    .from('logs')
    .select('source_id, log_date, value')
    .eq('source_type', 'action')
    .eq('is_closing_entry', false)
    .in('source_id', actionIds);

  const logsByAction = {};
  for (const log of logRows || []) {
    (logsByAction[log.source_id] ||= []).push(log);
  }

  const actionLogs = {};
  for (const action of expiredActions) {
    const logs = logsByAction[action.id] || [];
    let total = 0;
    for (const log of logs) {
      if (log.log_date && action.currentPeriodStart && action.periodEnd) {
        if (log.log_date >= action.currentPeriodStart && log.log_date <= action.periodEnd) {
          total += Number(log.value) || 0;
        }
      }
    }
    actionLogs[action.id] = total;
  }

  // 5. Check which reviews already exist
  const periodKeys = [...new Set(expiredActions.map((a) => a.periodEnd))];
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('action_snapshots, period_end, review_type')
    .eq('workspace_id', user.workspace_id)
    .in('period_end', periodKeys);

  const reviewedSet = new Set();
  for (const r of existingReviews || []) {
    for (const snap of r.action_snapshots || []) {
      reviewedSet.add(`${snap.actionId}:${r.period_end}`);
    }
  }

  // 6. Group by period window
  const groups = {};
  for (const action of expiredActions) {
    const key = `${action.periodType}:${action.currentPeriodStart}:${action.periodEnd}`;
    if (reviewedSet.has(`${action.id}:${action.periodEnd}`)) continue;

    if (!groups[key]) {
      groups[key] = {
        reviewType: action.periodType,
        periodStart: action.currentPeriodStart,
        periodEnd: action.periodEnd,
        actions: [],
      };
    }
    groups[key].actions.push({
      actionId: action.id,
      actionName: action.name,
      parentGoalId: action.parentGoalId,
      parentGoalName: goalMap[action.parentGoalId]?.name || '',
      target: action.target ?? 0,
      unit: action.unit || '',
      currentValue: actionLogs[action.id] || 0,
      periodType: action.periodType,
    });
  }

  const pendingReviews = Object.values(groups).filter((g) => g.actions.length > 0);
  return res.status(200).json({ data: pendingReviews, error: null });
}

// ── POST /api/reviews ──
async function handlePost(req, res) {
  const { supabase, user } = await getAuthUser(req);

  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ data: null, error: parsed.error.issues[0].message });
  }

  const { reviewType, periodStart, periodEnd, note, actionSnapshots } = parsed.data;

  // 1. Fetch action details and compute logged values
  const actionIds = actionSnapshots.map((s) => s.actionId);
  const { data: actionRows } = await supabase
    .from('actions')
    .select('id, name, target, unit, parent_goal_id')
    .in('id', actionIds);

  const actionMap = {};
  for (const a of actionRows || []) {
    actionMap[a.id] = a;
  }

  // Fetch parent goal names
  const goalIds = [...new Set((actionRows || []).map((a) => a.parent_goal_id).filter(Boolean))];
  const goalMap = {};
  if (goalIds.length > 0) {
    const { data: goalRows } = await supabase
      .from('goals')
      .select('id, name')
      .in('id', goalIds);
    for (const g of goalRows || []) {
      goalMap[g.id] = g.name;
    }
  }

  // Fetch logs for period
  const { data: logRows } = await supabase
    .from('logs')
    .select('source_id, log_date, value')
    .eq('source_type', 'action')
    .eq('is_closing_entry', false)
    .in('source_id', actionIds);

  const logsByAction = {};
  for (const log of logRows || []) {
    (logsByAction[log.source_id] ||= []).push(log);
  }

  const fullSnapshots = [];
  for (const snap of actionSnapshots) {
    const action = actionMap[snap.actionId] || {};
    const logs = logsByAction[snap.actionId] || [];
    let loggedValue = 0;
    for (const log of logs) {
      if (log.log_date && log.log_date >= periodStart && log.log_date <= periodEnd) {
        loggedValue += Number(log.value) || 0;
      }
    }

    fullSnapshots.push({
      actionId: snap.actionId,
      actionName: action.name || '',
      parentGoalName: goalMap[action.parent_goal_id] || '',
      target: action.target ?? 0,
      unit: action.unit || '',
      loggedValue,
      sealedValue: snap.sealedValue,
    });
  }

  // 2. Create corrective log entries where sealedValue !== loggedValue
  const corrections = fullSnapshots
    .filter((s) => s.sealedValue - s.loggedValue !== 0)
    .map((s) => ({
      workspace_id: user.workspace_id,
      source_type: 'action',
      source_id: s.actionId,
      log_date: periodEnd,
      value: s.sealedValue - s.loggedValue,
      entry_type: 'review_correction',
      is_closing_entry: false,
    }));

  if (corrections.length > 0) {
    await supabase.from('logs').insert(corrections);
  }

  // 3. Reset each action's period
  for (const snap of fullSnapshots) {
    const newStart = getNextPeriodStart(periodEnd);
    const newEnd = getNextPeriodEnd(periodEnd, reviewType);
    if (newStart && newEnd) {
      await supabase
        .from('actions')
        .update({
          current_period_start: newStart,
          period_end: newEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', snap.actionId);
    }
  }

  // 4. Store review record
  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      workspace_id: user.workspace_id,
      review_type: reviewType,
      period_start: periodStart,
      period_end: periodEnd,
      note,
      action_snapshots: fullSnapshots,
    })
    .select()
    .single();

  if (insertError) {
    return res.status(500).json({ data: null, error: 'Failed to save review record' });
  }

  // 5. Check if more pending reviews remain
  const { data: allActionRows } = await supabase
    .from('actions')
    .select('id, period_type, period_end, recurrence_mode')
    .eq('workspace_id', user.workspace_id)
    .eq('status', 'active');

  const stillExpired = (allActionRows || []).filter(
    (a) => a.period_type && a.period_end && a.recurrence_mode !== 'none' && isPeriodExpired(a.period_end),
  );

  const { data: allReviews } = await supabase
    .from('reviews')
    .select('action_snapshots, period_end')
    .eq('workspace_id', user.workspace_id);

  const allReviewedSet = new Set();
  for (const r of allReviews || []) {
    for (const s of r.action_snapshots || []) {
      allReviewedSet.add(`${s.actionId}:${r.period_end}`);
    }
  }

  const remainingPending = stillExpired.filter(
    (a) => !allReviewedSet.has(`${a.id}:${a.period_end}`),
  );

  if (remainingPending.length === 0) {
    await supabase
      .from('users')
      .update({ pending_reset: false })
      .eq('workspace_id', user.workspace_id);
  }

  return res.status(201).json({ data: review, error: null });
}
