'use client';

import React, { useState } from 'react';
import { CONSISTENCY, DRAWDOWN, FILINGS, GOAL_FIT, OWNERS, PILLARS, SCORE, SWOT, VOLATILITY, AMBER } from './data';
import { CARD, Info, CountUp, scale, linePath, polar, arcPath } from './ui';

// The AI report's tabs, as in the app. Each panel mounts fresh when its tab opens, so its charts
// draw and its numbers count every time.

const d = (s: number) => ({ '--d': `${s}s` }) as React.CSSProperties;

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-[14px] leading-snug text-[#c4c4ca]">
      {items.map((t, i) => (
        <li key={t} className="sa-fade flex gap-2.5" style={d(0.6 + i * 0.1)}>
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6b6b73]" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function Title({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-[18px] font-semibold">
        {children} <Info />
      </p>
      {right && <span className="text-[12px] text-[#6f6f78]">{right}</span>}
    </div>
  );
}

// ---- Overview ----
function Snapshot() {
  const ticks = 60;
  const lit = Math.round((SCORE / 10) * ticks);
  return (
    <div className={`${CARD} p-5 sm:p-6`}>
      <Title>Investment Snapshot</Title>
      <div className="relative mx-auto my-4 aspect-square w-[min(220px,60%)]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {Array.from({ length: ticks }, (_, i) => {
            const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
            const on = i < lit;
            return (
              <line
                key={i}
                x1={(100 + Math.cos(a) * 80).toFixed(2)}
                y1={(100 + Math.sin(a) * 80).toFixed(2)}
                x2={(100 + Math.cos(a) * 94).toFixed(2)}
                y2={(100 + Math.sin(a) * 94).toFixed(2)}
                stroke={on ? AMBER : '#2e2e33'}
                strokeWidth="3.2"
                strokeLinecap="round"
                className={on ? 'sa-tick' : undefined}
                style={on ? d(0.2 + i * 0.018) : undefined}
              />
            );
          })}
        </svg>
        <p className="absolute inset-0 flex items-center justify-center text-7xl font-bold">
          <CountUp to={SCORE} run duration={1400} />
        </p>
      </div>
      <p className="text-[17px] font-semibold">Mixed fundamentals</p>
      <p className="text-[13px] text-[#8b8b94]">2 of 4 pillars positive</p>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
        {PILLARS.map((p, i) => (
          <div key={p.name} className="sa-fade" style={d(0.3 + i * 0.1)}>
            <p className="text-[13px] text-[#a1a1aa]">{p.name}</p>
            <p className="text-3xl font-bold">
              <CountUp to={p.score} run />
            </p>
            <p className="text-[13px] font-semibold" style={{ color: p.color }}>
              {p.verdict}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalFit() {
  return (
    <div className={`${CARD} p-5 sm:p-6`}>
      <Title>Your Goal Fit</Title>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#1d1d21] p-4">
        <div>
          <p className="text-5xl font-bold">
            <CountUp to={GOAL_FIT.score} run />
            <span className="text-base font-medium text-[#8b8b94]"> /100</span>
          </p>
          <span className="mt-2 inline-block rounded-full bg-[#4a3b16] px-3 py-1 text-[13px] font-semibold text-[#f0c766]">{GOAL_FIT.verdict}</span>
        </div>
        <div className="flex flex-1 flex-wrap justify-end gap-1.5">
          {GOAL_FIT.tags.map((t) => (
            <span key={t} className="rounded-md bg-[#2a2a2f] px-2.5 py-1 text-[12px] text-[#d4d4d8]">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {GOAL_FIT.bars.map((b, i) => {
          const c = b.value >= 90 ? '#4fbf86' : AMBER;
          return (
            <div key={b.name}>
              <div className="flex justify-between text-[15px] font-semibold">
                <span>{b.name}</span>
                <span style={{ color: c }}>{b.value}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-[#2a2a2f]">
                <div className="sa-grow-x h-full rounded-full" style={{ width: `${b.value}%`, background: c, ...d(0.2 + i * 0.12) }} />
              </div>
              <p className="mt-1 text-[12px] text-[#7b7b84]">{b.note}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[15px] font-semibold">What this means for you</p>
      <div className="mt-2">
        <Bullets items={GOAL_FIT.meaning} />
      </div>
      <p className="mt-4 text-[11px] text-[#5f5f68]">Based on your answers and this report. Not investment advice.</p>
    </div>
  );
}

// ---- Volatility ----
function VolatilityPanel() {
  const W = 420;
  const H = 180;
  const s = scale(VOLATILITY.stock, W, H, 0, 0, 4);
  const n = scale(VOLATILITY.nifty, W, H, 0, 0, 4);
  const between = `${linePath(s)} ${n.slice().reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')}Z`;
  // The gauge: 0.5x to 3x across the half circle
  const at = ((VOLATILITY.multiple - 0.5) / 2.5) * 180;
  const bands: [number, number, string][] = [
    [0, 50, '#4fbf86'],
    [52, 88, '#e5b85c'],
    [90, 130, '#e0904f'],
    [132, 180, '#e0726a'],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${CARD} p-5 sm:p-6`}>
        <Title right="Updated every 24 hrs">Volatility Meter</Title>
        <div className="mt-4 flex items-center justify-between text-[14px]">
          <span className="font-semibold text-[#c4c4ca]">Volatility (1Y)</span>
          <span className="flex gap-3 text-[12px]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#4fbf86]" />HINDUNILVR</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#a59cf0]" />Nifty 50</span>
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex flex-col justify-between py-0.5 text-[10px] text-[#6f6f78]">
            {['4.0x', '3.0x', '2.0x', '1.0x', '0.0x'].map((l) => <span key={l}>{l}</span>)}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[180px] flex-1" preserveAspectRatio="none">
            {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M0 ${(k / 4) * H}H${W}`} stroke="#26262b" vectorEffect="non-scaling-stroke" />)}
            <path d={between} fill="#ffffff" opacity="0.06" className="sa-fade-in" style={d(1)} />
            <path d={linePath(n)} fill="none" stroke="#a59cf0" strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={1} className="sa-draw" style={d(0.2)} />
            <path d={linePath(s)} fill="none" stroke="#4fbf86" strokeWidth="2.2" vectorEffect="non-scaling-stroke" pathLength={1} className="sa-draw" style={d(0)} />
          </svg>
        </div>
        <div className="ml-8 mt-1 flex justify-between text-[11px] text-[#6f6f78]">
          {VOLATILITY.months.map((m) => <span key={m}>{m}</span>)}
        </div>
        <p className="mt-3 text-[11px] text-[#6f6f78]">1-month rolling volatility. 1.0x = the Nifty 50’s average level over the past year.</p>
      </div>
      <div className={`${CARD} flex flex-col p-5 sm:p-6`}>
        <div className="relative mx-auto w-full max-w-[300px]">
          <svg viewBox="0 0 200 120" className="w-full">
            {bands.map(([a, b, c], i) => (
              <path key={i} d={arcPath(100, 104, 82, a, b)} fill="none" stroke={c} strokeWidth="14" pathLength={1} className="sa-draw" style={d(i * 0.12)} />
            ))}
            <g className="sa-needle" style={{ '--from': '-90deg', '--to': `${at - 90}deg`, transformOrigin: '100px 104px' } as React.CSSProperties}>
              <path d="M100 66 L100 34" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </svg>
          <div className="-mt-12 text-center">
            <p className="text-5xl font-bold">
              <CountUp to={VOLATILITY.multiple} run format={(v) => `${v.toFixed(2)}x`} />
            </p>
            <p className="text-[14px] text-[#a1a1aa]">More volatile than Nifty</p>
            <p className="text-[12px] font-bold tracking-wider text-[#e5b85c]">MODERATE VOLATILITY</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {VOLATILITY.stats.map((s2, i) => (
            <div key={s2.label} className="sa-fade rounded-xl bg-[#202024] px-2 py-3 text-center" style={d(0.5 + i * 0.1)}>
              <p className="text-[11px] text-[#8b8b94]">{s2.label}</p>
              <p className="text-[18px] font-bold" style={{ color: s2.color }}>{s2.value}</p>
              <p className="text-[11px] text-[#7b7b84]">{s2.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[15px] font-semibold">What this means for HINDUNILVR</p>
        <div className="mt-2">
          <Bullets items={[VOLATILITY.meaning, 'Beta of 0.74: on a day the Nifty falls 1%, it has tended to fall about 0.7%.']} />
        </div>
      </div>
    </div>
  );
}

// ---- Consistency ----
function ConsistencyPanel() {
  const max = Math.max(...CONSISTENCY.profits.map((p) => p.value)) * 1.12;
  const m = scale(CONSISTENCY.margin, 200, 60, 6);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${CARD} p-5 sm:p-6`}>
        <Title>Consistency Tracker</Title>
        <p className="mt-3 text-[14px] font-semibold text-[#a1a1aa]">Quarterly Profit (₹ Cr)</p>
        <div className="relative mt-3 flex h-[220px] items-end justify-around gap-3 border-b border-white/10">
          <div className="absolute inset-x-0 border-t border-dashed border-white/10" style={{ bottom: `${(5000 / max) * 100}%` }}>
            <span className="absolute -top-4 left-0 text-[10px] text-[#6f6f78]">5.0K</span>
          </div>
          {CONSISTENCY.profits.map((p, i) => (
            <div key={p.label} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="sa-fade mb-1 text-[13px] font-semibold" style={d(0.5 + i * 0.1)}>{p.value.toLocaleString('en-IN')}</span>
              <span className="sa-grow-y w-full max-w-[56px] rounded-t-lg bg-[#5fbf8a]" style={{ height: `${(p.value / max) * 100}%`, ...d(i * 0.1) }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-around text-[12px] text-[#7b7b84]">
          {CONSISTENCY.profits.map((p) => <span key={p.label} className="flex-1 text-center">{p.label}</span>)}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className={`${CARD} flex items-center gap-4 p-5 sm:p-6`}>
          <div>
            <p className="text-5xl font-bold">
              <CountUp to={5} run />/5
            </p>
            <p className="text-[14px] text-[#a1a1aa]">Profitable Quarters</p>
            <p className="mt-4 text-[14px] font-semibold text-[#4fbf86]">Consistency Rating</p>
            <span className="mt-1.5 inline-block rounded-full bg-[#173b2a] px-4 py-1.5 text-[15px] font-semibold text-[#5fd39a]">Good</span>
          </div>
          <div className="flex-1">
            <svg viewBox="-4 -4 208 76" className="w-full overflow-visible">
              <defs>
                <linearGradient id="sa-margin" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#e0726a" stopOpacity="0.3" />
                  <stop offset="1" stopColor="#e0726a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${linePath(m)} L200 66 L0 66Z`} fill="url(#sa-margin)" className="sa-fade-in" style={d(0.8)} />
              <path d={linePath(m)} fill="none" stroke="#e0726a" strokeWidth="2.5" pathLength={1} className="sa-draw" style={d(0.2)} />
              <circle cx={m[m.length - 1][0]} cy={m[m.length - 1][1]} r="4" fill="#e0726a" className="sa-fade" style={d(1.2)} />
            </svg>
            <p className="mt-1 text-right text-[11px] text-[#7b7b84]">Net margin 15.2%</p>
          </div>
        </div>
        <div className={`${CARD} p-5 sm:p-6`}>
          <p className="text-[15px] font-semibold">What this means for HINDUNILVR</p>
          <div className="mt-2">
            <Bullets items={CONSISTENCY.meaning} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Downside risk ----
function DownsidePanel() {
  const [span, setSpan] = useState<'1Y' | '5Y'>('5Y');
  const cut = span === '5Y' ? 0 : DRAWDOWN.stock.length - 17;
  const sv = DRAWDOWN.stock.slice(cut);
  const nv = DRAWDOWN.nifty.slice(cut);
  const W = 420;
  const H = 190;
  const s = scale(sv, W, H, 0, -50, 0);
  const n = scale(nv, W, H, 0, -50, 0);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${CARD} p-5 sm:p-6`}>
        <Title right="Updated every 24 hrs">Downside Risk</Title>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-5xl font-bold text-[#e5b85c]">
              <CountUp to={DRAWDOWN.belowHigh} run format={(v) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%`} />
            </p>
            <p className="text-[14px] text-[#a1a1aa]">below its 52-week high</p>
          </div>
          <span className="rounded-full bg-[#4a3b16] px-4 py-2 text-[13px] font-bold tracking-wide text-[#f0c766]">MODERATE RISK</span>
        </div>
        <div className="relative mt-6 h-2 rounded-full" style={{ background: 'linear-gradient(90deg,#e0726a,#e5b85c 50%,#4fbf86)' }}>
          <span className="sa-slide absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#3a3a40] bg-white" style={{ '--to': `${DRAWDOWN.range.at * 100}%` } as React.CSSProperties} />
        </div>
        <div className="mt-3 grid grid-cols-3 text-[12px] text-[#8b8b94]">
          <span>52W Low<br /><b className="text-[14px] text-white">{DRAWDOWN.range.low}</b></span>
          <span className="text-center">Last close<br /><b className="text-[14px] text-white">{DRAWDOWN.range.last}</b></span>
          <span className="text-right">52W High<br /><b className="text-[14px] text-white">{DRAWDOWN.range.high}</b></span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {DRAWDOWN.stats.map((st, i) => (
            <div key={st.label} className="sa-fade rounded-xl bg-[#202024] p-3" style={d(0.4 + i * 0.08)}>
              <p className="text-[12px] text-[#8b8b94]">{st.label}</p>
              <p className="text-[22px] font-bold" style={{ color: st.color }}>{st.value}</p>
              <p className="text-[11px] text-[#7b7b84]">{st.note}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={`${CARD} p-5 sm:p-6`}>
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-semibold">Fall from previous peak</p>
          <div className="flex gap-1.5">
            {(['1Y', '5Y'] as const).map((k) => (
              <button key={k} type="button" onClick={() => setSpan(k)} className={`rounded-lg border px-3 py-1 text-[13px] transition-colors ${k === span ? 'border-white/30 bg-[#2a2a2f] text-white' : 'border-white/10 text-[#7b7b84] hover:text-white'}`}>
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex gap-3 text-[12px]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#e0726a]" />HINDUNILVR</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#a59cf0]" />Nifty 50</span>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="flex flex-col justify-between text-[10px] text-[#6f6f78]">
            {['0%', '-10%', '-20%', '-30%', '-40%', '-50%'].map((l) => <span key={l}>{l}</span>)}
          </div>
          <svg key={span} viewBox={`0 0 ${W} ${H}`} className="h-[200px] flex-1 overflow-visible" preserveAspectRatio="none">
            {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={`M0 ${(k / 5) * H}H${W}`} stroke="#26262b" vectorEffect="non-scaling-stroke" />)}
            <path d={`${linePath(s)} L${W} 0 L0 0Z`} fill="#e0726a" opacity="0.14" className="sa-fade-in" style={d(0.9)} />
            <path d={linePath(n)} fill="none" stroke="#a59cf0" strokeWidth="1.6" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" className="sa-fade-in" style={d(0.5)} />
            <path d={linePath(s)} fill="none" stroke="#e0726a" strokeWidth="2.4" vectorEffect="non-scaling-stroke" pathLength={1} className="sa-draw" />
          </svg>
        </div>
        <div className="ml-9 mt-1 flex justify-between text-[11px] text-[#6f6f78]">
          {(span === '5Y' ? DRAWDOWN.years : ["Oct '25", "Jan '26", "Apr '26", "Jul '26", "Oct '26"]).map((y) => <span key={y}>{y}</span>)}
        </div>
        <p className="mt-3 text-[12px] text-[#7b7b84]">{DRAWDOWN.note}</p>
      </div>
    </div>
  );
}

// ---- SWOT ----
function SwotPanel() {
  const [open, setOpen] = useState(3);
  const [expanded, setExpanded] = useState<number | null>(null);
  const pick = SWOT[open];
  return (
    <div className={`${CARD} p-5 sm:p-6`}>
      <Title right="Updated daily">SWOT analysis</Title>
      <div className="mt-4 flex gap-2">
        <div className="sa-grow-x h-2 flex-1 rounded-full bg-[#4ade80]" />
        <div className="sa-grow-x h-2 flex-1 rounded-full bg-[#f87171]" style={{ ...d(0.15), transformOrigin: 'right' }} />
      </div>
      <div className="mt-2 flex justify-between text-[14px] text-[#a1a1aa]">
        <span>4 points in its favour</span>
        <span>4 against</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SWOT.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setOpen(i);
              setExpanded(null);
            }}
            className={`sa-fade relative rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${i === open ? 'scale-[1.02]' : 'border-white/[0.08] bg-[#1d1d21]'}`}
            style={{ ...d(0.1 + i * 0.08), borderColor: i === open ? s.color : undefined, background: i === open ? `${s.color}14` : undefined }}
          >
            <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <p className="text-4xl font-bold">{s.points.length}</p>
            <p className="mt-1 text-[17px] font-semibold">{s.key}</p>
            <p className="truncate text-[13px] text-[#8b8b94]">{s.points[0]}</p>
          </button>
        ))}
      </div>
      <div key={open} className="sa-callout mt-4 rounded-2xl border-2 p-4" style={{ borderColor: pick.color }}>
        <p className="text-[13px] text-[#8b8b94]">{pick.title}</p>
        <div className="mt-1 divide-y divide-white/[0.07]">
          {pick.points.map((p, i) => (
            <button key={p} type="button" onClick={() => setExpanded(expanded === i ? null : i)} className="flex w-full items-start justify-between gap-3 py-3 text-left">
              <span>
                <span className="block text-[16px] font-semibold">{p}</span>
                {expanded === i && <span className="mt-1 block text-[13px] text-[#a1a1aa]">The AI flags this from the stock’s live numbers and filings, and re-checks it every day.</span>}
              </span>
              <span className={`mt-1 text-[#a1a1aa] transition-transform ${expanded === i ? 'rotate-180' : ''}`}>⌄</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Ownership ----
function OwnershipPanel() {
  const [who, setWho] = useState(2);
  const o = OWNERS[who];
  const first = o.series[0];
  const last = o.series[o.series.length - 1];
  const delta = last - first;
  const verdict = Math.abs(delta) < 0.1 ? 'Unchanged' : delta > 0 ? 'Increased' : 'Decreased';
  const vColor = verdict === 'Unchanged' ? '#a1a1aa' : delta > 0 ? '#4fbf86' : '#e0726a';
  const angle = 90 + Math.max(-1, Math.min(1, delta / 2)) * 80;
  const prev = o.series[o.series.length - 2];
  const max = Math.max(...o.series);
  const latest = OWNERS.map((x) => x.series[x.series.length - 1]);
  const words: Record<string, string> = { Promoters: 'Promoters', DIIs: 'Domestic institutions (DIIs)', FIIs: 'Foreign institutions (FIIs)', Public: 'Retail and other investors' };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${CARD} p-5 sm:p-6`}>
        <Title right="As of Sep '26">Ownership Shift Tracker</Title>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full">
          {OWNERS.map((x, i) => (
            <span key={x.key} className="sa-grow-x h-full" style={{ width: `${latest[i]}%`, background: x.bar, ...d(i * 0.1) }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#a1a1aa]">
          {OWNERS.map((x, i) => (
            <span key={x.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: x.bar }} />
              {x.key} {latest[i].toFixed(1)}%
            </span>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-4 rounded-xl bg-[#141416] p-1">
          {OWNERS.map((x, i) => (
            <button key={x.key} type="button" onClick={() => setWho(i)} className={`rounded-lg py-2 text-[14px] transition-colors ${i === who ? 'border border-white/10 bg-[#2a2a2f] font-semibold text-white' : 'text-[#7b7b84] hover:text-white'}`}>
              {x.key}
            </button>
          ))}
        </div>
        <div key={who} className="mt-4 text-center">
          <p className="sa-fade text-[22px] font-semibold" style={{ color: vColor }}>{verdict}</p>
          <svg viewBox="0 0 200 112" className="mx-auto mt-1 w-full max-w-[280px]">
            {Array.from({ length: 31 }, (_, i) => {
              const deg = 10 + (i / 30) * 160;
              const [x1, y1] = polar(100, 100, 66, deg);
              const [x2, y2] = polar(100, 100, 80, deg);
              const t = i / 30;
              const c = t < 0.35 ? '#e0726a' : t < 0.65 ? '#e5b85c' : '#4fbf86';
              const near = Math.abs(deg - angle) < 22;
              return <line key={i} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} stroke={c} strokeWidth="3" strokeLinecap="round" opacity={near ? 1 : 0.25} />;
            })}
            <g className="sa-needle" style={{ '--from': '0deg', '--to': `${angle - 90}deg`, transformOrigin: '100px 100px' } as React.CSSProperties}>
              <path d="M100 100 L100 46" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
            </g>
            <circle cx="100" cy="100" r="8" fill="#fff" stroke="#3a3a40" strokeWidth="4" />
            <text x="22" y="108" fontSize="9" fill="#e0726a" fontWeight="700">Decrease</text>
            <text x="178" y="108" fontSize="9" fill="#4fbf86" fontWeight="700" textAnchor="end">Increase</text>
          </svg>
          <p className="text-[16px] font-bold">
            {delta >= 0 ? '+' : '−'}
            {Math.abs(delta).toFixed(2)} pts
          </p>
          <p className="text-[12px] text-[#7b7b84]">Sep ’25 → Sep ’26</p>
        </div>
      </div>
      <div className={`${CARD} flex flex-col p-5 sm:p-6`}>
        <p key={`t${who}`} className="sa-fade rounded-xl bg-[#202024] p-4 text-center text-[14px] leading-relaxed text-[#c4c4ca]">
          {words[o.key]} {verdict === 'Unchanged' ? `held their stake steady at ${last.toFixed(2)}%` : `${delta > 0 ? 'raised' : 'cut'} their stake from ${first.toFixed(2)}% to ${last.toFixed(2)}% (${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(2)} pts)`} between Sep ’25 and Sep ’26. Latest filing vs Jun ’26: {last - prev >= 0 ? '+' : '−'}
          {Math.abs(last - prev).toFixed(2)} pts.
        </p>
        <p className="mt-5 text-[13px] text-[#8b8b94]">{o.key} holding by filing (%)</p>
        <div key={`b${who}`} className="mt-3 flex h-[170px] items-end justify-around gap-3">
          {o.series.map((v, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="sa-fade mb-1 text-[13px] font-semibold" style={d(0.4 + i * 0.08)}>{v.toFixed(2)}</span>
              <span className="sa-grow-y w-full max-w-[52px] rounded-t-lg" style={{ height: `${(v / max) * 85}%`, background: i === o.series.length - 1 ? '#6aa8e8' : '#3b4a5e', ...d(i * 0.08) }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-around text-[11px] text-[#7b7b84]">
          {FILINGS.map((f) => <span key={f} className="flex-1 text-center">{f}</span>)}
        </div>
      </div>
    </div>
  );
}

export function ReportPanel({ tab }: { tab: number }) {
  if (tab === 0)
    return (
      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <Snapshot />
        <GoalFit />
      </div>
    );
  if (tab === 1) return <VolatilityPanel />;
  if (tab === 2) return <ConsistencyPanel />;
  if (tab === 3) return <DownsidePanel />;
  if (tab === 4) return <SwotPanel />;
  return <OwnershipPanel />;
}

