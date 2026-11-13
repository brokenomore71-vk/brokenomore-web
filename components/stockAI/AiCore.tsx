'use client';

import React, { useEffect, useRef } from 'react';
import { brand } from '@/app/fonts';
import type { AiCoreScene, Ticker } from './aiCoreScene';
import { renderReceipt } from '../splitStory/receipt';

// The 3D AI core in a box: loaded as it comes near, drawn only while on screen, tilted by the
// pointer over `pointerArea` (or itself). `energy` spins it up; the parent can also drive it each
// frame through `energyRef`. For an intro, `appear` (the crystal) and `emerge` (the ticker cards
// coming out of it) start false and are turned on in turn; `onReady` says when the 3D has loaded.
export default function AiCore({
  tickers,
  energy = 0,
  energyRef,
  appear = true,
  emerge = true,
  onReady,
  receiptFont,
  className = '',
  fallback,
}: {
  tickers?: Ticker[];
  energy?: number;
  energyRef?: React.MutableRefObject<number>;
  appear?: boolean;
  emerge?: boolean;
  onReady?: () => void;
  // With this (a monospace font family), the centrepiece is the split story's bill, not the crystal
  receiptFont?: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<AiCoreScene | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const tickersRef = useRef(tickers);
  const energyNow = useRef(energy);
  energyNow.current = energy;
  const introNow = useRef({ appear, emerge, onReady });
  introNow.current = { appear, emerge, onReady };
  const receiptFontRef = useRef(receiptFont);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let visible = false;
    let ro: ResizeObserver | null = null;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      sceneRef.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const pump = () => {
      if (energyRef) sceneRef.current?.setEnergy(energyRef.current);
      raf = requestAnimationFrame(pump);
    };

    const load = () =>
      import('./aiCoreScene')
        .then(async ({ AiCoreScene }) => {
          // The bill's typeface has to be in before it's drawn
          if (receiptFontRef.current) {
            await Promise.all([400, 500, 600].map((w) => document.fonts.load(`${w} 12px ${receiptFontRef.current}`))).catch(() => undefined);
          }
          if (cancelled) return;
          const intro = introNow.current;
          let receipt: HTMLCanvasElement | undefined;
          if (receiptFontRef.current) {
            receipt = document.createElement('canvas');
            renderReceipt(receipt, receiptFontRef.current);
          }
          const scene = new AiCoreScene({ tickers: tickersRef.current, font: brand.style.fontFamily, appear: intro.appear, emerge: intro.emerge, receipt });
          sceneRef.current = scene;
          host.appendChild(scene.canvas);
          ro = new ResizeObserver(() => scene.resize(host.clientWidth, host.clientHeight));
          ro.observe(host);
          scene.resize(host.clientWidth, host.clientHeight);
          scene.setEnergy(energyNow.current);
          scene.setActive(visible);
          if (fallbackRef.current) fallbackRef.current.style.opacity = '0';
          if (energyRef) raf = requestAnimationFrame(pump);
          intro.onReady?.();
        })
        .catch((error) => console.warn('AI core failed to load:', error));

    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          near.disconnect();
          load();
        }
      },
      { rootMargin: '120% 0px' }
    );
    near.observe(host);
    const onScreen = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      sceneRef.current?.setActive(visible);
    });
    onScreen.observe(host);
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      ro?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [energyRef]);

  useEffect(() => {
    sceneRef.current?.setEnergy(energy);
  }, [energy]);

  useEffect(() => {
    sceneRef.current?.setIntro(appear, emerge);
  }, [appear, emerge]);

  return (
    <div ref={hostRef} className={`relative ${className}`}>
      {fallback && (
        <div ref={fallbackRef} className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500">
          {fallback}
        </div>
      )}
    </div>
  );
}

// The crystal as a flat drawing: shown until (or if) the 3D one can't load
export function CrystalMark({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} fill="none" stroke="#6E5BFF" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 4 L14 40 L32 50 L50 40 Z M32 4 L28 47 M14 40 L28 47 L50 40" />
      <path d="M20 54 L44 54 L32 76 Z M32 76 L30 56" />
    </svg>
  );
}
