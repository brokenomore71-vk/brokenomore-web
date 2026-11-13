'use client';

import React, { useEffect, useState } from 'react';
import { COLLECTIONS, MARKET, POPULAR, RECENT, SEARCH, SECTORS, num, GREEN, RED } from './data';
import { CARD, MUTED, Mark, Pct } from './ui';

// The Explore tab, card by card: the tabs and search, Market Pulse, Recently Viewed & Trending,
// Market Movers & Collections, Popular Stocks, and the search with its results.

export function Tabs({ active = 0 }: { active?: number }) {
  return (
    <div className="relative flex border-b border-white/[0.08]">
      {['Explore', 'Analysis', 'Watchlist'].map((t, i) => (
        <span key={t} className={`relative flex-1 pb-3 text-center text-[15px] font-semibold ${i === active ? 'text-white' : 'text-[#7b7b84]'}`}>
          {t}
          {i === active && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-[#6E5BFF]" />}
        </span>
      ))}
    </div>
  );
}

export function SearchIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

export function Chips({ max }: { max?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {SECTORS.slice(0, max).map((s) => (
        <span key={s} className="shrink-0 rounded-full border border-white/10 bg-[#141416] px-3.5 py-1.5 text-[13px] text-[#c9c9cf]">
          {s}
        </span>
      ))}
    </div>
  );
}

export function ExploreHeader() {
  return (
    <div className="flex h-full flex-col justify-between gap-3 p-4">
      <Tabs />
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#141416] px-4 py-3 text-[#6f6f78]">
        <SearchIcon />
        <span className="truncate text-[14px]">Search 6,000+ stocks (e.g. Reliance, BEL,…</span>
      </div>
      <Chips />
    </div>
  );
}

// An index that keeps moving a little, like the live tiles in the app
function LiveValue({ base, live }: { base: number; live: boolean }) {
  const [v, setV] = useState(base);
  const [flash, setFlash] = useState<0 | 1 | -1>(0);
  useEffect(() => {
    if (!live || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      const step = (Math.random() - 0.5) * base * 0.0006;
      setV((x) => x + step);
      setFlash(step >= 0 ? 1 : -1);
    }, 1400 + Math.random() * 900);
    return () => window.clearInterval(id);
  }, [base, live]);
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(0), 450);
    return () => window.clearTimeout(id);
  }, [flash, v]);
  return (
    <span className="tabular-nums transition-colors duration-300" style={{ color: flash === 1 ? GREEN : flash === -1 ? RED : undefined }}>
      {num(v)}
    </span>
  );
}

export function MarketPulse({ live = true }: { live?: boolean }) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <p className="text-[17px] font-semibold">Market Pulse</p>
        <span className="flex items-center gap-1.5 rounded-md bg-[#0f2e22] px-2 py-1 text-[11px] font-semibold text-[#3ddc97]">
          <span className="sa-live h-1.5 w-1.5 rounded-full bg-[#3ddc97]" />
          LIVE NSE/BSE
        </span>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-3 gap-2.5">
        {MARKET.map((m) => (
          <div key={m.name} className="flex flex-col justify-center rounded-xl border border-white/[0.07] bg-[#121214] px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase text-[#8b8b94]">{m.name}</p>
            <p className="mt-0.5 text-[15px] font-semibold">
              <LiveValue base={m.value} live={live} />
            </p>
            <p className="truncate text-[11px] font-semibold" style={{ color: m.up ? GREEN : RED }}>
              {m.up ? '↑' : '↓'} {m.change}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Recent() {
  return (
    <div className="flex h-full flex-col p-4">
      <p className="text-[17px] font-semibold">Recently Viewed &amp; Trending</p>
      <div className="mt-3 grid flex-1 grid-cols-2 gap-2.5">
        {RECENT.map((r) => (
          <div key={r.symbol} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#121214] px-3">
            <Mark symbol={r.symbol} size={38} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{r.name}</p>
              <p className="text-[11px] text-[#8b8b94]">
                {r.symbol} <Pct v={r.change} digits={1} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// The collections' little glowing charts, as on their cards in the app
export function MiniChart({ kind, color }: { kind: (typeof COLLECTIONS)[number]['kind']; color: string }) {
  const bars = [62, 38, 50, 30, 46, 58];
  const hi = kind === 'line' ? -1 : 2;
  return (
    <svg viewBox="0 0 200 92" className="h-full w-full overflow-visible" aria-hidden="true">
      {kind === 'line' && <path d="M8 18H192" stroke="#777" strokeDasharray="5 5" strokeWidth="1.2" />}
      {bars.map((h, i) => {
        const x = 18 + i * 32;
        const tall = i === hi;
        const top = tall ? 10 : 92 - h * 0.9;
        return (
          <rect
            key={i}
            x={x - 6}
            y={top}
            width="12"
            height={(tall ? 66 : 92 - top) - 4}
            rx="6"
            fill={color}
            opacity={tall ? 1 : 0.28}
            className={tall ? 'sa-bar-glow' : 'sa-bar-breathe'}
            style={{ filter: tall ? `drop-shadow(0 0 8px ${color})` : undefined, animationDelay: `${i * 0.25}s` }}
          />
        );
      })}
      {kind === 'line' && (
        <>
          <path d="M6 52 C 30 30, 52 40, 72 54 S 118 72, 140 50 S 168 18, 182 18" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" pathLength={1} className="sa-loop-draw" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
          <circle cx="182" cy="18" r="7" fill={color} opacity="0.35" className="sa-ping" />
          <circle cx="182" cy="18" r="4" fill="#fff" stroke={color} strokeWidth="2" />
        </>
      )}
      {kind !== 'line' && (
        <>
          <path
            d={kind === 'peak' ? 'M8 64 Q100 6 192 66' : kind === 'up' ? 'M8 36 Q92 92 192 22' : 'M8 72 Q100 4 192 78'}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="6 6"
            opacity="0.85"
          />
          <circle cx={18 + hi * 32} cy={kind === 'peak' ? 14 : 70} r="5" fill="#fff" stroke={color} strokeWidth="2.5" className="sa-ping-soft" />
        </>
      )}
    </svg>
  );
}

export function Collection({ c }: { c: (typeof COLLECTIONS)[number] }) {
  return (
    <div className="flex h-full flex-col p-4">
      <span className="self-start rounded-md px-2 py-0.5 text-[12px] font-semibold" style={{ color: c.color, background: `${c.color}22` }}>
        {c.tag}
      </span>
      <div className="min-h-0 flex-1 py-3">
        <MiniChart kind={c.kind} color={c.color} />
      </div>
      <p className="text-[15px] font-semibold leading-tight">{c.title}</p>
    </div>
  );
}

export function Popular({ p }: { p: (typeof POPULAR)[number] }) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <Mark symbol={p.symbol} size={42} />
      <div>
        <p className="truncate text-[14px] font-semibold">{p.name}</p>
        <div className="mt-0.5 flex items-center justify-between text-[12px]">
          <span className="font-semibold uppercase text-[#7b7b84]">{p.symbol}</span>
          <Pct v={p.change} />
        </div>
      </div>
    </div>
  );
}

// The search, mid-query: what's typed is written in by the scroll timeline (data-e="typed")
export function SearchPanel() {
  return (
    <div className={`${CARD} w-full bg-[#141416]/95 p-4 shadow-[0_40px_80px_rgba(0,0,0,0.8)]`}>
      <div className="flex items-center gap-3 rounded-xl border-2 border-[#6E5BFF] bg-[#121214] px-4 py-3 shadow-[0_0_0_4px_rgba(110,91,255,0.15)]">
        <SearchIcon className="h-5 w-5 text-[#7b7b84]" />
        <span className="flex-1 text-[16px]">
          <span data-e="typed" />
          <span className="sa-caret ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[#6E5BFF]" />
        </span>
        <span className="text-[#bbb]">✕</span>
      </div>
      <div className="mt-3">
        <Chips max={4} />
      </div>
      <p data-e="count" className={`mt-4 text-[13px] font-medium ${MUTED}`}>
        {SEARCH.count} results
      </p>
      <div className="mt-2 space-y-2">
        {SEARCH.results.map((r, i) => (
          <div
            key={r.tag}
            data-e="result"
            data-pick={i === SEARCH.picked ? '' : undefined}
            className="relative flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#1a1a1d] px-3 py-2.5"
          >
            <Mark symbol={r.tag} size={42} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">
                <span className="text-[#7C6CFF]">Hindu</span>
                {r.name.slice(5)}
              </p>
              <p className={`text-[12px] ${MUTED}`}>{r.sub}</p>
            </div>
            <span className="rounded-md bg-[#26262b] px-2 py-1 text-[11px] font-semibold text-[#bdbdc4]">{r.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
