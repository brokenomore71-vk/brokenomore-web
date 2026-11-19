import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAdmin } from '../auth.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const DAY_MS = 24 * 60 * 60 * 1000;
// Days are counted in India time (IST, UTC+5:30, no daylight saving).
const IST_MS = 330 * 60 * 1000;

/** Midnight IST at the start of the day `daysBack` days ago, as a UTC Date. */
const istMidnight = (daysBack = 0) =>
  new Date((Math.floor((Date.now() + IST_MS) / DAY_MS) - daysBack) * DAY_MS - IST_MS);

/** YYYY-MM-DD of a timestamp, in IST. */
const istDay = (ts) => new Date(new Date(ts).getTime() + IST_MS).toISOString().slice(0, 10);

/** Removes characters that mean something inside a PostgREST or() filter. */
const cleanSearch = (s) => String(s || '').replace(/[,()*%\\:."']/g, ' ').trim().slice(0, 80);

/** Users who signed up in [from, to). Either end may be null (open). */
async function countBetween(from, to, excludeId) {
  let q = supabase.from('user_profiles').select('id', { count: 'exact', head: true }).neq('id', excludeId);
  if (from) q = q.gte('created_at', from.toISOString());
  if (to) q = q.lt('created_at', to.toISOString());
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

adminRouter.get('/me', (req, res) => {
  res.json({ id: req.admin.id, email: req.admin.email });
});

// Headline numbers. "last7" is today plus the 6 days before it; "prev7" is the 7 days before that.
adminRouter.get('/overview', async (req, res) => {
  try {
    const id = req.admin.id;
    const [total, today, last7, prev7, last30] = await Promise.all([
      countBetween(null, null, id),
      countBetween(istMidnight(0), null, id),
      countBetween(istMidnight(6), null, id),
      countBetween(istMidnight(13), istMidnight(6), id),
      countBetween(istMidnight(29), null, id),
    ]);
    res.json({ total, today, last7, prev7, last30 });
  } catch (err) {
    console.error('overview failed:', err);
    res.status(500).json({ error: 'Could not load the overview' });
  }
});

// Sign-ups per IST day for the last ?days= days (7 or 30), oldest first, zero-filled.
// `before` is how many users existed before the first day, for a running-total line.
adminRouter.get('/signups', async (req, res) => {
  try {
    const days = req.query.days === '30' ? 30 : 7;
    const start = istMidnight(days - 1);

    const stamps = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('created_at')
        .neq('id', req.admin.id)
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: true })
        .range(from, from + 999);
      if (error) throw error;
      stamps.push(...data.map((r) => r.created_at));
      if (data.length < 1000) break;
    }

    const counts = new Map();
    for (const ts of stamps) counts.set(istDay(ts), (counts.get(istDay(ts)) || 0) + 1);

    const series = [];
    for (let i = 0; i < days; i++) {
      const date = istDay(start.getTime() + i * DAY_MS);
      series.push({ date, count: counts.get(date) || 0 });
    }

    const before = await countBetween(null, start, req.admin.id);
    res.json({ days: series, before });
  } catch (err) {
    console.error('signups failed:', err);
    res.status(500).json({ error: 'Could not load sign-ups' });
  }
});

// Newest sign-ups first, with name and email. ?page=1&limit=20&search=
adminRouter.get('/users', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = cleanSearch(req.query.search);
    const from = (page - 1) * limit;

    let q = supabase
      .from('user_profiles')
      .select('id, full_name, email, avatar_url, created_at', { count: 'exact' })
      .neq('id', req.admin.id)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, count, error } = await q;
    if (error) throw error;

    const total = count ?? 0;
    res.json({
      users: data ?? [],
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error('users failed:', err);
    res.status(500).json({ error: 'Could not load users' });
  }
});
