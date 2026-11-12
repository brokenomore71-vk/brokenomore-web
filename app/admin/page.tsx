'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  IconUsers,
  IconUserPlus,
  IconCalendarWeek,
  IconGift,
  IconRefresh,
  IconArrowRight,
  IconActivity,
} from '@tabler/icons-react';
import { supabase } from '@/lib/supabase';
import { adminFetch, formatDate, nf, timeAgo } from '@/lib/admin/client';
import { Avatar, Badge, Button, Card, Delta, EmptyState, ErrorBanner, PageHeader, Skeleton, StatCard } from './_components/ui';

type Stats = {
  totalUsers: number;
  newToday: number;
  new7d: number;
  new30d: number;
  userGrowth: number;
  totalOffers: number | null;
  liveOffers: number | null;
  signups30d: { date: string; count: number }[];
};

type Activity = {
  type: 'signup' | 'offer';
  id: string;
  title: string;
  subtitle: string;
  avatar_url?: string | null;
  timestamp: string;
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, a] = await Promise.all([
        adminFetch<Stats>('/api/admin/stats'),
        adminFetch<{ activities: Activity[] }>('/api/admin/activity?limit=8'),
      ]);
      setStats(s);
      setActivity(a.activities);
      setError(null);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-overview')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_profiles' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const loading = !stats && !error;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <PageHeader
        title={`${greeting()}, Admin`}
        description={
          <>
            {today}
            {updatedAt && <span className="text-(--a-subtle)"> · Updated {timeAgo(updatedAt)}</span>}
          </>
        }
        actions={
          <Button onClick={load} disabled={refreshing}>
            <IconRefresh size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          icon={<IconUsers size={17} />}
          loading={loading}
          value={nf.format(stats?.totalUsers ?? 0)}
          footer={stats && <Delta value={stats.userGrowth} suffix="signups vs last 30d" />}
        />
        <StatCard
          label="New this month"
          tone="green"
          icon={<IconUserPlus size={17} />}
          loading={loading}
          value={nf.format(stats?.new30d ?? 0)}
          footer="Joined in the last 30 days"
        />
        <StatCard
          label="New this week"
          tone="blue"
          icon={<IconCalendarWeek size={17} />}
          loading={loading}
          value={nf.format(stats?.new7d ?? 0)}
          footer={stats && `${nf.format(stats.newToday)} today`}
        />
        <StatCard
          label="Live offers"
          tone="amber"
          icon={<IconGift size={17} />}
          loading={loading}
          value={stats?.liveOffers == null ? '—' : nf.format(stats.liveOffers)}
          footer={
            stats &&
            (stats.totalOffers == null ? 'Offers table not set up' : `${nf.format(stats.totalOffers)} offers in total`)
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="admin-rise xl:col-span-2"
          title="Signups"
          description="New users per day, last 30 days"
          actions={
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-(--a-lavender) hover:text-(--a-text)"
            >
              Analytics <IconArrowRight size={14} />
            </Link>
          }
        >
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.signups30d ?? []} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B70FF" />
                      <stop offset="100%" stopColor="#6C4BFF" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6d6b79', fontSize: 11 }}
                    tickFormatter={(d) => formatDate(d, false)}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6d6b79', fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={<ChartTip />}
                  />
                  <Bar dataKey="count" fill="url(#barFill)" radius={[5, 5, 1, 1]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card
          className="admin-rise"
          title="Recent activity"
          description="Signups and new offers"
          padded={false}
          actions={
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-(--a-lavender) hover:text-(--a-text)"
            >
              All users <IconArrowRight size={14} />
            </Link>
          }
        >
          <div className="px-2 pb-3 pt-2">
            {!activity ? (
              <div className="space-y-3 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 !rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <EmptyState
                icon={<IconActivity size={22} />}
                title="No activity yet"
                description="New signups and offers will show up here."
              />
            ) : (
              <ul>
                {activity.map((a) => (
                  <li
                    key={`${a.type}-${a.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-(--a-raised)"
                  >
                    {a.type === 'signup' ? (
                      <Avatar name={a.title} src={a.avatar_url} size={36} />
                    ) : (
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--a-amber-soft) text-(--a-amber)">
                        <IconGift size={17} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-(--a-text)">{a.title}</p>
                      <p className="truncate text-xs text-(--a-subtle)">{a.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={a.type === 'signup' ? 'accent' : 'amber'}>{a.type === 'signup' ? 'Signup' : 'Offer'}</Badge>
                      <span className="text-[11px] tabular-nums text-(--a-subtle)">{timeAgo(a.timestamp)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-(--a-border-strong) bg-(--a-raised) px-3 py-2 text-xs shadow-xl">
      <p className="text-(--a-subtle)">{formatDate(label)}</p>
      <p className="mt-0.5 font-semibold text-(--a-text)">
        {payload[0].value} {payload[0].value === 1 ? 'signup' : 'signups'}
      </p>
    </div>
  );
}
