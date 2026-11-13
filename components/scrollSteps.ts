'use client';

import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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

// Pinned, one scroll per step (the timeline has a label at each whole step, 0 to `steps`)
// These pins sit above every other one on the page, so they're measured first (the split story's
// pin, next down, has refreshPriority 4)
export function pinned(section: HTMLElement, steps: number, refreshPriority: number) {
  return {
    refreshPriority,
    trigger: section,
    start: 'top 72px',
    end: () => `+=${window.innerHeight * 0.7 * steps}`,
    pin: true,
    scrub: 0.8,
    invalidateOnRefresh: true,
  };
}

// Each scroll moves exactly one step: when the scroll comes to rest between two labels, it glides
// on to the next one in the direction it was going (as the Loan Planner does)
export function glideBetweenLabels(tl: gsap.core.Timeline) {
  const st = tl.scrollTrigger!;
  const stops = () => Object.values(tl.labels).map((v) => v / tl.duration()).sort((a, b) => a - b);
  let settledAt = st.scroll();
  let gliding = false;
  const onScrollEnd = () => {
    if (gliding || !st.isActive) {
      settledAt = st.scroll();
      return;
    }
    const now = st.scroll();
    const dir = Math.sign(now - settledAt);
    const p = st.progress;
    const eps = 0.004;
    const list = stops();
    if (dir === 0 || list.some((q) => Math.abs(q - p) < eps)) {
      settledAt = now;
      return;
    }
    const target = dir > 0 ? (list.find((q) => q > p + eps) ?? 1) : ([...list].reverse().find((q) => q < p - eps) ?? 0);
    gliding = true;
    const html = document.documentElement;
    const before = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    const done = () => {
      html.style.scrollBehavior = before;
      gliding = false;
      settledAt = st.scroll();
    };
    gsap.to(window, { scrollTo: { y: st.start + target * (st.end - st.start), autoKill: true }, duration: 0.7, ease: 'power2.inOut', onComplete: done, onInterrupt: done });
  };
  ScrollTrigger.addEventListener('scrollEnd', onScrollEnd);
  return () => ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
}

