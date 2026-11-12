'use client';

import React, { useEffect } from 'react';
import { brand } from '@/app/fonts';
import { STOCK_CAPTIONS, VERDICT_RING, WEIGHTS } from './stockData';
import type { StockStoryRuntime } from './timeline';

// The app's own typeface, for the phone's screen and the pieces around it

const HIDDEN = { visibility: 'hidden' } as const;
const CENTERED = 'absolute left-1/2 top-1/2';

function loadStockAssets(runtime: StockStoryRuntime) {
  const { assets, screen } = runtime;
  assets.sans = brand.style.fontFamily;
  const logo = new Image();
  logo.src = '/assets/images/logo_white.png';
  logo.onload = () => {
    screen.dirty = true;
  };
  assets.logo = logo;

  let cancelled = false;
  Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${brand.style.fontFamily}`, 'Aa0')))
    .catch(() => undefined)
    .then(() => {
      if (!cancelled) screen.dirty = true;
    });
  return () => {
    cancelled = true;
  };
}

// Captions sit outside the stage so they line up with the section's normal heading.
export function StockStoryCaptions() {
  return (
    <div data-stock-captions className="absolute inset-x-0 top-6 sm:top-8 md:top-4 z-30 px-4 pointer-events-none" aria-hidden="true">
      <div className="relative mx-auto max-w-3xl">
        <div data-k="chapter-opening" style={HIDDEN} className="absolute inset-x-0 top-0 text-center">
          <div className="overflow-hidden pb-[0.14em]">
            <h2 data-k="chapter-name" className="text-5xl sm:text-7xl font-semibold text-white tracking-tight leading-[1.1]">
              Stock Analysis
            </h2>
          </div>
          <p data-k="chapter-tagline" className="text-sm sm:text-lg text-neutral-400 tracking-tight mt-2">
            Research any stock in minutes, measured against your own goals.
          </p>
        </div>

        {STOCK_CAPTIONS.map((caption) => (
          <div key={caption.title} data-k="caption" style={HIDDEN} className="absolute inset-x-0 top-0 text-center">
            <h3 className="text-[26px] sm:text-5xl font-semibold text-white tracking-tight leading-[1.2] drop-shadow-sm mt-1">
              {caption.title}
            </h3>
            <p className="text-sm sm:text-base text-neutral-400 tracking-tight mt-2">{caption.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// The balance scale beside the phone: a graphite stand with a gold beam, glass pans hanging on
// chains, and a needle that reads which way the facts lean. All of its geometry and motion is
// set by the timeline on every update, so it scrubs forwards and backwards with the scroll.
const GREEN = '#34d399';
const AMBER = '#f59e0b';
const GOLD = '#e5b85c';

export default function StockStoryLayer({ runtime }: { runtime: StockStoryRuntime }) {
  useEffect(() => loadStockAssets(runtime), [runtime]);

  return (
    <div data-stock-story className={`absolute inset-0 pointer-events-none ${brand.className}`} aria-hidden="true">
      <svg data-k="scale" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} overflow-visible`} width="1" height="1">
        <defs>
          <linearGradient id="stk-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1c1c21" />
            <stop offset="0.45" stopColor="#6b6b75" />
            <stop offset="0.6" stopColor="#3a3a42" />
            <stop offset="1" stopColor="#16161a" />
          </linearGradient>
          <linearGradient id="stk-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff1c2" />
            <stop offset="0.45" stopColor={GOLD} />
            <stop offset="1" stopColor="#7a5418" />
          </linearGradient>
          <radialGradient id="stk-jewel" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff7dc" />
            <stop offset="0.5" stopColor={GOLD} />
            <stop offset="1" stopColor="#5c3f10" />
          </radialGradient>
          <linearGradient id="stk-gauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={GREEN} />
            <stop offset="0.5" stopColor="#71717a" stopOpacity="0.6" />
            <stop offset="1" stopColor={AMBER} />
          </linearGradient>
          <radialGradient id="stk-spot" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.09" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {[GREEN, AMBER].map((color, i) => (
            <React.Fragment key={color}>
              <radialGradient id={`stk-pool-${i}`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={color} stopOpacity="0.55" />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`stk-bowl-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity="0.32" />
                <stop offset="1" stopColor={color} stopOpacity="0.04" />
              </linearGradient>
            </React.Fragment>
          ))}
          <filter id="stk-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Soft light behind the scale, and the coloured light each pan throws on the floor */}
        <circle data-k="spot" fill="url(#stk-spot)" />
        <ellipse data-k="pool" fill="url(#stk-pool-0)" />
        <ellipse data-k="pool" fill="url(#stk-pool-1)" />

        {/* Each fact's light trail as it flies over */}
        {WEIGHTS.map((w) => (
          <g key={w.label} data-k="trail" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={w.side === 'strength' ? GREEN : AMBER}>
            <path data-k="trail-glow" strokeWidth="9" strokeOpacity="0.22" filter="url(#stk-blur)" />
            <path data-k="trail-core" strokeWidth="2" />
          </g>
        ))}

        {/* Stand, gauge and beam, drawn around the pivot */}
        <g data-k="rig">
          <ellipse data-k="shadow" fill="#000" fillOpacity="0.55" filter="url(#stk-blur)" />
          <g data-k="stand">
            <path data-k="pillar" fill="url(#stk-metal)" stroke="#52525b" strokeWidth="0.75" />
            <path data-k="plinth" fill="url(#stk-metal)" stroke="#52525b" strokeWidth="0.75" />
            <ellipse data-k="plinth-top" fill="#2a2a30" stroke="#71717a" strokeWidth="0.75" />
            <line data-k="core" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <g data-k="gauge">
            <path data-k="gauge-arc" fill="none" stroke="url(#stk-gauge)" strokeWidth="2.5" strokeLinecap="round" />
            <path data-k="gauge-ticks" fill="none" stroke="#a1a1aa" strokeOpacity="0.6" strokeWidth="1" />
            <g data-k="needle">
              <line data-k="needle-line" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" />
              <circle data-k="needle-tip" fill="#fafafa" />
            </g>
          </g>
          <g data-k="beam">
            <path data-k="beam-bar" fill="url(#stk-gold)" />
            <circle data-k="finial" fill="url(#stk-jewel)" />
            <circle data-k="finial" fill="url(#stk-jewel)" />
          </g>
          <circle data-k="hub" fill="url(#stk-jewel)" stroke="#fff1c2" strokeOpacity="0.5" strokeWidth="1" />
          <circle data-k="hub-dot" fill="#18181b" />
          <circle data-k="shockwave" fill="none" stroke={GOLD} strokeWidth="2" />
        </g>

        {/* The pans, on their chains */}
        {[GREEN, AMBER].map((color, i) => (
          <g key={color} data-k="pan">
            <path data-k="chains" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.2" strokeDasharray="3 2" />
            <circle data-k="hook" fill="none" stroke={GOLD} strokeWidth="1.5" />
            <ellipse data-k="pan-inner" fill="#0c0c0f" stroke={color} strokeOpacity="0.35" strokeWidth="1" />
            <path data-k="pan-bowl" fill={`url(#stk-bowl-${i})`} stroke={color} strokeOpacity="0.85" strokeWidth="1.25" />
            <path data-k="pan-shine" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />
          </g>
        ))}

        {/* A ring that spreads across a pan as each fact lands on it */}
        {WEIGHTS.map((w) => (
          <ellipse key={w.label} data-k="ripple" fill="none" stroke={w.side === 'strength' ? GREEN : AMBER} strokeWidth="1.5" />
        ))}
      </svg>

      {/* Pan labels, which ride along under each pan */}
      <div data-k="pan-label" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} flex items-center gap-1.5 whitespace-nowrap text-[10px] md:text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        Strengths
      </div>
      <div data-k="pan-label" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} flex items-center gap-1.5 whitespace-nowrap text-[10px] md:text-xs font-semibold uppercase tracking-[0.16em] text-amber-300`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
        Watch-outs
      </div>

      {/* The facts, as weights */}
      {WEIGHTS.map((w) => {
        const strength = w.side === 'strength';
        return (
          <div
            key={w.label}
            data-k="weight"
            style={{ ...HIDDEN, zIndex: 31 }}
            className={`${CENTERED} flex items-center justify-between gap-2 whitespace-nowrap rounded-lg border px-2 py-1 md:px-3 md:py-1.5 w-[104px] md:w-[150px] backdrop-blur-md ${
              strength
                ? 'border-emerald-400/50 bg-gradient-to-b from-[#1d3a2e] to-[#0f1f18] shadow-[0_8px_22px_rgba(0,0,0,0.6),0_0_18px_rgba(52,211,153,0.28),inset_0_1px_0_rgba(255,255,255,0.12)]'
                : 'border-amber-400/50 bg-gradient-to-b from-[#3a2c12] to-[#1f170a] shadow-[0_8px_22px_rgba(0,0,0,0.6),0_0_18px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,255,255,0.12)]'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[9px] md:text-[11px] font-medium text-neutral-300">
              <span className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${strength ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {w.label}
            </span>
            <span className="text-[11px] md:text-sm font-bold tabular-nums text-white">{w.value}</span>
          </div>
        );
      })}

      {/* What it all comes to: a score ring that fills as the number counts up */}
      <div
        data-k="verdict"
        style={{ ...HIDDEN, zIndex: 31 }}
        className={`${CENTERED} flex items-center gap-2 whitespace-nowrap rounded-full border border-[#e5b85c]/50 bg-[#141416]/95 py-1 pl-1 pr-3 md:pr-4 shadow-[0_10px_30px_rgba(0,0,0,0.65),0_0_28px_rgba(229,184,92,0.3)]`}
      >
        <span className="relative flex h-9 w-9 md:h-11 md:w-11 items-center justify-center">
          <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="20" cy="20" r="17" fill="#1f1f23" stroke="#2e2e34" strokeWidth="3" />
            <circle
              data-k="verdict-ring"
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke={GOLD}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={VERDICT_RING}
              strokeDashoffset={VERDICT_RING}
            />
          </svg>
          <span data-k="verdict-num" className="relative text-sm md:text-lg font-extrabold tabular-nums text-[#f3d692]">
            0
          </span>
        </span>
        <span data-k="verdict-text" className="inline-block text-[11px] md:text-sm font-semibold text-white">
          / 10 <span className="font-medium text-neutral-400">· Mixed fundamentals</span>
        </span>
      </div>
    </div>
  );
}
