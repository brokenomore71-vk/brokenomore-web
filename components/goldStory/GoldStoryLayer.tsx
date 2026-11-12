'use client';

import React, { useEffect } from 'react';
import { brand } from '@/app/fonts';
import { GOLD, GOLD_CAPTIONS } from './goldData';
import type { GoldStoryRuntime } from './timeline';


const HIDDEN = { visibility: 'hidden' } as const;
const CENTERED = 'absolute left-1/2 top-1/2';

function loadGoldAssets(runtime: GoldStoryRuntime) {
  const { assets, screen } = runtime;
  assets.sans = brand.style.fontFamily;
  const hero = new Image();
  hero.src = '/assets/images/features/goldsavings.jpeg';
  hero.onload = () => {
    screen.dirty = true;
  };
  assets.hero = hero;

  let cancelled = false;
  Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${brand.style.fontFamily}`, 'Aa0₹')))
    .catch(() => undefined)
    .then(() => {
      if (!cancelled) screen.dirty = true;
    });
  return () => {
    cancelled = true;
  };
}

// Captions sit outside the stage so they line up with the section's normal heading.
export function GoldStoryCaptions() {
  return (
    <div data-gold-captions className="absolute inset-x-0 top-6 sm:top-8 md:top-4 z-30 px-4 pointer-events-none" aria-hidden="true">
      <div className="relative mx-auto max-w-3xl">
        <div data-g="chapter-opening" style={HIDDEN} className="absolute inset-x-0 top-0 text-center">
          <div className="overflow-hidden pb-[0.14em]">
            <h2 data-g="chapter-name" className="text-5xl sm:text-7xl font-semibold text-white tracking-tight leading-[1.1]">
              Gold Savings
            </h2>
          </div>
          <p data-g="chapter-tagline" className="text-sm sm:text-lg text-neutral-400 tracking-tight mt-2">
            24K, 99.5% pure gold from ₹10, vaulted by SafeGold.
          </p>
        </div>
        {GOLD_CAPTIONS.map((caption) => (
          <div key={caption.title} data-g="caption" style={HIDDEN} className="absolute inset-x-0 top-0 text-center">
            <h3 className="text-[26px] sm:text-5xl font-semibold text-white tracking-tight leading-[1.2] mt-1">{caption.title}</h3>
            <p className="text-sm sm:text-base text-neutral-400 tracking-tight mt-2">{caption.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// The vault bar, the gold poured into it, the coin taken out of it and the box it ships in. The
// timeline sets their geometry, so they sit beside the phone wherever it is.
export default function GoldStoryLayer({ runtime }: { runtime: GoldStoryRuntime }) {
  useEffect(() => loadGoldAssets(runtime), [runtime]);

  return (
    <div data-gold-story className={`absolute inset-0 pointer-events-none ${brand.className}`} aria-hidden="true">
      <svg data-g="props" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} overflow-visible`} width="1" height="1">
        <defs>
          <clipPath id="gold-bar-clip">
            <path data-g="bar-clip" />
          </clipPath>
        </defs>
        {/* Gold pouring out of the phone */}
        <path data-g="pour" fill="none" stroke="#d9a441" strokeWidth="9" strokeLinecap="round" pathLength={1} strokeDasharray="1 2" strokeDashoffset="1" />
        {/* The vault, as a bar mould that fills with what you own */}
        <path data-g="bar-back" fill="#1d1a14" stroke="#6e5626" strokeWidth="2" />
        <g clipPath="url(#gold-bar-clip)">
          <rect data-g="bar-fill" fill="#d9a441" />
          <rect data-g="bar-surface" fill="#efc76c" height="5" />
        </g>
        <text data-g="bar-mark" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="3" fill="#8a6420">
          SAFEGOLD · 24K
        </text>
        {/* The delivery box, open at the top until its lid drops on */}
        <g data-g="box">
          <rect data-g="box-body" fill="#8a6a3e" stroke="#5e4626" strokeWidth="2" rx="4" />
          <rect data-g="box-opening" fill="#3b2a16" />
          <rect data-g="box-tape" fill="#b89462" />
          <rect data-g="box-lid" fill="#9c7a4a" stroke="#5e4626" strokeWidth="2" rx="3" />
        </g>
      </svg>

      {/* What's in the vault */}
      <div data-g="vault" style={{ ...HIDDEN, zIndex: 30 }} className={`${CENTERED} whitespace-nowrap text-center`}>
        <div className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-neutral-400">Your vault</div>
        <div className="text-base md:text-2xl font-bold tabular-nums text-white">
          <span data-g="vault-grams">{GOLD.startGrams.toFixed(4)}</span>
          <span className="ml-1 text-xs md:text-base font-medium text-neutral-400">g</span>
        </div>
      </div>

      {/* The 0.5 g coin, minted out of the vault */}
      <div
        data-g="coin"
        style={{ ...HIDDEN, zIndex: 31 }}
        className={`${CENTERED} flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full border-[3px] border-[#a77a2c] bg-[linear-gradient(180deg,#ecc56f,#b98a35)]`}
      >
        <span className="flex h-[78%] w-[78%] items-center justify-center rounded-full border border-[#9a6f24]/50 text-lg md:text-2xl font-extrabold text-[#8a6420]">G</span>
      </div>

      {/* The shipping label */}
      <div
        data-g="label"
        style={{ ...HIDDEN, zIndex: 31 }}
        className={`${CENTERED} whitespace-nowrap rounded-sm bg-[#f4efe4] px-2 py-1 text-left text-[9px] md:text-[11px] leading-tight text-[#2a2216]`}
      >
        <div className="font-bold">0.5 g · 24K · Insured</div>
        <div>
          {GOLD.pincode} · {GOLD.dispatch}
        </div>
      </div>
    </div>
  );
}
