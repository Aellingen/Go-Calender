import { getAuthUser, sendError } from '../_lib/auth-middleware.js';
import { toCamelLog } from '../_lib/transform.js';
import { createLogSchema } from '../_lib/validators.js';
import { handleLateralLinks, handleGoalLink } from '../_lib/aggregation.js';

export default async function handler(req, res) {
  try {
    const { supabase, user } = await getAuthUser(req);

    if (req.method === 'GET') {
      const { sourceId, sourceType } = req.query;

      if (!sourceId || !sourceType) {
        return res.status(400).json({ data: null, error: 'sourceId and sourceType are required' });
      }

      const { data: rows, error } = await supabase
        .from('logs')
        .select('*')
        .eq('source_id', sourceId)
        .eq('source_type', sourceType)
        .eq('workspace_id', user.workspace_id)
        .order('log_date', { ascending: false });

      if (error) return res.status(500).json({ data: null, error: error.message });
      return res.status(200).json({ data: rows.map(toCamelLog), error: null });
    }

    if (req.method === 'POST') {
      const parsed = createLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ data: null, error: parsed.error.issues[0].message });
      }

      const { data: row, error } = await supabase
        .from('logs')
        .insert({
          workspace_id: user.workspace_id,
          source_type: parsed.data.sourceType,
          source_id: parsed.data.sourceId,
          log_date: parsed.data.logDate,
          value: parsed.data.value,
          entry_type: parsed.data.entryType,
        })
        .select()
        .single();

      if (error) return res.status(500).json({ data: null, error: error.message });

      // Handle lateral links if source is an action
      if (parsed.data.sourceType === 'action') {
        try {
          await handleLateralLinks(supabase, parsed.data.sourceId, parsed.data.value, user.workspace_id);
        } catch (linkErr) {
          console.error('Lateral link error:', linkErr.message);
        }
      }

      // Handle goal links if source is a goal
      if (parsed.data.sourceType === 'goal') {
        try {
          await handleGoalLink(supabase, user.workspace_id, parsed.data.sourceId, parsed.data.value, parsed.data.logDate);
        } catch (linkErr) {
          console.error('Goal link error:', linkErr.message);
        }
      }

      return res.status(201).json({ data: toCamelLog(row), error: null });
    }

    return res.status(405).json({ data: null, error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
}
