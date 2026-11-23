'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// How every pinned story on the site scrolls:
// - Its length on the page follows the length of its animation: PX_PER_SECOND of scroll for each
//   second of animation, so a long step takes more scrolling than a short one.
// - Each gesture (a wheel flick, a swipe, a key) plays exactly one step, start to finish, at the
//   pace it was designed to be watched at. Until it has finished, the page holds still and further
//   scrolling is ignored, so no step is ever skipped.
// - A fast scroll from outside comes to rest at the story's edge instead of flying past it.
// - Links that jump to a section (the navbar, the footer, the partner button) are let through.

export const PX_PER_SECOND = 600;

// ---- Jumps that are let through ----
let freeUntil = 0;
export function letScrollThrough(ms = 2000) {
  freeUntil = performance.now() + ms;
}
const isFree = () => performance.now() < freeUntil;
if (typeof window !== 'undefined') {
  document.addEventListener(
    'click',
    (e) => {
      if ((e.target as Element | null)?.closest?.('a[href*="#"]')) letScrollThrough();
    },
    true
  );
  window.addEventListener('reveal-partner', () => letScrollThrough());
}

export type StepScrollOptions = {
  /** The story's pin */
  pin: ScrollTrigger;
  /** Where the story comes to rest, as 0 to 1 of the pin, ascending */
  stops: () => number[];
  /** How long the move between two stops plays, in seconds (`from` < `to`) */
  seconds: (from: number, to: number) => number;
  /** Whether the animation has caught up with the scroll */
  settled?: () => boolean;
};

const EPS = 0.002;
const LINE_PX = 16;
// The wheel resting this long (ms) means the next wheel event is a new gesture
const NEW_GESTURE_MS = 180;
// A finger has to travel this far (px) to count as a swipe
const SWIPE_PX = 24;
// A phone swipe's glide after the finger lifts is watched for this long (ms)
const GLIDE_MS = 2500;
const KEY_DIR: Record<string, number> = { ' ': 1, PageDown: 1, ArrowDown: 1, PageUp: -1, ArrowUp: -1 };

export function stepScroll({ pin, stops, seconds, settled = () => true }: StepScrollOptions) {
  const list = () => {
    const s = stops();
    return [0, ...s, 1].filter((q, i, a) => q >= 0 && q <= 1 && a.indexOf(q) === i).sort((a, b) => a - b);
  };
  const yAt = (p: number) => Math.round(pin.start + (pin.end - pin.start) * p);
  const inside = (y: number) => y >= pin.start - 1 && y <= pin.end + 1;
  let move: gsap.core.Tween | null = null;
  const busy = () => !!move || !settled();

  // Plays on to the next stop in that direction, by scrolling there at the animation's own pace
  const step = (dir: number) => {
    const from = pin.progress;
    const stopsNow = list();
    const to = dir > 0 ? stopsNow.find((q) => q > from + EPS) : [...stopsNow].reverse().find((q) => q < from - EPS);
    if (to === undefined) return false;
    move = gsap.to(window, {
      scrollTo: { y: yAt(to), autoKill: false },
      duration: Math.max(0.2, seconds(Math.min(from, to), Math.max(from, to))),
      ease: 'none',
      onComplete: () => {
        move = null;
      },
    });
    return true;
  };

  // Decides what a scroll gesture does. Returns true when it started a step.
  const gate = (e: Event, delta: number, fresh: boolean) => {
    if (!delta || e.defaultPrevented || isFree()) return false;
    const y = window.scrollY;
    const dir = Math.sign(delta);
    const hold = () => {
      if (e.cancelable) e.preventDefault();
    };
    if (!inside(y)) {
      // Coming in from outside: stop at the story's edge rather than scroll past it
      if (dir > 0 && y < pin.start - 1 && y + delta > pin.start) {
        hold();
        window.scrollTo({ top: yAt(0), behavior: 'instant' });
      } else if (dir < 0 && y > pin.end + 1 && y + delta < pin.end) {
        hold();
        window.scrollTo({ top: yAt(1), behavior: 'instant' });
      }
      return false;
    }
    // At either end, once it has finished playing, the page scrolls on as normal
    const p = pin.progress;
    if (!busy() && ((dir > 0 && p >= 1 - EPS) || (dir < 0 && p <= EPS))) return false;
    hold();
    if (busy() || !fresh) return false;
    return step(dir);
  };

  // ---- Wheel and trackpad ----
  let lastWheelAt = 0;
  let lastWheelAbs = 0;
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? window.innerHeight : 1);
    const now = performance.now();
    const abs = Math.abs(dy);
    // A new gesture: after the wheel has rested, or a fresh push (a flick's momentum only ever dies
    // away), or a mouse wheel's notch
    const fresh =
      now - lastWheelAt > NEW_GESTURE_MS ||
      (abs > 10 && abs > lastWheelAbs * 1.4) ||
      e.deltaMode !== 0 ||
      (abs >= 100 && Number.isInteger(dy) && abs >= lastWheelAbs);
    lastWheelAt = now;
    lastWheelAbs = abs;
    gate(e, dy, fresh);
  };

  // ---- Touch: one swipe, one step ----
  let touching = false;
  let swiped = false;
  let touchStartY = 0;
  let touchLastY = 0;
  let liftedAt = 0;
  const onTouchStart = (e: TouchEvent) => {
    touching = true;
    swiped = false;
    touchStartY = touchLastY = e.touches[0]?.clientY ?? 0;
  };
  const onTouchMove = (e: TouchEvent) => {
    const cy = e.touches[0]?.clientY ?? touchLastY;
    const delta = touchLastY - cy;
    touchLastY = cy;
    if (gate(e, delta, !swiped && Math.abs(touchStartY - cy) > SWIPE_PX)) swiped = true;
  };
  const onTouchEnd = () => {
    touching = false;
    liftedAt = performance.now();
  };

  // ---- Keys ----
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, button, [contenteditable="true"]')) return;
    const dir = e.key === ' ' && e.shiftKey ? -1 : KEY_DIR[e.key];
    if (!dir || !inside(window.scrollY)) return;
    gate(e, dir, !e.repeat);
  };

  // ---- Watching the scroll itself: a phone swipe's glide, and stopping between two stops ----
  let lastY = window.scrollY;
  let lastDir = 1;
  const onScroll = () => {
    const y = window.scrollY;
    const d = y - lastY;
    lastY = y;
    if (!d) return;
    lastDir = Math.sign(d);
    if (touching || move || isFree() || Math.abs(d) > window.innerHeight) return;
    if (performance.now() - liftedAt > GLIDE_MS) return;
    if (d > 0 && y - d < pin.start - 1 && y > pin.start + 1) {
      window.scrollTo({ top: yAt(0), behavior: 'instant' });
      lastY = yAt(0);
    } else if (d < 0 && y - d > pin.end + 1 && y < pin.end - 1) {
      window.scrollTo({ top: yAt(1), behavior: 'instant' });
      lastY = yAt(1);
    }
  };
  // Left between two stops (dragging the scrollbar, say): it plays on to the next one
  const onScrollEnd = () => {
    if (move || isFree() || !inside(window.scrollY)) return;
    const p = pin.progress;
    if (list().some((q) => Math.abs(q - p) < EPS)) return;
    step(lastDir);
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, { passive: true });
  ScrollTrigger.addEventListener('scrollEnd', onScrollEnd);
  return () => {
    move?.kill();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
    ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
  };
}
