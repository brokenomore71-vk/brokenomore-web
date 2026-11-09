'use client';

import React, { useEffect } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SCORE, STOCK_CAPTIONS, WEIGHTS } from './stockData';
import type { StockStoryRuntime } from './timeline';

// The app's own typeface, for the phone's screen and the pieces around it
const jakarta = Plus_Jakarta_Sans({ weight: ['400', '500', '600', '700', '800'], subsets: ['latin', 'latin-ext'] });

const HIDDEN = { visibility: 'hidden' } as const;
const CENTERED = 'absolute left-1/2 top-1/2';

function loadStockAssets(runtime: StockStoryRuntime) {
  const { assets, screen } = runtime;
  assets.sans = jakarta.style.fontFamily;
  const logo = new Image();
  logo.src = '/assets/images/logo_white.png';
  logo.onload = () => {
    screen.dirty = true;
  };
  assets.logo = logo;

  let cancelled = false;
  Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${jakarta.style.fontFamily}`, 'Aa0')))
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

// The balance scale beside the phone. Its geometry is set by the timeline on every update, as
// the beam tips under the weights.
export default function StockStoryLayer({ runtime }: { runtime: StockStoryRuntime }) {
  useEffect(() => loadStockAssets(runtime), [runtime]);

  return (
    <div data-stock-story className={`absolute inset-0 pointer-events-none ${jakarta.className}`} aria-hidden="true">
      <svg data-k="scale" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} overflow-visible`} width="1" height="1">
        {/* Stand */}
        <path data-k="stand" fill="#2a2a30" stroke="#4b4b52" strokeWidth="1.5" />
        {/* Strings, beam and pans */}
        <path data-k="strings" fill="none" stroke="#6b6b73" strokeWidth="1.5" />
        <line data-k="beam" stroke="#d4d4d8" strokeWidth="6" strokeLinecap="round" />
        <circle data-k="pivot" r="8" fill="#d4d4d8" />
        <path data-k="pan-left" fill="#1f2a25" stroke="#3f6b58" strokeWidth="1.5" />
        <path data-k="pan-right" fill="#2c2618" stroke="#7a6230" strokeWidth="1.5" />
      </svg>

      {/* Pan labels, which ride along under each pan */}
      <div data-k="pan-label" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} whitespace-nowrap text-[10px] md:text-xs font-semibold uppercase tracking-wider text-emerald-400`}>
        Strengths
      </div>
      <div data-k="pan-label" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} whitespace-nowrap text-[10px] md:text-xs font-semibold uppercase tracking-wider text-amber-400`}>
        Watch-outs
      </div>

      {/* The facts, as weights */}
      {WEIGHTS.map((w) => (
        <div
          key={w.label}
          data-k="weight"
          style={{ ...HIDDEN, zIndex: 31 }}
          className={`${CENTERED} flex items-center justify-between gap-2 whitespace-nowrap rounded-md border px-2 py-1 md:px-3 md:py-1.5 w-[104px] md:w-[150px] ${
            w.side === 'strength' ? 'border-emerald-700 bg-[#14261e]' : 'border-amber-700 bg-[#2a2213]'
          }`}
        >
          <span className="text-[9px] md:text-[11px] font-medium text-neutral-300">{w.label}</span>
          <span className="text-[11px] md:text-sm font-bold text-white">{w.value}</span>
        </div>
      ))}

      {/* What it all comes to */}
      <div
        data-k="verdict"
        style={{ ...HIDDEN, zIndex: 31 }}
        className={`${CENTERED} flex items-center gap-2 whitespace-nowrap rounded-full border border-neutral-600 bg-[#18181b] py-1 pl-1 pr-3 md:pr-4`}
      >
        <span className="flex h-7 w-7 md:h-9 md:w-9 items-center justify-center rounded-full bg-[#e5b85c] text-sm md:text-lg font-extrabold text-[#18181b]">
          {SCORE}
        </span>
        <span className="text-[11px] md:text-sm font-semibold text-white">
          / 10 <span className="font-medium text-neutral-400">· Mixed fundamentals</span>
        </span>
      </div>
    </div>
  );
}
