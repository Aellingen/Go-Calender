import { getAuthUser, sendError } from '../_lib/auth-middleware.js';
import { toCamelGoal, toSnakeGoal } from '../_lib/transform.js';
import { updateGoalSchema } from '../_lib/validators.js';

export default async function handler(req, res) {
  try {
    const { supabase, user } = await getAuthUser(req);
    const { id } = req.query;

    if (req.method === 'GET') {
      const { data: row, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', user.workspace_id)
        .single();

      if (error) return res.status(404).json({ data: null, error: 'Goal not found' });
      return res.status(200).json({ data: toCamelGoal(row), error: null });
    }

    if (req.method === 'PATCH') {
      const parsed = updateGoalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ data: null, error: parsed.error.issues[0].message });
      }

      const updates = { ...toSnakeGoal(parsed.data), updated_at: new Date().toISOString() };

      const { data: row, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('workspace_id', user.workspace_id)
        .select()
        .single();

      if (error) return res.status(500).json({ data: null, error: error.message });
      return res.status(200).json({ data: toCamelGoal(row), error: null });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('workspace_id', user.workspace_id);

      if (error) return res.status(500).json({ data: null, error: error.message });
      return res.status(200).json({ data: { id }, error: null });
    }

    return res.status(405).json({ data: null, error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
}
