'use client';

import React, { useEffect } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { GOLD_CAPTIONS, GOLD_DATA, inr } from './goldData';
import type { GoldStoryRuntime } from './timeline';

const jakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext'],
});

const HIDDEN = { visibility: 'hidden' } as const;
const CENTERED = 'absolute left-1/2 top-1/2';

function loadGoldAssets(runtime: GoldStoryRuntime) {
  const { assets, screen } = runtime;
  assets.sans = jakarta.style.fontFamily;

  const loadImg = (src: string, setter: (img: HTMLImageElement) => void) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setter(img);
      screen.dirty = true;
    };
  };

  loadImg('/assets/images/gold/home.jpg', (img) => (assets.homeImg = img));
  loadImg('/assets/images/gold/buy.jpg', (img) => (assets.buyImg = img));
  loadImg('/assets/images/gold/sell.jpg', (img) => (assets.sellImg = img));
  loadImg('/assets/images/gold/delivery.jpg', (img) => (assets.deliveryImg = img));

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

// Captions sitting above the stage matching the hero header typography
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
            Invest in 24K 99.5% pure digital gold starting at just ₹10.
          </p>
        </div>

        {GOLD_CAPTIONS.map((caption) => (
          <div key={caption.title} data-g="caption" style={HIDDEN} className="absolute inset-x-0 top-0 text-center">
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

// Colors for the physical gold objects and badges
const GOLD_LIGHT = '#fff4cc';
const GOLD_MID = '#f59e0b';
const GOLD_DARK = '#854d0e';
const GOLD_EDGE = '#451a03';

export default function GoldStoryLayer({ runtime }: { runtime: GoldStoryRuntime }) {
  useEffect(() => loadGoldAssets(runtime), [runtime]);

  return (
    <div data-gold-story className={`absolute inset-0 pointer-events-none ${jakarta.className}`} aria-hidden="true">
      {/* 1. Floating Live Price Ticker Tag above the phone */}
      <div
        data-g="ticker"
        style={{ ...HIDDEN, zIndex: 32 }}
        className="absolute left-1/2 -translate-x-1/2 -top-12 sm:-top-16 flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900/90 border border-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.2)] backdrop-blur-md"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
        <span className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-300">
          24K · 99.5% PURE GOLD
        </span>
        <span className="text-xs sm:text-sm font-bold text-amber-400">
          {inr(GOLD_DATA.buyRate)}/g
        </span>
      </div>

      {/* 2. 3D Pure Gold Bullion Ingot (appears during Buy stage) */}
      <div
        data-g="bar-group"
        style={{ ...HIDDEN, zIndex: 28 }}
        className={`${CENTERED} flex flex-col items-center select-none`}
      >
        <svg
          data-g="gold-bar"
          width="260"
          height="160"
          viewBox="-130 -80 260 160"
          className="overflow-visible drop-shadow-[0_24px_50px_rgba(245,158,11,0.35)]"
        >
          <defs>
            <linearGradient id="bar-bevel-top" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fffae0" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="bar-face" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fffbeb" />
              <stop offset="0.25" stopColor="#fde68a" />
              <stop offset="0.6" stopColor="#d97706" />
              <stop offset="1" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="bar-side" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#78350f" />
              <stop offset="1" stopColor="#451a03" />
            </linearGradient>
            <radialGradient id="bar-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Golden Ambient Glow Aura */}
          <circle cx="0" cy="0" r="100" fill="url(#bar-glow)" />

          {/* 3D Isometric Gold Bar */}
          {/* Bottom bevel */}
          <path d="M-100 35 L-76 56 L76 56 L100 35 Z" fill="#78350f" />
          {/* Right bevel */}
          <path d="M100 -35 L118 -20 L76 56 L100 35 Z" fill="#92400e" />
          {/* Main Top Face */}
          <polygon
            points="-92,-30 92,-30 74,32 -74,32"
            fill="url(#bar-face)"
            stroke="#fef3c7"
            strokeWidth="1.2"
          />
          {/* Hallmark Stamps */}
          <text x="0" y="-12" textAnchor="middle" fill="#78350f" fontSize="11" fontWeight="800" letterSpacing="2">
            SAFEGOLD
          </text>
          <text x="0" y="4" textAnchor="middle" fill="#78350f" fontSize="16" fontWeight="900" letterSpacing="3">
            999.9
          </text>
          <text x="0" y="20" textAnchor="middle" fill="#78350f" fontSize="9" fontWeight="700" letterSpacing="1.5">
            FINE GOLD · 100g
          </text>

          {/* Specular Glint Highlight */}
          <line x1="-60" y1="-28" x2="60" y2="-28" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" />
        </svg>

        {/* Floating badge below gold bar */}
        <div
          data-g="bar-badge"
          className="mt-3 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-sm"
        >
          Institutional Grade · Insured Locker
        </div>
      </div>

      {/* 3. Real 24K Minted Physical Gold Medallion / Coin (appears during Delivery stage) */}
      <div
        data-g="coin-group"
        style={{ ...HIDDEN, zIndex: 29 }}
        className={`${CENTERED} flex flex-col items-center select-none`}
      >
        <svg
          data-g="gold-coin"
          width="240"
          height="240"
          viewBox="-120 -120 240 240"
          className="overflow-visible drop-shadow-[0_20px_48px_rgba(245,158,11,0.4)]"
        >
          <defs>
            <radialGradient id="coin-rim" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#fffbeb" />
              <stop offset="0.35" stopColor="#f59e0b" />
              <stop offset="0.7" stopColor="#d97706" />
              <stop offset="1" stopColor="#78350f" />
            </radialGradient>
            <radialGradient id="coin-face" cx="0.45" cy="0.4" r="0.65">
              <stop offset="0" stopColor="#fef3c7" />
              <stop offset="0.5" stopColor="#fbbf24" />
              <stop offset="0.85" stopColor="#b45309" />
              <stop offset="1" stopColor="#78350f" />
            </radialGradient>
            <linearGradient id="coin-shine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer Reeded Milled Edge */}
          <circle cx="0" cy="0" r="92" fill="#78350f" stroke="#b45309" strokeWidth="3" />
          {/* Raised Metallic Rim */}
          <circle cx="0" cy="0" r="88" fill="url(#coin-rim)" stroke="#fffbeb" strokeWidth="1.5" />
          {/* Inner Frosted Coin Face */}
          <circle cx="0" cy="0" r="76" fill="url(#coin-face)" />

          {/* Embossed Relief Circle */}
          <circle cx="0" cy="0" r="68" fill="none" stroke="#78350f" strokeWidth="1" strokeDasharray="3 3" />

          {/* Minted Emblem: Stylized SafeGold 'G' Crest */}
          <g transform="translate(0, -6)">
            <circle cx="0" cy="0" r="32" fill="none" stroke="#78350f" strokeWidth="3" />
            <path
              d="M12 -12 A20 20 0 1 0 16 10 L0 10"
              fill="none"
              stroke="#78350f"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* Coin Mint Inscriptions */}
          <text x="0" y="38" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="800" letterSpacing="1.8">
            24K · 99.99% PURE
          </text>
          <text x="0" y="52" textAnchor="middle" fill="#78350f" fontSize="8" fontWeight="700" letterSpacing="1">
            DOORSTEP DELIVERY
          </text>

          {/* Specular Light Reflection Sweep */}
          <path d="M-60 -50 A76 76 0 0 1 60 -50 Q0 -20 -60 -50 Z" fill="url(#coin-shine)" />
        </svg>

        {/* Doorstep Delivery Seal Card */}
        <div
          data-g="delivery-card"
          className="mt-4 px-4 py-2.5 rounded-2xl bg-neutral-900/95 border border-amber-500/30 flex items-center gap-3 shadow-2xl backdrop-blur-md"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold text-xs">
            🚚
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-tight">
              100% Insured Doorstep Delivery
            </span>
            <span className="text-[11px] text-neutral-400 tracking-tight">
              Tamper-evident vault packaging directly to your PIN code
            </span>
          </div>
        </div>
      </div>

      {/* 4. Instant UPI Payout Card (appears during Sell stage) */}
      <div
        data-g="payout-group"
        style={{ ...HIDDEN, zIndex: 30 }}
        className={`${CENTERED} flex flex-col items-center select-none`}
      >
        <div className="px-5 py-4 rounded-2xl bg-neutral-900/95 border border-emerald-500/40 shadow-[0_16px_40px_rgba(16,185,129,0.2)] backdrop-blur-md flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 text-lg font-bold">
            ✓
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Instant UPI Settlement</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                COMPLETED
              </span>
            </div>
            <span className="text-xs text-neutral-300 mt-0.5">
              <span className="font-semibold text-emerald-400">₹2,000.00</span> credited to {GOLD_DATA.upiId}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5">
              Zero lock-in · Sold at live market rate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
