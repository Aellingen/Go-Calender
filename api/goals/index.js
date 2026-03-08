import { getAuthUser, sendError } from '../_lib/auth-middleware.js';
import { toCamelGoal, toSnakeGoal } from '../_lib/transform.js';
import { createGoalSchema } from '../_lib/validators.js';
import { attachCurrentValues } from '../_lib/aggregation.js';

export default async function handler(req, res) {
  try {
    const { supabase, user } = await getAuthUser(req);

    if (req.method === 'GET') {
      const status = req.query.status || 'active';

      const { data: rows, error } = await supabase
        .from('goals')
        .select('*')
        .eq('workspace_id', user.workspace_id)
        .eq('status', status)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) return res.status(500).json({ data: null, error: error.message });

      const goals = rows.map(toCamelGoal);
      await attachCurrentValues(supabase, goals, 'goal');
      return res.status(200).json({ data: goals, error: null });
    }

    if (req.method === 'POST') {
      const parsed = createGoalSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ data: null, error: parsed.error.issues[0].message });
      }

      const insert = {
        workspace_id: user.workspace_id,
        ...toSnakeGoal(parsed.data),
      };

      const { data: row, error } = await supabase
        .from('goals')
        .insert(insert)
        .select()
        .single();

      if (error) return res.status(500).json({ data: null, error: error.message });

      return res.status(201).json({ data: toCamelGoal(row), error: null });
    }

    return res.status(405).json({ data: null, error: 'Method not allowed' });
  } catch (err) {
    return sendError(res, err);
  }
}
