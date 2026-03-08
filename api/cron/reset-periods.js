import { getSupabase } from '../_lib/supabase.js';
import { isPeriodExpired } from '../_lib/dates.js';

export default async function handler(req, res) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabase();

  // Fetch all users not already flagged
  const { data: users, error } = await supabase
    .from('users')
    .select('workspace_id, pending_reset')
    .eq('pending_reset', false);

  if (error) {
    console.error('Failed to fetch users:', error.message);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }

  let flaggedCount = 0;

  for (const user of users) {
    try {
      // Check goals with recurrence
      const { data: goals } = await supabase
        .from('goals')
        .select('period_end')
        .eq('workspace_id', user.workspace_id)
        .eq('status', 'active')
        .neq('recurrence_mode', 'none')
        .not('period_end', 'is', null);

      let hasExpired = (goals || []).some((g) => isPeriodExpired(g.period_end));

      // Check actions if no expired goals
      if (!hasExpired) {
        const { data: actions } = await supabase
          .from('actions')
          .select('period_end')
          .eq('workspace_id', user.workspace_id)
          .eq('status', 'active')
          .neq('recurrence_mode', 'none')
          .not('period_end', 'is', null);

        hasExpired = (actions || []).some((a) => isPeriodExpired(a.period_end));
      }

      if (hasExpired) {
        await supabase
          .from('users')
          .update({ pending_reset: true })
          .eq('workspace_id', user.workspace_id);
        flaggedCount++;
      }
    } catch (err) {
      console.error(`Cron error for workspace ${user.workspace_id}:`, err.message);
    }
  }

  return res.status(200).json({
    ok: true,
    flagged: flaggedCount,
    checked: users.length,
  });
}
