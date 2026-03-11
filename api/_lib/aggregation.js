import { getSupabase } from './supabase.js';

/**
 * After a primary log write, check if the source action has a lateral link.
 * If yes, write a secondary log entry to the target action.
 */
export async function handleLateralLinks(supabase, sourceActionId, value, workspaceId) {
  const { data: action } = await supabase
    .from('actions')
    .select('lateral_link_target_id, lateral_link_type')
    .eq('id', sourceActionId)
    .single();

  if (!action?.lateral_link_target_id) return;

  const linkType = action.lateral_link_type || 'value';
  const incrementValue = linkType === 'count' ? 1 : value;

  if (incrementValue === 0) return;

  // Get target action for period label
  const { data: target } = await supabase
    .from('actions')
    .select('current_period_start, period_end')
    .eq('id', action.lateral_link_target_id)
    .single();

  const periodLabel = buildPeriodLabel(
    target?.current_period_start,
    target?.period_end,
  );

  await supabase.from('logs').insert({
    workspace_id: workspaceId,
    source_type: 'action',
    source_id: action.lateral_link_target_id,
    log_date: new Date().toISOString().split('T')[0],
    value: incrementValue,
    entry_type: 'numeric',
    period_label: periodLabel,
    is_closing_entry: false,
  });
}

/**
 * After a goal log write, check if the goal has a linked_goal_id.
 * If yes, write a secondary log entry to the linked goal.
 */
export async function handleGoalLink(supabase, workspaceId, goalId, value, logDate) {
  const { data: goal } = await supabase
    .from('goals')
    .select('linked_goal_id')
    .eq('id', goalId)
    .single();

  if (!goal?.linked_goal_id) return;
  if (value === 0) return;

  const { data: target } = await supabase
    .from('goals')
    .select('current_period_start, period_end')
    .eq('id', goal.linked_goal_id)
    .single();

  const periodLabel = buildPeriodLabel(
    target?.current_period_start,
    target?.period_end,
  );

  await supabase.from('logs').insert({
    workspace_id: workspaceId,
    source_type: 'goal',
    source_id: goal.linked_goal_id,
    log_date: logDate,
    value,
    entry_type: 'numeric',
    period_label: periodLabel,
    is_closing_entry: false,
  });
}

/**
 * When a goal log is edited, propagate the delta to the linked goal.
 */
export async function handleGoalLinkEdit(supabase, workspaceId, goalId, oldValue, newValue, logDate) {
  const delta = newValue - oldValue;
  if (delta === 0) return;
  await handleGoalLink(supabase, workspaceId, goalId, delta, logDate);
}

/**
 * When a log entry is edited, compute the delta and apply it to any lateral target.
 */
export async function handleLateralLinkEdit(supabase, sourceActionId, oldValue, newValue, workspaceId) {
  const delta = newValue - oldValue;
  if (delta === 0) return;
  await handleLateralLinks(supabase, sourceActionId, delta, workspaceId);
}

/**
 * Attach currentValue to each item using a single aggregation query.
 * For recurring items (has currentPeriodStart + periodEnd), sums only logs in that period.
 * For non-recurring, sums all logs.
 * Mutates items in-place.
 */
export async function attachCurrentValues(supabase, items, sourceType) {
  if (items.length === 0) return;

  const ids = items.map((i) => i.id);

  const { data: rows } = await supabase
    .from('logs')
    .select('source_id, log_date, value')
    .eq('source_type', sourceType)
    .in('source_id', ids);

  if (!rows) return;

  // Group by source_id
  const logsBySource = {};
  for (const row of rows) {
    (logsBySource[row.source_id] ||= []).push(row);
  }

  for (const item of items) {
    const logs = logsBySource[item.id] || [];
    if (item.currentPeriodStart && item.periodEnd) {
      item.currentValue = logs
        .filter((l) => l.log_date >= item.currentPeriodStart && l.log_date <= item.periodEnd)
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    } else {
      item.currentValue = logs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    }
  }
}

function buildPeriodLabel(start, end) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;
}
