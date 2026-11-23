'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconCalendarEvent,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCreditCard,
  IconLayoutDashboard,
  IconLoader2,
  IconLogout,
  IconMail,
  IconMenu2,
  IconHelpCircle,
  IconPresentation,
  IconRefresh,
  IconSearch,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { adminGet, adminSupabase, AdminApiError, isAdminSession } from '@/lib/admin/client';
import { C, GrowthLine, Ring, SignupBars, type DayPoint } from './charts';

type Overview = { total: number; today: number; last7: number; prev7: number; last30: number };
type Signups = { days: DayPoint[]; before: number };
type AdminUser = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; created_at: string };
type UsersPage = { users: AdminUser[]; page: number; limit: number; total: number; totalPages: number };

const PAGE_SIZE = 7;
const nf = new Intl.NumberFormat('en-IN');

// Everything is shown in India time, matching the API's day boundaries.
const TZ = 'Asia/Kolkata';
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: TZ });
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }); // YYYY-MM-DD

/** Whole IST calendar days between a timestamp and today. */
function daysAgo(iso: string) {
  return Math.round((Date.parse(dayKey.format(new Date())) - Date.parse(dayKey.format(new Date(iso)))) / 86_400_000);
}

function initials(name: string | null, email: string | null) {
  const src = (name || email || '?').trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (name ? parts[1]?.[0] || '' : '')).toUpperCase();
}

function Avatar({ user, size = 32, ring }: { user: AdminUser; size?: number; ring?: string }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined };
  // Some app avatars are local asset paths, not web URLs; those fall back to initials.
  if (user.avatar_url && /^https?:\/\//i.test(user.avatar_url) && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote avatars from any host (Google, Supabase storage)
      <img
        src={user.avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: Math.round(size * 0.3) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#3a3a42] font-semibold text-[#e4e4e7]"
    >
      {initials(user.full_name, user.email)}
    </span>
  );
}

function StatusPill({ iso }: { iso: string }) {
  const n = daysAgo(iso);
  const [label, cls] =
    n <= 0
      ? ['Today', 'bg-[#E9875A]/15 text-[#f4b393]']
      : n < 7
        ? ['This week', 'bg-[#9085e9]/15 text-[#c3bcff]']
        : ['Earlier', 'bg-white/[0.06] text-[#a1a1aa]'];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>{label}</span>;
}

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-[24px] bg-[#26262B] p-5 sm:p-6 ${className}`}>{children}</section>;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [signups, setSignups] = useState<Signups | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [usersPage, setUsersPage] = useState<UsersPage | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState('');
  const usersReq = useRef(0);

  const signOut = useCallback(async () => {
    await adminSupabase.auth.signOut();
    router.replace('/admin');
  }, [router]);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof AdminApiError && (e.status === 401 || e.status === 403)) return void signOut();
      setError(e instanceof Error ? e.message : 'Something went wrong');
    },
    [signOut]
  );

  // Guard: only an admin session may see this page.
  useEffect(() => {
    adminSupabase.auth.getSession().then(({ data }) => {
      if (!isAdminSession(data.session)) router.replace('/admin');
      else setAdminEmail(data.session!.user.email ?? null);
    });
    const { data: sub } = adminSupabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (session && !isAdminSession(session))) router.replace('/admin');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [o, s] = await Promise.all([adminGet<Overview>('/admin/overview'), adminGet<Signups>('/admin/signups?days=30')]);
      setOverview(o);
      setSignups(s);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadUsers = useCallback(async () => {
    const id = ++usersReq.current;
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (query) params.set('search', query);
      const u = await adminGet<UsersPage>(`/admin/users?${params}`);
      if (id === usersReq.current) setUsersPage(u);
    } catch (e) {
      if (id === usersReq.current) handleError(e);
    } finally {
      if (id === usersReq.current) setUsersLoading(false);
    }
  }, [page, query, handleError]);

  useEffect(() => {
    if (adminEmail) loadStats();
  }, [adminEmail, loadStats]);

  useEffect(() => {
    if (adminEmail) loadUsers();
  }, [adminEmail, loadUsers]);

  const refresh = () => {
    loadStats();
    loadUsers();
  };

  // Chart data
  const bars = useMemo(() => (signups ? signups.days.slice(-range) : []), [signups, range]);
  const growth = useMemo(() => {
    if (!signups) return [];
    let run = signups.before;
    return signups.days.map((p) => ({ date: p.date, count: (run += p.count) }));
  }, [signups]);
  const rangeTotal = bars.reduce((s, p) => s + p.count, 0);

  if (!adminEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1C1C20]">
        <IconLoader2 className="h-6 w-6 animate-spin text-[#85868c]" />
      </main>
    );
  }

  const weekDiff = overview ? overview.last7 - overview.prev7 : 0;
  const weekPct = overview && overview.prev7 > 0 ? Math.round((weekDiff / overview.prev7) * 100) : null;
  const restOfWeek = overview ? overview.last7 - overview.today : 0;
  const older = overview ? overview.total - overview.last7 : 0;
  const latest = usersPage && !query && page === 1 ? usersPage.users.slice(0, 5) : [];

  const users = usersPage?.users ?? [];
  const firstRow = usersPage && usersPage.total ? (usersPage.page - 1) * usersPage.limit + 1 : 0;
  const lastRow = usersPage ? Math.min(usersPage.page * usersPage.limit, usersPage.total) : 0;

  return (
    <div className="flex min-h-screen bg-[#1C1C20]">
      {/* Sidebar */}
      {navOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setNavOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/[0.06] bg-[#1C1C20] px-4 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-2">
          <Image src="/assets/images/main_logo.png" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-lg" />
          <span className="text-[15px] font-semibold tracking-[0.06em]">BROKENOMORE</span>
          <button className="ml-auto text-[#85868c] lg:hidden" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <IconX size={20} />
          </button>
        </div>

        <nav className="mt-10 space-y-1.5">
          <a href="#top" onClick={() => setNavOpen(false)} className="flex items-center gap-3 rounded-xl bg-[#2C2C32] px-3.5 py-2.5 text-sm font-medium text-white">
            <IconLayoutDashboard size={19} stroke={1.6} />
            Dashboard
          </a>

          <p className="px-3.5 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wider text-[#5c5c63]">App content</p>
          {[
            { href: '/admin/content/credit-cards', label: 'Credit Cards', Icon: IconCreditCard },
            { href: '/admin/content/festivals', label: 'Festivals', Icon: IconCalendarEvent },
            { href: '/admin/content/feature-slides', label: 'Feature Slides', Icon: IconPresentation },
            { href: '/admin/content/faqs', label: 'FAQs', Icon: IconHelpCircle },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[#a1a1aa] transition hover:bg-white/[0.04] hover:text-white"
            >
              <Icon size={19} stroke={1.6} />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="mt-auto flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-[#a1a1aa] transition hover:bg-white/[0.04] hover:text-white"
        >
          <IconLogout size={19} stroke={1.6} />
          Log out
        </button>
      </aside>

      {/* Main */}
      <div id="top" className="min-w-0 flex-1 px-4 pb-10 pt-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button className="text-[#a1a1aa] lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <IconMenu2 size={22} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Overview</h1>

          <label className="relative order-last w-full md:order-none md:ml-10 md:w-80">
            <span className="sr-only">Search users</span>
            <IconSearch size={17} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[#8b8b94]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email…"
              className="h-10 w-full bg-transparent pl-7 text-sm outline-none placeholder:text-[#8b8b94]"
            />
          </label>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={refresh}
              disabled={loading || usersLoading}
              aria-label="Refresh"
              title="Refresh"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-[#d4d4d8] transition hover:border-white/25 disabled:opacity-50"
            >
              <IconRefresh size={18} className={loading || usersLoading ? 'animate-spin' : ''} />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-11 items-center gap-1.5 rounded-full border border-white/10 pl-1 pr-2.5 transition hover:border-white/25"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A9A2FF] text-sm font-bold text-[#17171a]">
                  {adminEmail[0]?.toUpperCase()}
                </span>
                <IconChevronDown size={15} className="text-[#a1a1aa]" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-white/10 bg-[#26262B] p-2 shadow-2xl">
                    <p className="truncate px-3 py-2 text-xs text-[#8b8b94]">{adminEmail}</p>
                    <button
                      role="menuitem"
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[#e4e4e7] hover:bg-white/[0.05]"
                    >
                      <IconLogout size={17} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#fca5a5]">
            <span>{error}</span>
            <button onClick={refresh} className="shrink-0 font-medium text-white underline-offset-2 hover:underline">
              Try again
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Total users (feature card) */}
          <section className="relative flex min-h-[270px] flex-col overflow-hidden rounded-[24px] bg-[#A9A2FF] p-6 text-[#17171a]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                <IconUsers size={20} stroke={1.8} />
              </span>
              <h2 className="text-lg font-semibold">Total users</h2>
            </div>

            {/* Latest sign-ups as an avatar stack */}
            <div className="mt-6 flex min-h-[56px] items-center">
              {latest.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {latest.map((u) => (
                      <span key={u.id} title={u.full_name || u.email || ''}>
                        <Avatar user={u} size={48} ring="#A9A2FF" />
                      </span>
                    ))}
                  </div>
                  <p className="ml-3 text-xs font-medium leading-tight text-[#17171a]/70">
                    Latest
                    <br />
                    sign-ups
                  </p>
                </>
              ) : (
                <div className="flex -space-x-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="h-12 w-12 rounded-full bg-[#17171a]/10 ring-2 ring-[#A9A2FF]" />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto pt-6">
              {overview ? (
                <>
                  <p className="text-sm">
                    <span className="font-semibold">+{nf.format(overview.last7)}</span>
                    <span className="text-[#17171a]/70"> in the last 7 days</span>
                  </p>
                  <p className="mt-1 text-[44px] font-bold leading-none tracking-tight tabular-nums">{nf.format(overview.total)}</p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-[#17171a]/10" />
                  <div className="h-11 w-28 animate-pulse rounded bg-[#17171a]/10" />
                </div>
              )}
            </div>
          </section>

          {/* Daily sign-ups */}
          <Card className="flex min-h-[270px] flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Sign-ups</h2>
                <p className="mt-0.5 text-xs text-[#8b8b94]">
                  <span className="font-medium text-[#e4e4e7] tabular-nums">{nf.format(rangeTotal)}</span> in the last {range} days
                </p>
              </div>
              <div className="flex rounded-full bg-[#1C1C20] p-1 text-xs" role="group" aria-label="Range">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className={`rounded-full px-3 py-1 transition ${range === r ? 'bg-[#3a3a42] font-medium text-white' : 'text-[#8b8b94] hover:text-white'}`}
                  >
                    {r === 7 ? 'Week' : 'Month'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 min-h-[170px] flex-1">
              {signups ? <SignupBars data={bars} range={range} /> : <Skeleton className="h-full w-full" />}
            </div>
          </Card>

          {/* Growth */}
          <Card className="flex min-h-[270px] flex-col md:col-span-2 xl:col-span-1">
            <div>
              <h2 className="text-lg font-semibold">User growth</h2>
              <p className="mt-0.5 text-xs text-[#8b8b94]">Total users, last 30 days · {monthFmt.format(new Date())}</p>
            </div>
            <div className="mt-4 min-h-[170px] flex-1">{signups ? <GrowthLine data={growth} /> : <Skeleton className="h-full w-full" />}</div>
          </Card>

          {/* New users table */}
          <Card className="scroll-mt-6 md:col-span-2 xl:col-span-2 !px-0 !pb-2" >
            <div id="users" className="flex items-start justify-between gap-3 px-5 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold">New users</h2>
                <p className="mt-0.5 text-xs text-[#8b8b94]">
                  {usersPage ? `${nf.format(usersPage.total)} ${query ? 'matching' : 'users'}` : 'Loading…'}
                  {query && <> · “{query}”</>}
                </p>
              </div>
              {usersPage && usersPage.totalPages > 1 && (
                <div className="flex items-center gap-1 text-xs text-[#8b8b94]">
                  <span className="mr-1 hidden tabular-nums sm:inline">
                    {firstRow}–{lastRow}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1 || usersLoading}
                    aria-label="Previous page"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#d4d4d8] hover:border-white/25 disabled:opacity-30"
                  >
                    <IconChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, usersPage.totalPages))}
                    disabled={page >= usersPage.totalPages || usersLoading}
                    aria-label="Next page"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[#d4d4d8] hover:border-white/25 disabled:opacity-30"
                  >
                    <IconChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-xs text-[#7b7b84]">
                    <th className="px-5 pb-3 font-normal sm:px-6">Name</th>
                    <th className="hidden px-3 pb-3 font-normal md:table-cell">Email</th>
                    <th className="pb-3 pl-3 pr-5 font-normal sm:px-3">Joined</th>
                    <th className="hidden px-3 pb-3 font-normal sm:table-cell">Status</th>
                    <th className="hidden px-5 pb-3 text-right font-normal sm:table-cell sm:px-6">Contact</th>
                  </tr>
                </thead>
                <tbody className={usersLoading && usersPage ? 'opacity-50 transition-opacity' : ''}>
                  {!usersPage &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-5 py-3 sm:px-6">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))}

                  {usersPage && users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#8b8b94]">
                        {query ? `No users match “${query}”.` : 'No users yet.'}
                      </td>
                    </tr>
                  )}

                  {users.map((u) => (
                    <tr key={u.id} className="transition hover:bg-white/[0.025]">
                      <td className="px-5 py-2.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} size={32} />
                          <div className="min-w-0">
                            <p className={u.full_name ? 'font-medium text-[#f4f4f5] md:whitespace-nowrap' : 'italic text-[#7b7b84]'}>{u.full_name || 'No name yet'}</p>
                            <p className="max-w-[38vw] truncate text-xs text-[#8b8b94] md:hidden" title={u.email || ''}>{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-2.5 text-[#a1a1aa] md:table-cell">{u.email || '—'}</td>
                      <td className="whitespace-nowrap py-2.5 pl-3 pr-5 text-[#d4d4d8] tabular-nums sm:px-3">
                        {dateFmt.format(new Date(u.created_at))}
                        <span className="block text-[11px] text-[#7b7b84]">{timeFmt.format(new Date(u.created_at))}</span>
                      </td>
                      <td className="hidden px-3 py-2.5 sm:table-cell">
                        <StatusPill iso={u.created_at} />
                      </td>
                      <td className="hidden px-5 py-2.5 text-right sm:table-cell sm:px-6">
                        {u.email && (
                          <a
                            href={`mailto:${u.email}`}
                            aria-label={`Email ${u.full_name || u.email}`}
                            className="inline-flex items-center gap-1.5 text-[#a9a2ff] hover:text-[#c9c4ff]"
                          >
                            <IconMail size={16} />
                            <span className="hidden sm:inline">Email</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Weekly activity ring */}
          <Card className="flex flex-col md:col-span-2 xl:col-span-1">
            <h2 className="text-lg font-semibold">This week</h2>
            <p className="mt-0.5 text-xs text-[#8b8b94]">New users vs the 7 days before</p>
            <div className="flex flex-1 items-center justify-center py-6">
              {overview ? (
                <Ring
                  segments={[
                    { value: overview.today, color: C.orange },
                    { value: restOfWeek, color: C.violet },
                    { value: older, color: C.older },
                  ]}
                >
                  <p className="text-[34px] font-bold leading-none tabular-nums">
                    {weekPct === null ? `+${nf.format(overview.last7)}` : `${weekPct >= 0 ? '+' : ''}${weekPct}%`}
                  </p>
                  <p className="mt-1.5 text-xs text-[#8b8b94]">{weekPct === null ? 'new this week' : 'vs last week'}</p>
                </Ring>
              ) : (
                <Skeleton className="h-[184px] w-[184px] !rounded-full" />
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              {[
                { label: 'Today', value: overview?.today, color: C.orange },
                { label: 'Earlier this week', value: restOfWeek, color: C.violet },
                { label: 'Before this week', value: older, color: C.older },
                { label: 'Last week', value: overview?.prev7, color: null },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  {r.color ? (
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full border border-[#8b8b94]" />
                  )}
                  <dt className="text-[#d4d4d8]">{r.label}</dt>
                  <dd className="ml-auto tabular-nums text-[#8b8b94]">{overview ? nf.format(r.value ?? 0) : '–'}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
