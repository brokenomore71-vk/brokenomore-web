'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconSearch,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconUsers,
  IconX,
  IconMail,
  IconCalendar,
  IconLogin,
  IconShieldCheck,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { adminFetch, formatDate, formatDateTime, nf, timeAgo } from '@/lib/admin/client';
import { cn } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Segmented,
  Skeleton,
} from '../_components/ui';

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type UsersResponse = {
  users: UserRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type UserDetail = {
  profile: Record<string, unknown> & UserRow;
  auth: { last_sign_in_at: string | null; provider: string | null; email_confirmed_at: string | null } | null;
};

const PAGE_SIZE = 20;


export default function UsersPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const reqId = useRef(0);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
      if (search) params.set('search', search);
      const res = await adminFetch<UsersResponse>(`/api/admin/users?${params}`);
      if (id !== reqId.current) return;
      setData(res);
      setError(null);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_profiles' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const p = data?.pagination;
  const from = p && p.total > 0 ? (p.page - 1) * p.limit + 1 : 0;
  const to = p ? Math.min(p.page * p.limit, p.total) : 0;

  return (
    <>
      <PageHeader
        title="Users"
        description={p ? `${nf.format(p.total)} ${search ? 'matching' : 'registered'} users` : 'Everyone using BrokeNoMore'}
        actions={
          <Button onClick={load} disabled={loading}>
            <IconRefresh size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <Card padded={false} className="admin-rise overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-(--a-border) p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search users</span>
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--a-subtle)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="h-10 w-full rounded-xl border border-(--a-border) bg-(--a-bg) pl-9 pr-9 text-sm text-(--a-text) placeholder:text-(--a-subtle) outline-none transition-colors focus:border-(--a-accent)/60"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-(--a-subtle) hover:text-(--a-text)"
              >
                <IconX size={14} />
              </button>
            )}
          </label>
          <Segmented
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
            ]}
          />
        </div>

        {/* Table (sm+) */}
        <div className="hidden sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-(--a-border) text-xs text-(--a-subtle)">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">User ID</th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>
            <tbody className={cn('transition-opacity', loading && data && 'opacity-60')}>
              {!data && loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-(--a-border) last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 !rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                      <td className="hidden px-5 py-3.5 lg:table-cell"><Skeleton className="h-3.5 w-28" /></td>
                      <td />
                    </tr>
                  ))
                : data?.users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className="group cursor-pointer border-b border-(--a-border) transition-colors last:border-0 hover:bg-(--a-raised)/60"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name || u.email} src={u.avatar_url} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-(--a-text)">{u.full_name || 'Unnamed user'}</p>
                            <p className="truncate text-[13px] text-(--a-subtle)">{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-(--a-text)">{formatDate(u.created_at)}</p>
                        <p className="text-xs text-(--a-subtle)">{timeAgo(u.created_at)}</p>
                      </td>
                      <td className="hidden px-5 py-3 font-mono text-xs text-(--a-subtle) lg:table-cell">
                        {u.id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          aria-label={`View ${u.full_name || u.email}`}
                          className="grid h-8 w-8 place-items-center rounded-lg text-(--a-subtle) transition-colors group-hover:bg-(--a-hover) group-hover:text-(--a-text)"
                        >
                          <IconChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* List (mobile) */}
        <ul className="divide-y divide-(--a-border) sm:hidden">
          {!data && loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-9 w-9 !rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </li>
              ))
            : data?.users.map((u) => (
                <li key={u.id}>
                  <button onClick={() => setSelected(u)} className="flex w-full items-center gap-3 p-4 text-left active:bg-(--a-raised)">
                    <Avatar name={u.full_name || u.email} src={u.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.full_name || 'Unnamed user'}</p>
                      <p className="truncate text-xs text-(--a-subtle)">{u.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-(--a-subtle)">{timeAgo(u.created_at)}</span>
                  </button>
                </li>
              ))}
        </ul>

        {data && data.users.length === 0 && (
          <EmptyState
            icon={<IconUsers size={22} />}
            title={search ? `No users match “${search}”` : 'No users yet'}
            description={search ? 'Try a different name or email.' : 'Users appear here as soon as they sign up in the app.'}
            action={search ? <Button size="sm" onClick={() => setQuery('')}>Clear search</Button> : undefined}
          />
        )}

        {/* Pagination */}
        {p && p.total > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-(--a-border) px-4 py-3 text-[13px] text-(--a-subtle)">
            <span className="tabular-nums">
              {nf.format(from)}–{nf.format(to)} of {nf.format(p.total)}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} aria-label="Previous page">
                <IconChevronLeft size={16} />
              </Button>
              <span className="tabular-nums text-(--a-muted)">
                {p.page} / {p.totalPages}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= p.totalPages || loading} onClick={() => setPage(page + 1)} aria-label="Next page">
                <IconChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <UserDrawer user={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function UserDrawer({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  // Results are keyed by user id so switching users never shows stale details.
  const [result, setResult] = useState<{ id: string; detail?: UserDetail; error?: string } | null>(null);
  const current = user && result?.id === user.id ? result : null;
  const detail = current?.detail ?? null;
  const error = current?.error ?? null;
  const open = Boolean(user);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    adminFetch<UserDetail>(`/api/admin/users/${user.id}`)
      .then((d) => alive && setResult({ id: user.id, detail: d }))
      .catch((e) => alive && setResult({ id: user.id, error: e instanceof Error ? e.message : 'Failed to load user' }));
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const prof = detail?.profile;
  const aboutFields = prof
    ? PROFILE_FIELDS.map(({ key, label, format }) => [label, format(prof[key])] as const).filter(
        ([, v]) => v !== null
      )
    : [];
  const categories = asList(prof?.preferred_categories);
  const regions = asList(prof?.preferred_regions);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="User details"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-(--a-border) bg-(--a-surface) shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {user && (
          <>
            <div className="flex items-center justify-between border-b border-(--a-border) px-5 py-4">
              <p className="text-sm font-medium text-(--a-muted)">User details</p>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-(--a-subtle) hover:bg-(--a-raised) hover:text-(--a-text)"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
                <Avatar name={user.full_name || user.email} src={user.avatar_url} size={76} />
                <h2 className="mt-4 text-lg font-semibold">{user.full_name || 'Unnamed user'}</h2>
                <p className="text-sm text-(--a-subtle)">{user.email}</p>
                <div className="mt-3 flex gap-2">
                  {detail?.auth?.provider && <Badge tone="accent">{capitalize(detail.auth.provider)}</Badge>}
                  {detail?.auth && (
                    <Badge tone={detail.auth.email_confirmed_at ? 'green' : 'amber'}>
                      {detail.auth.email_confirmed_at ? 'Verified' : 'Unverified'}
                    </Badge>
                  )}
                </div>
              </div>

              <dl className="mx-5 divide-y divide-(--a-border) rounded-xl border border-(--a-border) bg-(--a-bg)/40">
                <Row icon={<IconMail size={16} />} label="Email" value={user.email || '—'} copy={user.email || undefined} />
                <Row icon={<IconCalendar size={16} />} label="Joined" value={formatDateTime(user.created_at)} />
                <Row
                  icon={<IconLogin size={16} />}
                  label="Last sign in"
                  value={
                    !detail && !error ? (
                      <Skeleton className="h-3.5 w-28" />
                    ) : detail?.auth?.last_sign_in_at ? (
                      timeAgo(detail.auth.last_sign_in_at)
                    ) : (
                      '—'
                    )
                  }
                />
                <Row icon={<IconShieldCheck size={16} />} label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} copy={user.id} />
              </dl>

              {error && <p className="mx-5 mt-4 text-sm text-(--a-red)">{error}</p>}

              {aboutFields.length > 0 && (
                <div className="px-5 pt-6">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-(--a-subtle)">Profile</p>
                  <dl className="divide-y divide-(--a-border) rounded-xl border border-(--a-border) bg-(--a-bg)/40">
                    {aboutFields.map(([label, value]) => (
                      <Row key={label} label={label} value={value} />
                    ))}
                  </dl>
                </div>
              )}

              {(categories.length > 0 || regions.length > 0) && (
                <div className="space-y-4 px-5 pt-6">
                  {categories.length > 0 && <ChipGroup title="Preferred categories" items={categories} />}
                  {regions.length > 0 && <ChipGroup title="Preferred regions" items={regions} />}
                </div>
              )}
              <div className="h-8" />
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Row({
  icon,
  label,
  value,
  copy,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  copy?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {icon && <span className="text-(--a-subtle)">{icon}</span>}
      <dt className="w-28 shrink-0 text-[13px] text-(--a-subtle)">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-right text-[13px] text-(--a-text)">{value}</dd>
      {copy && <CopyButton value={copy} label={`Copy ${label.toLowerCase()}`} />}
    </div>
  );
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-(--a-subtle)">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((c) => (
          <Badge key={c}>{humanize(c)}</Badge>
        ))}
      </div>
    </div>
  );
}

function humanize(key: string) {
  return capitalize(key.replace(/_/g, ' '));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x);
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

const text = (v: unknown) => (v === null || v === undefined || v === '' ? null : humanize(String(v)));
const yesNo = (yes: string, no: string) => (v: unknown) => (typeof v === 'boolean' ? (v ? yes : no) : null);
const dateTime = (v: unknown) => (typeof v === 'string' && !isNaN(Date.parse(v)) ? formatDateTime(v) : null);

/**
 * Profile fields shown to the admin. This list is explicit on purpose: financial
 * fields (monthly_income, my_balance, total_spend) are deliberately left out.
 */
const PROFILE_FIELDS: { key: string; label: string; format: (v: unknown) => string | null }[] = [
  { key: 'is_completed', label: 'Onboarding', format: yesNo('Complete', 'Incomplete') },
  { key: 'age', label: 'Age', format: text },
  { key: 'gender', label: 'Gender', format: text },
  { key: 'occupation', label: 'Occupation', format: text },
  { key: 'education_level', label: 'Education', format: text },
  { key: 'location', label: 'Location', format: text },
  { key: 'tc_pp_agreed', label: 'Accepted T&C', format: yesNo('Yes', 'No') },
  { key: 'welcome_email_sent', label: 'Welcome email', format: yesNo('Sent', 'Not sent') },
  { key: 'updated_at', label: 'Profile updated', format: dateTime },
];
