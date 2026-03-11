import { getAuthUser, sendError } from '../_lib/auth-middleware.js';
import { toCamelLog } from '../_lib/transform.js';
import { updateLogSchema } from '../_lib/validators.js';
import { handleLateralLinkEdit, handleGoalLinkEdit } from '../_lib/aggregation.js';

export default async function handler(req, res) {
  try {
    const { supabase, user } = await getAuthUser(req);
    const { id } = req.query;

    if (req.method === 'GET') {
      const { data: row, error } = await supabase
        .from('logs')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', user.workspace_id)
        .single();

      if (error) return res.status(404).json({ data: null, error: 'Log not found' });
      return res.status(200).json({ data: toCamelLog(row), error: null });
    }

    if (req.method === 'PATCH') {
      const parsed = updateLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ data: null, error: parsed.error.issues[0].message });
      }

      // Fetch old log for link delta
      const { data: oldLog } = await supabase
        .from('logs')
        .select('value, source_type, source_id, log_date')
        .eq('id', id)
        .eq('workspace_id', user.workspace_id)
        .single();

      if (!oldLog) return res.status(404).json({ data: null, error: 'Log not found' });

      const { data: row, error } = await supabase
        .from('logs')
        .update({ value: parsed.data.value })
        .eq('id', id)
        .eq('workspace_id', user.workspace_id)
        .select()
        .single();

      if (error) return res.status(500).json({ data: null, error: error.message });

      // Handle lateral link delta if source is an action
      if (oldLog.source_type === 'action') {
        try {
          await handleLateralLinkEdit(
            supabase,
            oldLog.source_id,
            Number(oldLog.value),
            parsed.data.value,
            user.workspace_id,
          );
        } catch (linkErr) {
          console.error('Lateral link edit error:', linkErr.message);
        }
      }

      // Handle goal link delta if source is a goal
      if (oldLog.source_type === 'goal') {
        try {
          await handleGoalLinkEdit(
            supabase,
            user.workspace_id,
            oldLog.source_id,
            Number(oldLog.value),
            parsed.data.value,
            oldLog.log_date,
          );
        } catch (linkErr) {
          console.error('Goal link edit error:', linkErr.message);
        }
      }

      return res.status(200).json({ data: toCamelLog(row), error: null });
    }

    return res.status(405).json({ data: null, error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
}
