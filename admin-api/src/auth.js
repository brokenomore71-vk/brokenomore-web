import { supabase } from './supabase.js';

/**
 * Lets a request through only if it carries the access token of a signed-in Supabase user whose
 * app_metadata.role is "admin". app_metadata can only be written with the service-role key, so a
 * normal app user can't make themselves an admin, even if public sign-ups are on.
 */
export async function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Session expired' });

  if (data.user.app_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'This account does not have admin access' });
  }

  req.admin = data.user;
  next();
}
