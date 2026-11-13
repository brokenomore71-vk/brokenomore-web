'use client';

import React, { useEffect, useState } from 'react';
import { FILINGS, FINANCIALS, FUNDAMENTALS, OWNERS, PERFORMANCE, PRICE_LINES, STOCK, TIMEFRAMES, WATCHLIST, GREEN, RED, num } from './data';
import { MUTED, Info, Mark, Pct, Sparkle, CountUp, scale, linePath } from './ui';

// A stock's page in the app, panel by panel. Each one animates when it first scrolls in (`run`),
// and the interactive ones (timeframes, quarterly/yearly, filings, the watchlist button) work.

// ---- Price and chart ----
export function PricePanel({ run }: { run: boolean }) {
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>('1D');
  const [auto, setAuto] = useState(true);
  const [saved, setSaved] = useState(false);

  // Steps through the timeframes on its own until someone picks one
  useEffect(() => {
    if (!run || !auto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setTf((t) => TIMEFRAMES[(TIMEFRAMES.indexOf(t) + 1) % TIMEFRAMES.length]);
    }, 3200);
    return () => window.clearInterval(id);
  }, [run, auto]);

  const values = PRICE_LINES[tf];
  const W = 600;
  const H = 230;
  const pts = scale(values, W, H, 12);
  const up = values[values.length - 1] >= values[0];
  const color = up ? GREEN : RED;
  const ref = pts[0][1];
  const [lx, ly] = pts[pts.length - 1];

  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Mark symbol="HINDUNILVR" size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold sm:text-2xl">{STOCK.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="rounded-md bg-[#232631] px-2 py-0.5 font-semibold text-[#c3c7d4]">{STOCK.symbol}</span>
            <span className={MUTED}>{STOCK.sector}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-all duration-300 active:scale-95 ${saved ? 'border-[#6E5BFF] bg-[#6E5BFF]/15 text-white' : 'border-white/15 bg-[#1f1f23] text-[#d4d4d8] hover:border-white/30'}`}
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform duration-300 ${saved ? 'scale-110' : ''}`} fill={saved ? '#6E5BFF' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 3.5h12v17l-6-4-6 4z" strokeLinejoin="round" />
          </svg>
          {saved ? 'Added' : 'Watchlist'}
        </button>
      </div>

      <p className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
        ₹<CountUp to={STOCK.price} from={1950} run={run} format={(n) => num(n)} />
      </p>
      <p className="mt-1 text-[15px] font-semibold" style={{ color: GREEN }}>
        {STOCK.change}
      </p>

      <div className="relative mt-4 min-h-[180px] flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="sa-price-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.25" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M0 ${ref}H${W}`} stroke="#5a5a62" strokeDasharray="8 8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <path key={`f${tf}`} d={`${linePath(pts)} L${W} ${H} L0 ${H}Z`} fill="url(#sa-price-fill)" className="sa-fade-in" />
          <path key={tf} d={linePath(pts)} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" pathLength={1} className="sa-draw-now" strokeLinejoin="round" />
        </svg>
        <span key={`d${tf}`} className="sa-pop-late absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: `${(lx / W) * 100}%`, top: `${(ly / H) * 100}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>

      <div className="mt-4 flex justify-between gap-1">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setAuto(false);
              setTf(t);
            }}
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors sm:px-4 ${t === tf ? 'border-2 border-white/80 text-white' : 'border-2 border-transparent text-[#8b8b94] hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Performance: today's range, the 52-week range, and the day's numbers ----
function Range({ label, low, high, at, run, delay }: { label: [string, string]; low: number; high: number; at: number; run: boolean; delay: number }) {
  return (
    <div>
      <div className="flex justify-between text-[13px] text-[#8b8b94]">
        <span>{label[0]}</span>
        <span>{label[1]}</span>
      </div>
      <div className="mt-0.5 flex justify-between text-[17px] font-semibold tabular-nums">
        <span>{num(low)}</span>
        <span>{num(high)}</span>
      </div>
      <div className="relative mt-2 h-1 rounded-full bg-[#2b2b30]">
        <span
          className="absolute top-2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[8px] border-x-transparent border-b-white transition-[left] duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ left: run ? `${at * 100}%` : '0%', transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

export function PerformancePanel({ run }: { run: boolean }) {
  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <p className="flex items-center gap-2 text-xl font-semibold">
        Performance <Info />
      </p>
      <div className="mt-4 space-y-6">
        <Range label={["Today's Low", "Today's High"]} low={PERFORMANCE.today.low} high={PERFORMANCE.today.high} at={PERFORMANCE.today.at} run={run} delay={200} />
        <Range label={['52 Week Low', '52 Week High']} low={PERFORMANCE.year.low} high={PERFORMANCE.year.high} at={PERFORMANCE.year.at} run={run} delay={400} />
      </div>
      <div className="mt-7 grid grid-cols-3 gap-x-3 gap-y-4">
        {PERFORMANCE.stats.map(([k, v], i) => (
          <div key={k} className="sa-fade" style={{ '--d': `${0.5 + i * 0.08}s` } as React.CSSProperties}>
            <p className="text-[12px] text-[#8b8b94]">{k}</p>
            <p className="text-[16px] font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Fundamentals ----
export function FundamentalsPanel() {
  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <p className="flex items-center gap-2 text-xl font-semibold">
        Fundamentals <Info />
      </p>
      <div className="mt-4 grid flex-1 grid-cols-2 content-center gap-x-6">
        {FUNDAMENTALS.map(([k, v], i) => (
          <div key={k} className="sa-fade flex items-center justify-between border-b border-white/[0.05] py-2.5" style={{ '--d': `${0.15 + i * 0.05}s` } as React.CSSProperties}>
            <span className="text-[13px] text-[#8b8b94]">{k}</span>
            <span className="text-[15px] font-semibold tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Financial performance: revenue and profit bars, quarterly or yearly ----
export function FinancialsPanel() {
  const [mode, setMode] = useState<'quarterly' | 'yearly'>('quarterly');
  const rows = FINANCIALS[mode];
  const [sel, setSel] = useState(1);
  const pick = rows[Math.min(sel, rows.length - 1)];
  const top = Math.max(...rows.map((r) => r.revenue)) * 1.08;
  const cr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const change = (r: (typeof rows)[number]) => ('revChange' in r ? [r.revChange, r.profitChange] : null);
  const c = change(pick);

  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <p className="text-xl font-semibold">Financial performance</p>
      <div className="mt-3 flex gap-2">
        {(['quarterly', 'yearly'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setSel(m === 'quarterly' ? 1 : 2);
            }}
            className={`rounded-full border px-4 py-1.5 text-[14px] font-medium capitalize transition-colors ${m === mode ? 'border-white/40 bg-[#26272d] text-white' : 'border-white/10 text-[#8b8b94] hover:text-white'}`}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-[#8b8b94]">{pick.label}</p>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#8b8b94]">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#64748b]" /> REVENUE
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {cr(pick.revenue)}
            <span className="text-sm text-[#8b8b94]">Cr</span> {c && <span className="text-sm" style={{ color: GREEN }}>{c[0]}</span>}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#8b8b94]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GREEN }} /> PROFIT
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {cr(pick.profit)}
            <span className="text-sm text-[#8b8b94]">Cr</span> {c && <span className="text-sm" style={{ color: GREEN }}>{c[1]}</span>}
          </p>
        </div>
      </div>

      <div key={mode} className="mt-4 flex min-h-[150px] flex-1 items-end justify-around gap-2 border-b border-dashed border-white/10">
        {rows.map((r, i) => {
          const on = i === sel;
          return (
            <button key={r.label} type="button" onClick={() => setSel(i)} className="group flex h-full flex-1 flex-col items-center justify-end" aria-label={`${r.label}: revenue ${cr(r.revenue)} Cr, profit ${cr(r.profit)} Cr`}>
              <div className="flex h-full w-full items-end justify-center gap-1.5">
                <span className="sa-grow-y w-[30%] max-w-[22px] rounded-t-md transition-colors" style={{ height: `${(r.revenue / top) * 100}%`, background: on ? '#94a9cc' : '#3a4656', '--d': `${i * 0.08}s` } as React.CSSProperties} />
                <span className="sa-grow-y w-[30%] max-w-[22px] rounded-t-md transition-colors" style={{ height: `${(r.profit / top) * 100}%`, background: on ? GREEN : '#1d5a45', '--d': `${0.1 + i * 0.08}s` } as React.CSSProperties} />
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-around text-[12px]">
        {rows.map((r, i) => (
          <span key={r.label} className={`flex-1 text-center ${i === sel ? 'font-semibold text-white' : 'text-[#7b7b84]'}`}>
            {r.label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1.5 border-t border-dashed border-white/10 pt-3 text-[13px]">
        <span className="text-[11px] font-semibold tracking-wide text-[#8b8b94]">GROWTH</span>
        <span className="text-right text-[11px] font-semibold tracking-wide text-[#8b8b94]">REVENUE</span>
        <span className="text-right text-[11px] font-semibold tracking-wide text-[#8b8b94]">PROFIT</span>
        {FINANCIALS.growth.map(([k, a, b]) => (
          <React.Fragment key={k}>
            <span>{k}</span>
            <span className="text-right font-semibold" style={{ color: GREEN }}>{a}</span>
            <span className="text-right font-semibold" style={{ color: GREEN }}>{b}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ---- Shareholding pattern: a donut for each filing ----
export function ShareholdingPanel() {
  const [f, setF] = useState(FILINGS.length - 1);
  const parts = OWNERS.map((o) => ({ ...o, share: o.series[f] }));
  const total = parts.reduce((t, p) => t + p.share, 0);
  // Where each segment starts round the ring, as a fraction
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((t, p) => t + p.share / total, 0));
  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <p className="text-xl font-semibold">Shareholding pattern</p>
      <div className="mt-3 flex justify-between gap-1">
        {FILINGS.map((l, i) => (
          <button key={l} type="button" onClick={() => setF(i)} className={`rounded-full px-2.5 py-1 text-[13px] transition-colors ${i === f ? 'bg-[#26272d] font-semibold text-white' : 'text-[#7b7b84] hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="relative mx-auto mt-4 aspect-square w-[min(220px,70%)]">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {parts.map((p, i) => {
            const frac = p.share / total;
            return (
              <circle
                key={p.key}
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke={p.color}
                strokeWidth="16"
                pathLength={1}
                className="sa-arc"
                style={{ '--f': Math.max(0, frac - 0.006), strokeDasharray: `${Math.max(0, frac - 0.006)} 1`, '--d': `${0.2 + i * 0.18}s`, strokeDashoffset: -starts[i], transition: 'stroke-dashoffset .6s ease' } as React.CSSProperties}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-lg font-bold">{STOCK.symbol}</p>
          <p className="text-[11px] text-[#8b8b94]">Shareholding Pattern</p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-white/[0.06]">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center gap-3 py-2 text-[14px]">
            <span className="h-3.5 w-3.5 rounded-[4px]" style={{ background: p.color }} />
            <span className="flex-1 truncate">{p.name}</span>
            <span className="font-semibold tabular-nums">{p.share.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- The Watchlist tab, and the way into the AI report ----
export function WatchlistPanel() {
  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold">Your Watchlist</p>
        <span className="rounded-md bg-[#6E5BFF]/15 px-2 py-1 text-[11px] font-semibold text-[#a99dff]">{WATCHLIST.length} stocks</span>
      </div>
      <div className="mt-3 space-y-2">
        {WATCHLIST.map((w, i) => (
          <div key={w.symbol} className="sa-fade flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#121214] px-3 py-2.5" style={{ '--d': `${0.2 + i * 0.12}s` } as React.CSSProperties}>
            <Mark symbol={w.symbol} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{w.name}</p>
              <p className="text-[11px] font-semibold text-[#7b7b84]">{w.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-semibold tabular-nums">₹{num(w.price)}</p>
              <Pct v={w.change} className="text-[12px]" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-auto pt-4 text-[12px] text-[#7b7b84]">Tap Watchlist on any stock to keep an eye on it here, then ask the AI about it when you’re ready.</p>
      <a
        href="#stock-ai-analysis"
        className="sa-cta mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#6E5BFF] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-8px_rgba(110,91,255,0.7)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Sparkle /> Run Full AI Analysis Report
      </a>
    </div>
  );
}
