import { getAuthUser, sendError } from '../_lib/auth-middleware.js';
import { toCamelAction, toSnakeAction } from '../_lib/transform.js';
import { createActionSchema } from '../_lib/validators.js';
import { attachCurrentValues } from '../_lib/aggregation.js';

export default async function handler(req, res) {
  try {
    const { supabase, user } = await getAuthUser(req);

    if (req.method === 'GET') {
      const { goalId, status } = req.query;

      let query = supabase
        .from('actions')
        .select('*')
        .eq('workspace_id', user.workspace_id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (goalId) query = query.eq('parent_goal_id', goalId);
      if (status) query = query.eq('status', status);

      const { data: rows, error } = await query;
      if (error) return res.status(500).json({ data: null, error: error.message });

      const actions = rows.map(toCamelAction);
      await attachCurrentValues(supabase, actions, 'action');
      return res.status(200).json({ data: actions, error: null });
    }

    if (req.method === 'POST') {
      const parsed = createActionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ data: null, error: parsed.error.issues[0].message });
      }

      const insert = {
        workspace_id: user.workspace_id,
        ...toSnakeAction(parsed.data),
      };

      const { data: row, error } = await supabase
        .from('actions')
        .insert(insert)
        .select()
        .single();

      if (error) return res.status(500).json({ data: null, error: error.message });
      return res.status(201).json({ data: toCamelAction(row), error: null });
    }

    return res.status(405).json({ data: null, error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
}
