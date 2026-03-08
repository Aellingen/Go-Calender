import { getSupabase } from '../_lib/supabase.js';
import { randomUUID } from 'node:crypto';

/**
 * POST /api/auth/signup
 * Called after client-side supabase.auth.signUp() succeeds.
 * Creates the `users` row for the new auth user.
 *
 * Body: { authUserId: string, name: string }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ data: null, error: 'Method not allowed' });
  }

  const { authUserId, name } = req.body || {};

  if (!authUserId) {
    return res.status(400).json({ data: null, error: 'authUserId is required' });
  }

  const supabase = getSupabase();

  // Check if user row already exists
  const { data: existing } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', authUserId)
    .single();

  if (existing) {
    return res.status(200).json({ data: { workspace_id: existing.workspace_id }, error: null });
  }

  const workspaceId = randomUUID();

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      workspace_id: workspaceId,
      auth_user_id: authUserId,
      owner_name: name || '',
      theme: 'light',
      pending_reset: false,
      pinned_action_ids: [],
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ data: null, error: error.message });
  }

  return res.status(201).json({ data: { workspace_id: user.workspace_id }, error: null });
}
