'use client';

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

export type DayPoint = { date: string; count: number };

// Chart colors (validated on the #26262B card surface)
export const C = {
  violet: '#9085e9',
  orange: '#E9875A',
  barRest: '#4A4A52',
  older: '#8b8b94',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#7b7b84',
};

const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' });
const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

function ChartTip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length || !label) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-lg border border-white/10 bg-[#141417] px-3 py-2 text-xs shadow-xl">
      <p className="text-[#8b8b94]">{fullDate.format(d(label))}</p>
      <p className="mt-0.5 font-semibold text-white">
        {v} {unit}
        {v === 1 ? '' : 's'}
      </p>
    </div>
  );
}

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: C.axis, fontSize: 11 },
} as const;

/** Daily sign-ups as bars; the last bar (today) is highlighted. */
export function SignupBars({ data, range }: { data: DayPoint[]; range: 7 | 30 }) {
  const last = data.length - 1;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barCategoryGap={range === 7 ? '38%' : '22%'}>
        <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          {...axisProps}
          interval={range === 7 ? 0 : 6}
          tickFormatter={(v: string) => (range === 7 ? weekday.format(d(v)) : dayMonth.format(d(v)))}
        />
        <YAxis {...axisProps} allowDecimals={false} width={44} />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTip unit="sign-up" />} />
        <Bar dataKey="count" radius={[4, 4, 4, 4]} maxBarSize={14} minPointSize={2}>
          {data.map((p, i) => (
            <Cell key={p.date} fill={i === last ? C.orange : C.barRest} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Running total of users over the period. */
export function GrowthLine({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.violet} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="4 4" />
        <XAxis dataKey="date" {...axisProps} interval={6} tickFormatter={(v: string) => String(d(v).getUTCDate())} />
        <YAxis {...axisProps} allowDecimals={false} width={44} />
        <Tooltip
          cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeWidth: 12, strokeOpacity: 0.15 }}
          content={<ChartTip unit="total user" />}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={C.violet}
          strokeWidth={2}
          fill="url(#growthFill)"
          activeDot={{ r: 5, fill: C.orange, stroke: '#26262B', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Ring split into segments with a 2px gap between them; text sits in the middle. */
export function Ring({
  segments,
  children,
}: {
  segments: { value: number; color: string }[];
  children: React.ReactNode;
}) {
  const size = 184;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  // Round caps poke out stroke/2 past each end, so the gap has to cover them plus the visible space.
  const gap = visible.length > 1 ? stroke + 5 : 0;
  let offset = 0;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {total > 0 &&
          visible.map((s, i) => {
            const len = (s.value / total) * circ;
            const dash = Math.max(len - gap, 1);
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset - gap / 2}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
