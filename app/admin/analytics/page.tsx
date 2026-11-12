'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IconUserPlus, IconTrendingUp, IconFlame, IconUsers } from '@tabler/icons-react';
import { adminFetch, formatDate, nf } from '@/lib/admin/client';
import { Card, Delta, ErrorBanner, PageHeader, Segmented, Skeleton, StatCard } from '../_components/ui';

type Period = '7d' | '30d' | '90d' | '1y';

type Analytics = {
  period: Period;
  data: { date: string; new_users: number; total_users: number }[];
  newUsers: number;
  change: number;
  avgPerDay: number;
  peakDay: { date: string; count: number } | null;
  totalUsers: number;
};

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
];

const PERIOD_TEXT: Record<Period, string> = {
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days',
  '1y': 'last 12 months',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AXIS = { fill: '#6d6b79', fontSize: 11 };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [view, setView] = useState<'total' | 'daily'>('total');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminFetch<Analytics>(`/api/admin/analytics/users?period=${period}`));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  // For the 1-year view, aggregate daily points into weeks so bars stay legible.
  const series = useMemo(() => {
    if (!data) return [];
    if (period !== '1y') return data.data;
    const weeks: Analytics['data'] = [];
    for (let i = 0; i < data.data.length; i += 7) {
      const chunk = data.data.slice(i, i + 7);
      weeks.push({
        date: chunk[0].date,
        new_users: chunk.reduce((s, d) => s + d.new_users, 0),
        total_users: chunk[chunk.length - 1].total_users,
      });
    }
    return weeks;
  }, [data, period]);

  const byWeekday = useMemo(() => {
    const counts = Array(7).fill(0) as number[];
    data?.data.forEach((d) => {
      const day = (new Date(d.date + 'T00:00:00Z').getUTCDay() + 6) % 7; // Mon = 0
      counts[day] += d.new_users;
    });
    const max = Math.max(...counts);
    return WEEKDAYS.map((label, i) => ({ label, count: counts[i], top: max > 0 && counts[i] === max }));
  }, [data]);

  const first = data?.data[0]?.total_users ?? 0;
  const growthPct = data && first > 0 ? ((data.totalUsers - first) / first) * 100 : 0;
  const showSkeleton = loading && !data;

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`How BrokeNoMore is growing, ${PERIOD_TEXT[period]}`}
        actions={<Segmented value={period} onChange={setPeriod} options={PERIODS} />}
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New users"
          icon={<IconUserPlus size={17} />}
          loading={showSkeleton}
          value={nf.format(data?.newUsers ?? 0)}
          footer={data && <Delta value={data.change} suffix="vs previous period" />}
        />
        <StatCard
          label="Average per day"
          tone="blue"
          icon={<IconTrendingUp size={17} />}
          loading={showSkeleton}
          value={data?.avgPerDay.toLocaleString('en-IN') ?? '0'}
          footer="Signups per day"
        />
        <StatCard
          label="Best day"
          tone="amber"
          icon={<IconFlame size={17} />}
          loading={showSkeleton}
          value={data?.peakDay ? nf.format(data.peakDay.count) : '—'}
          footer={data?.peakDay ? formatDate(data.peakDay.date) : 'No signups in this period'}
        />
        <StatCard
          label="Total users"
          tone="green"
          icon={<IconUsers size={17} />}
          loading={showSkeleton}
          value={nf.format(data?.totalUsers ?? 0)}
          footer={data && `+${growthPct.toFixed(1)}% over the period`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="admin-rise xl:col-span-2"
          title={view === 'total' ? 'Total users' : period === '1y' ? 'New users per week' : 'New users per day'}
          description={view === 'total' ? 'Total registered users over time' : 'Signup volume'}
          actions={
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'total', label: 'Total' },
                { value: 'daily', label: 'New' },
              ]}
            />
          }
        >
          {showSkeleton ? (
            <Skeleton className="h-[320px] w-full" />
          ) : (
            <div className={`h-[320px] w-full transition-opacity ${loading ? 'opacity-50' : ''}`}>
              <ResponsiveContainer width="100%" height="100%">
                {view === 'total' ? (
                  <AreaChart data={series} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6C4BFF" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6C4BFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(d) => formatDate(d, false)} minTickGap={32} />
                    <YAxis tickLine={false} axisLine={false} tick={AXIS} width={48} allowDecimals={false} domain={['dataMin', 'auto']} tickFormatter={(v) => nf.format(v)} />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.15)' }} content={<Tip unit="users" field="total_users" />} />
                    <Area type="monotone" dataKey="total_users" stroke="#8B70FF" strokeWidth={2} fill="url(#areaFill)" activeDot={{ r: 4, fill: '#fff', stroke: '#6C4BFF', strokeWidth: 2 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={series} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(d) => formatDate(d, false)} minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} tick={AXIS} width={40} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<Tip unit="signups" field="new_users" />} />
                    <Bar dataKey="new_users" fill="#6C4BFF" radius={[4, 4, 1, 1]} maxBarSize={24} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="admin-rise" title="Signups by weekday" description={`Which days people join, ${PERIOD_TEXT[period]}`}>
          {showSkeleton ? (
            <Skeleton className="h-[320px] w-full" />
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byWeekday} layout="vertical" margin={{ top: 0, right: 8, left: -12, bottom: 0 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 12 }} width={44} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<WeekdayTip />} />
                  <Bar dataKey="count" radius={[2, 6, 6, 2]} barSize={18}>
                    {byWeekday.map((d) => (
                      <Cell key={d.label} fill={d.top ? '#B4A6E6' : 'rgba(180,166,230,0.28)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

type TipProps = {
  active?: boolean;
  label?: string;
  payload?: { value: number }[];
  unit: string;
  field: string;
};

function Tip({ active, payload, label, unit }: TipProps) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-(--a-border-strong) bg-(--a-raised) px-3 py-2 text-xs shadow-xl">
      <p className="text-(--a-subtle)">{formatDate(label)}</p>
      <p className="mt-0.5 font-semibold text-(--a-text)">
        {nf.format(payload[0].value)} {unit}
      </p>
    </div>
  );
}

function WeekdayTip({ active, payload, label }: { active?: boolean; label?: string; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-(--a-border-strong) bg-(--a-raised) px-3 py-2 text-xs shadow-xl">
      <p className="text-(--a-subtle)">{label}</p>
      <p className="mt-0.5 font-semibold text-(--a-text)">{nf.format(payload[0].value)} signups</p>
    </div>
  );
}
