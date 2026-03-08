import { getAuthUser, sendError } from '../_lib/auth-middleware.js';

export default async function handler(req, res) {
  try {
    const { supabase, user } = await getAuthUser(req);

    // PATCH — update preferences
    if (req.method === 'PATCH') {
      const { theme, default_view, pinnedActionIds } = req.body || {};
      const updates = {};
      if (theme === 'light' || theme === 'dark') updates.theme = theme;
      if (default_view) updates.default_view = default_view;
      if (Array.isArray(pinnedActionIds)) {
        if (pinnedActionIds.length > 5) {
          return res.status(400).json({ data: null, error: 'Max 5 pinned actions' });
        }
        updates.pinned_action_ids = pinnedActionIds;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ data: null, error: 'No valid preferences provided' });
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('workspace_id', user.workspace_id);

      if (error) {
        return res.status(500).json({ data: null, error: 'Failed to save preferences' });
      }

      return res.status(200).json({ data: updates, error: null });
    }

    // GET — fetch session
    return res.status(200).json({
      data: {
        workspace_id: user.workspace_id,
        owner_name: user.owner_name,
        has_databases: true,
        theme: user.theme,
        default_view: user.default_view,
        pending_reset: user.pending_reset ?? false,
        pinnedActionIds: user.pinned_action_ids ?? [],
      },
      error: null,
    });
  } catch (err) {
    return sendError(res, err);
  }
}
