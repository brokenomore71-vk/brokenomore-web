'use client';

import React, { useEffect, useRef } from 'react';
import { IBM_Plex_Mono, Poppins } from 'next/font/google';
import { PaymentScene } from './paymentScene';
import { renderReceipt } from './receipt';
import { BILL, CAPTIONS, EQUAL, PEOPLE, inr } from './splitData';
import { BROKENOMORE_FEATURES } from '../featureScreens';
import type { SplitStoryRuntime } from './timeline';

const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin', 'latin-ext'] });
const plexMono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin', 'latin-ext'] });

const FEATURE = BROKENOMORE_FEATURES.find((f) => f.id === 'split')!;
const CHIP_LABELS = BILL.items.map((item) => ({ name: item.name, amount: inr(item.amount, 0) }));
const HIDDEN = { visibility: 'hidden' } as const;
const CENTERED = 'absolute left-1/2 top-1/2';

// Loads what the story needs, and redraws the receipt once its typeface is ready.
function loadStoryAssets(runtime: SplitStoryRuntime, sceneCanvas: HTMLCanvasElement) {
  const { assets, screen } = runtime;
  const load = (src: string) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      screen.dirty = true;
    };
    return img;
  };
  assets.sans = poppins.style.fontFamily;
  assets.hero = load('/assets/images/features/splitshare.jpeg');
  assets.logo = load('/assets/images/logo_white.png');
  PEOPLE.forEach((person) => {
    assets.avatars[person.id] = load(person.avatar);
  });

  const receipt = document.createElement('canvas');
  renderReceipt(receipt, plexMono.style.fontFamily);
  assets.receipt = receipt;

  try {
    runtime.paymentScene = new PaymentScene({
      canvas: sceneCanvas,
      params: runtime.sceneParams,
      receipt,
      getSweep: () => runtime.state.sweep,
      getFont: () => assets.sans,
    });
  } catch (error) {
    // Without WebGL the phone can't render either, so the rest of the page copes the same way
    console.warn('Payment machine scene unavailable:', error);
  }

  let cancelled = false;
  const glyphs = 'Aa0₹';
  Promise.all([
    ...[400, 500, 600, 700].map((w) => document.fonts.load(`${w} 40px ${poppins.style.fontFamily}`, glyphs)),
    ...[400, 500, 600].map((w) => document.fonts.load(`${w} 20px ${plexMono.style.fontFamily}`, glyphs)),
  ])
    .catch(() => undefined)
    .then(() => {
      if (cancelled) return;
      renderReceipt(receipt, plexMono.style.fontFamily);
      runtime.paymentScene?.receiptChanged();
      screen.dirty = true;
    });
  return () => {
    cancelled = true;
    runtime.paymentScene?.dispose();
    runtime.paymentScene = null;
  };
}

// Captions sit outside the stage so they line up with the section's normal heading.
export function SplitStoryCaptions() {
  return (
    <div className="absolute inset-x-0 top-6 sm:top-8 md:top-4 z-30 px-4 pointer-events-none" aria-hidden="true">
      <div className="relative mx-auto max-w-3xl">
        {/* The feature's name, announced as its chapter begins */}
        <div data-s="chapter-opening" style={HIDDEN} className="absolute inset-x-0 top-0 text-center">
          <div className="overflow-hidden pb-[0.14em]">
            <h2 data-s="chapter-name" className="text-5xl sm:text-7xl font-semibold text-white tracking-tight leading-[1.1]">
              {FEATURE.name}
            </h2>
          </div>
          <p data-s="chapter-tagline" className="text-sm sm:text-lg text-neutral-400 tracking-tight mt-2">
            {FEATURE.tagline}
          </p>
        </div>

        {CAPTIONS.map((caption, i) => (
          <div key={caption.title} data-s="caption" data-i={i} style={HIDDEN} className="absolute inset-x-0 top-0 text-center">
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

// The 2D objects around the phone. No z-index or transform on this wrapper, so each piece can
// sit in front of or behind the phone within the stage.
export default function SplitStoryLayer({ runtime }: { runtime: SplitStoryRuntime }) {
  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (sceneCanvasRef.current) return loadStoryAssets(runtime, sceneCanvasRef.current);
  }, [runtime]);

  return (
    <div data-split-story className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Scanner light */}
      <svg data-s="lines" style={{ ...HIDDEN, zIndex: 5 }} className={`${CENTERED} overflow-visible`} width="1" height="1">
        <defs>
          <linearGradient id="split-cone" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#818cf8" stopOpacity="0.3" />
            <stop offset="1" stopColor="#818cf8" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <polygon data-s="cone" fill="url(#split-cone)" style={HIDDEN} />
      </svg>

      {/* The payment machine and its paper. Oversized, so they can swing in from off the stage */}
      <canvas
        ref={sceneCanvasRef}
        style={{ ...HIDDEN, zIndex: 11, left: -160, top: -160, width: 'calc(100% + 320px)', height: 'calc(100% + 320px)' }}
        className="absolute block"
      />

      {/* Who paid: the whole amount going in from your card */}
      <div
        data-s="paid-pill"
        style={{ ...HIDDEN, zIndex: 30 }}
        className={`${CENTERED} flex items-center gap-2 whitespace-nowrap rounded-full border border-emerald-400/50 bg-[#10231d]/95 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-emerald-300 shadow-[0_8px_24px_rgba(0,0,0,0.55)]`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PEOPLE[0].avatar} alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-full" />
        <span>{inr(EQUAL.amount, 0)} paid</span>
      </div>

      {/* Each person's equal share, flying out of the receipt to them */}
      {EQUAL.shares.map((share, i) => (
        <div
          key={i}
          data-s="coin"
          style={{ ...HIDDEN, zIndex: 30 }}
          className={`${CENTERED} flex items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-300/60 bg-indigo-500 py-1 pl-1 pr-3 text-xs font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.7)]`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[11px] font-bold text-indigo-600">₹</span>
          <span>{inr(share)}</span>
        </div>
      ))}

      {/* Line items travelling from the paper into the phone */}
      {CHIP_LABELS.map((chip) => (
        <div
          key={chip.name}
          data-s="chip"
          style={{ ...HIDDEN, zIndex: 30 }}
          className={`${CENTERED} flex items-center gap-3 whitespace-nowrap rounded-full border border-indigo-400/50 bg-[#16171b]/95 px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.55)]`}
        >
          <span>{chip.name}</span>
          <span className="font-semibold text-indigo-300">{chip.amount}</span>
        </div>
      ))}

      {/* The people splitting, around the phone */}
      {PEOPLE.map((person) => (
        <div
          key={person.id}
          data-s="person"
          style={{ ...HIDDEN, zIndex: 30 }}
          className={`${CENTERED} w-[150px] md:w-[216px] rounded-2xl border border-white/15 bg-neutral-900/90 p-2 md:p-3.5 shadow-[0_12px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl`}
        >
          <div className="flex items-center gap-2 md:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={person.avatar} alt="" width={40} height={40} className="h-7 w-7 md:h-10 md:w-10 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] md:text-[15px] font-semibold tracking-tight text-white">{person.name}</span>
                <span data-s="person-amount" className="text-[12px] md:text-[15px] font-semibold tabular-nums text-white" />
              </div>
              <span data-s="person-sub" className="block truncate text-[10px] md:text-[11px] font-medium text-neutral-400" />
            </div>
          </div>
          <div className="mt-2 md:mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
            <div data-s="person-bar" className="h-full w-full origin-left rounded-full bg-indigo-500" />
          </div>
        </div>
      ))}
    </div>
  );
}
