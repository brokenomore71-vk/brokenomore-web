'use client';

import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { PX_PER_SECOND, stepScroll } from './stepScroll';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// Phones' address bar resizing the window shouldn't re-measure every pin mid-scroll
ScrollTrigger.config({ ignoreMobileResize: true });

// What the pinned, one-step-per-scroll sections share (Stock Analysis & AI, Split & Share).

// Eases the pointer's position over an element into --px / --py (-1 to 1)
export function usePointerVars(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const look = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };
    const step = () => {
      const dx = target.x - look.x;
      const dy = target.y - look.y;
      if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return;
      const k = Math.min(1, 0.07 * gsap.ticker.deltaRatio());
      look.x += dx * k;
      look.y += dy * k;
      el.style.setProperty('--px', look.x.toFixed(4));
      el.style.setProperty('--py', look.y.toFixed(4));
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    gsap.ticker.add(step);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.ticker.remove(step);
    };
  }, [ref]);
}

// A pinned section whose timeline the scroll scrubs. Its length is set by stepThroughLabels, from
// the timeline's own length.
// These pins sit above every other one on the page, so they're measured first (the split story's
// pin, next down, has refreshPriority 4)
export function pinned(section: HTMLElement, refreshPriority: number) {
  return {
    refreshPriority,
    trigger: section,
    start: 'top 72px',
    end: '+=1',
    pin: true,
    anticipatePin: 1,
    scrub: 0.4,
    invalidateOnRefresh: true,
  };
}

// One step per gesture, from label to label (see stepScroll.ts). `secondsPerUnit` is how long one
// unit of the timeline takes to play; the pin is as long as the whole timeline takes to watch.
export function stepThroughLabels(tl: gsap.core.Timeline, secondsPerUnit = 0.8) {
  const st = tl.scrollTrigger!;
  st.vars.end = () => `+=${Math.round(tl.duration() * secondsPerUnit * PX_PER_SECOND)}`;
  ScrollTrigger.refresh();
  return stepScroll({
    pin: st,
    stops: () => Object.values(tl.labels).map((t) => t / tl.duration()),
    seconds: (from, to) => (to - from) * tl.duration() * secondsPerUnit,
    settled: () => Math.abs(tl.progress() - st.progress) < 0.003,
  });
}

