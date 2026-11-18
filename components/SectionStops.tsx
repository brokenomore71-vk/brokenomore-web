'use client';

import { useEffect } from 'react';

// Fast scrolling (a hard wheel flick, a trackpad's momentum, a phone swipe's glide) used to carry
// the page straight past the last sections, which have no pinned story to hold it. Every element
// marked `data-scroll-stop` is a stop on the way down: a fast scroll that would cross its top
// comes to rest exactly there instead, and the rest of that flick's momentum is let go. Normal
// scrolling, scrolling up, and links that jump straight to a section are left alone.

// Scrolled this far (px) within FAST_WINDOW_MS counts as a fast scroll
const FAST_PX = 600;
const FAST_WINDOW_MS = 200;
// After a stop, the wheel has to rest this long before the page scrolls on again
const QUIET_MS = 350;
// A phone swipe's glide is caught for this long after the finger lifts
const GLIDE_MS = 2500;

export default function SectionStops() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stops = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-stop]')).map(
        (el) => Math.round(el.getBoundingClientRect().top + window.scrollY)
      );
    // The first stop strictly between `from` and `to` (scrolling down), if any
    const crossed = (from: number, to: number) => stops().find((s) => from < s - 2 && to > s + 2);

    // ---- Wheel and trackpad ----
    let recent: { t: number; dy: number }[] = [];
    let holdUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.defaultPrevented || e.ctrlKey) return;
      const now = performance.now();
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const dy = e.deltaY * scale;
      // Still the momentum of the flick that was just stopped: let it go
      if (now < holdUntil && dy > 0) {
        e.preventDefault();
        holdUntil = now + QUIET_MS;
        return;
      }
      holdUntil = 0;
      if (dy <= 0) {
        recent = [];
        return;
      }
      recent = recent.filter((r) => now - r.t < FAST_WINDOW_MS);
      recent.push({ t: now, dy });
      const fast = recent.reduce((sum, r) => sum + r.dy, 0) > FAST_PX || dy > window.innerHeight * 0.6;
      if (!fast) return;
      const y = window.scrollY;
      const stop = crossed(y, y + dy);
      if (stop === undefined) return;
      e.preventDefault();
      window.scrollTo({ top: stop, behavior: 'instant' });
      holdUntil = now + QUIET_MS;
      recent = [];
    };

    // ---- Touch: the glide after a swipe sends no events of its own, so watch the scroll ----
    let touching = false;
    let swiped = false;
    let touchStartY = 0;
    let liftedAt = 0;
    let lastY = window.scrollY;
    const onTouchStart = (e: TouchEvent) => {
      touching = true;
      swiped = false;
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (Math.abs((e.touches[0]?.clientY ?? touchStartY) - touchStartY) > 10) swiped = true;
    };
    const onTouchEnd = () => {
      touching = false;
      liftedAt = performance.now();
    };
    const onScroll = () => {
      const y = window.scrollY;
      const step = y - lastY;
      lastY = y;
      // Only a glide going down, in steps (a link's jump lands in one go and is left alone)
      if (touching || !swiped || step <= 0 || step > window.innerHeight) return;
      if (performance.now() - liftedAt > GLIDE_MS) return;
      const stop = crossed(y - step, y);
      if (stop === undefined) return;
      swiped = false;
      window.scrollTo({ top: stop, behavior: 'instant' });
      lastY = stop;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return null;
}
