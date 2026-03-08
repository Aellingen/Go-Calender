import { parse } from 'cookie';
import { getSupabase } from './supabase.js';

export async function getAuthUser(req) {
  const supabase = getSupabase();

  // Try Authorization header first, then cookie
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const cookies = parse(req.headers.cookie || '');
    token = cookies.momentum_token;
  }

  if (!token) {
    const err = new Error('UNAUTHORIZED');
    err.status = 401;
    throw err;
  }

  // Validate the Supabase Auth JWT
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authUser) {
    const err = new Error('UNAUTHORIZED');
    err.status = 401;
    throw err;
  }

  // Look up the app user row
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single();

  if (error || !user) {
    const err = new Error('UNAUTHORIZED');
    err.status = 401;
    throw err;
  }

  return { supabase, user };
}

export function sendError(res, error) {
  const status = error.status || 500;
  const message = status === 401 ? 'Unauthorized' : (error.message || 'Internal server error');
  return res.status(status).json({ data: null, error: message });
}
