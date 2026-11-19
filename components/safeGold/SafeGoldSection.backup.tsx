'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createPlayhead } from '../playhead';
import { GOLD, PORTFOLIO, SALE, SCENES, type GoldFrame, type Room, type ScreenPoint } from './goldData';
import type { GoldScene } from './goldScene';

gsap.registerPlugin(ScrollTrigger);

const HIDDEN = { visibility: 'hidden' } as const;
const CARD_BG = 'bg-[#111111]';
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const RATE = PORTFOLIO.value / PORTFOLIO.grams;

// The four steps: shown in the phone's side panel during the story, and as the tiles at the end
const STEPS_INFO = [
  { label: 'Buy 24K gold', body: 'Start small, one purchase at a time.', scene: SCENES[1] },
  { label: 'Track your holdings', body: 'Your grams and their value, in one place.', scene: SCENES[2] },
  { label: 'Get it delivered', body: 'Withdraw eligible gold as coins or bars.', scene: SCENES[4] },
  { label: 'Sell anytime', body: 'Sell eligible gold and receive the proceeds.', scene: SCENES[5] },
];

// Everything the timeline moves. Plain numbers, so GSAP can tween them and the scene can read them.
function createState(narrow: boolean) {
  return {
    cam: { z: 10.8, y: 0.6 },
    pig: { sx: 0.5, sy: narrow ? 0.5 : 0.56, z: 0, scale: 1.2, rotY: -1.18, value: 0.55 },
    sheen: { v: -1 },
    appears: DEPOSITS.map(() => ({ t: 0 })),
    deposits: DEPOSITS.map(() => ({ t: 0 })),
    returns: DEPOSITS.map(() => ({ t: 0 })),
    emerge: { t: 0 },
    withdraw: { coin: 0, morph: 0, pack: 0, drop: 0, lid: 0, away: 0 },
    sell: { coin: 0, burst: 0, fade: 0 },
    // Grams bought (as a share of the portfolio), and grams withdrawn and sold since
    count: { v: 0 },
    out: { w: 0, s: 0 },
  };
}
type GoldState = ReturnType<typeof createState>;

// Each of the six circling coins drops into the slot in turn: the first on its own as the purchase,
// the rest as the gold builds up (timeline units)
const DEPOSITS = [
  { at: 2.6, dur: 1.4 },
  { at: 5.4, dur: 0.95 },
  { at: 5.65, dur: 0.95 },
  { at: 5.9, dur: 0.95 },
  { at: 6.15, dur: 0.95 },
  { at: 6.4, dur: 0.95 },
];
const LANDINGS = DEPOSITS.map((d) => d.at + d.dur * 0.93);
const WITHDRAWN_G = 0.5;
const SOLD_G = 1;

// Where each scroll comes to rest: the phone lifted and the first purchase made; the gold grown;
// the withdrawal on its way; the sale credited; then the closing tiles
const STOPS = [5.0, 9.0, 13.6, 17.0];
const SCROLL_PER_BEAT = 220;
const PACE = {
  watchingSpeed: 1 / 0.45,
  paceAt: (time: number) => (time >= STOPS[1] ? 0.85 : 1),
};

function buildTimeline(root: HTMLElement, S: GoldState, narrow: boolean) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const one = (k: string) => root.querySelector<HTMLElement>(`[data-g="${k}"]`)!;
  const all = (k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-g="${k}"]`));

  const device = one('device');
  const hands = all('hand');
  const intro = one('intro');
  // On phones the zoomed-in phone reaches the top, so the title steps aside while it's up
  const logo = one('logo');
  const closing = one('closing');
  const hudItems = all('hud-item');
  const panel = one('panel');
  const list = one('tip-list');
  const tips = all('tip');
  const rings = all('tip-ring');
  const tiles = all('tile');

  // ---- The opening frame: the phone, small, held in two hands under the headline ----
  const stage = root.clientHeight;
  const introBottom = intro.offsetTop + intro.offsetHeight;
  const phoneH = device.offsetHeight;
  const startScale = Math.min(narrow ? 0.62 : 0.6, (stage * 0.94 - introBottom - 16) / phoneH);
  const startY = introBottom + 16 + (phoneH * startScale) / 2 - stage / 2;
  gsap.set(device, { xPercent: -50, yPercent: -50, scale: startScale, y: startY, autoAlpha: 1 });
  gsap.set(hands, { y: 0, autoAlpha: 1 });
  gsap.set([intro, logo], { autoAlpha: 1, y: 0 });
  gsap.set(closing, { autoAlpha: 0, y: 16 });
  gsap.set(hudItems, { autoAlpha: 0, y: -8 });
  gsap.set(panel, narrow ? { yPercent: 115, xPercent: 0 } : { xPercent: 115, yPercent: 0 });
  gsap.set(rings, { autoAlpha: 0 });
  gsap.set(tips, { autoAlpha: 0.55 });
  gsap.set(tiles, { autoAlpha: 0, y: 60 });

  // How far the panel's list moves so the step being shown sits in view
  const viewport = list.parentElement!;
  const shiftFor = (i: number) => {
    const card = tips[i];
    if (narrow) {
      const max = Math.max(0, list.scrollWidth - viewport.clientWidth);
      return { x: -Math.min(max, Math.max(0, card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2)), y: 0 };
    }
    const max = Math.max(0, list.scrollHeight - viewport.clientHeight);
    return { x: 0, y: -Math.min(max, Math.max(0, card.offsetTop - (viewport.clientHeight - card.offsetHeight) / 2)) };
  };
  // A step lights up: its card in the panel
  const step = (i: number, at: number) => {
    if (i > 0) {
      tl.to(rings[i - 1], { autoAlpha: 0, duration: 0.3 }, at);
    }
    tl.to(list, { ...shiftFor(i), duration: 0.7, ease: 'power2.inOut' }, at);
    tl.to(tips[i], { autoAlpha: 1, duration: 0.4 }, at + 0.15);
    tl.to(rings[i], { autoAlpha: 1, duration: 0.4 }, at + 0.15);
  };
  const pigX = (sx: number, at: number) => {
    if (narrow) tl.to(S.pig, { sx, duration: 1, ease: 'power2.inOut' }, at);
  };

  // ============ Lift: the hands let go, the phone comes up to fill the view ============
  tl.to(intro, { autoAlpha: 0, y: -40, duration: 0.8, ease: 'power2.in' }, 0.1);
  if (narrow) tl.to(logo, { autoAlpha: 0, duration: 0.5 }, 0.3);
  tl.to(hands, { y: '45%', autoAlpha: 0, duration: 1.1, ease: 'power2.in' }, 0.2);
  tl.to(device, { scale: 1, y: 0, duration: 1.8, ease: 'power2.inOut' }, 0.2);
  tl.to(hudItems, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }, 1.3);
  S.appears.forEach((a, i) => tl.to(a, { t: 1, duration: 0.8 }, 0.4 + i * 0.15));
  tl.to(S.pig, { rotY: -0.55, duration: 2.5, ease: 'power1.inOut' }, 0.4);
  tl.to(S.cam, { z: 8.4, y: 0.75, duration: 1.8, ease: 'power2.inOut' }, 0.4);
  tl.to(S.sheen, { v: 1, duration: 1.6, ease: 'power1.inOut' }, 1.0);
  // The step panel slides in, and the message rises in at the bottom
  tl.to(panel, { xPercent: 0, yPercent: 0, duration: 0.9, ease: 'power3.out' }, 1.8);

  // ============ Step 1. Buy: the first coin drops into the slot ============
  step(0, 2.2);
  tl.to(S.deposits[0], { t: 1, duration: DEPOSITS[0].dur }, DEPOSITS[0].at);
  tl.to(S.count, { v: 0.2, duration: 0.8, ease: 'power2.out' }, LANDINGS[0]);

  // ============ Step 2. Grow: the rest go in as the holdings count up ============
  step(1, 5.0);
  DEPOSITS.slice(1).forEach((d, i) => tl.to(S.deposits[i + 1], { t: 1, duration: d.dur }, d.at));
  tl.to(S.pig, { value: 1, duration: 2.8, ease: 'power1.inOut' }, 5.1);
  tl.to(S.sheen, { v: -1, duration: 1.4, ease: 'power1.inOut' }, 6.4);
  tl.to(S.count, { v: 1, duration: 2.4, ease: 'power1.inOut' }, 5.8);

  // ============ Step 3. Withdraw: a coin comes out of the card, turns into a bar, is boxed and sent ============
  step(2, 9.0);
  tl.to(S.cam, { z: 9.8, y: 0.7, duration: 0.8, ease: 'power2.inOut' }, 9.0);
  tl.to(S.pig, { rotY: -1.0, duration: 0.8, ease: 'power2.inOut' }, 9.0);
  pigX(0.26, 9.0);
  tl.to(S.emerge, { t: 1, duration: 1.2 }, 9.1);
  tl.to(S.withdraw, { coin: 1, duration: 0.7 }, 10.4);
  tl.to(S.out, { w: 1, duration: 0.6, ease: 'power1.inOut' }, 10.4);
  tl.to(S.withdraw, { morph: 1, duration: 0.6, ease: 'power1.inOut' }, 11.0);
  tl.to(S.withdraw, { pack: 1, duration: 0.4 }, 11.4);
  tl.to(S.withdraw, { drop: 1, duration: 0.4 }, 11.7);
  tl.to(S.withdraw, { lid: 1, duration: 0.3 }, 12.05);
  tl.to(S.withdraw, { away: 1, duration: 0.7, ease: 'power1.in' }, 12.7);

  // ============ Step 4. Sell: a coin streams into a ₹ ============
  step(3, 13.6);
  tl.to(S.sell, { coin: 1, duration: 0.7 }, 13.9);
  tl.to(S.out, { s: 1, duration: 0.6, ease: 'power1.inOut' }, 13.9);
  tl.to(S.sell, { burst: 1, duration: 0.9 }, 14.5);
  tl.to(S.sell, { fade: 1, duration: 0.4 }, 15.9);

  // ============ The close: the coins return to orbit, the phone steps back, the four tiles rise ============
  tl.to(rings[3], { autoAlpha: 0, duration: 0.3 }, 17.0);
  pigX(0.5, 17.0);
  tl.to(S.pig, { rotY: -1.18, duration: 1.2, ease: 'power2.inOut' }, 17.0);
  tl.to(S.cam, { z: 10.8, y: 0.6, duration: 1.4, ease: 'power2.inOut' }, 17.0);
  S.returns.forEach((r, i) => tl.to(r, { t: 1, duration: 0.9 }, 17.1 + i * 0.12));
  tl.to(device, { scale: startScale * 0.8, y: startY + stage * 0.15, autoAlpha: 0, duration: 1.2, ease: 'power2.in' }, 18.0);
  if (narrow) tl.to(logo, { autoAlpha: 1, duration: 0.5 }, 18.6);
  tl.to(closing, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 18.7);
  tl.to(tiles, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' }, 18.9);
  tl.to({}, { duration: 0.01 }, 20.3);

  // The holdings readout at the top of the screen
  const grams = one('hud-grams');
  const value = one('hud-value');
  const sync = () => {
    const g = Math.max(0, PORTFOLIO.grams * S.count.v - WITHDRAWN_G * S.out.w - SOLD_G * S.out.s);
    grams.textContent = `${g.toFixed(3)} g`;
    value.textContent = inr(g * RATE);
  };
  sync();
  tl.eventCallback('onUpdate', sync);
  return tl;
}

// The title rises in, letter by letter, once, as the section arrives
function playLogoIntro(root: HTMLElement) {
  const q = (k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-g="${k}"]`));
  gsap.set(q('g-letter'), { yPercent: 110, autoAlpha: 0 });
  gsap.set(q('g-shine'), { xPercent: -120 });
  return gsap
    .timeline({ paused: true })
    .to(q('g-letter'), { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power4.out', stagger: 0.05 })
    .to(q('g-shine'), { xPercent: 120, duration: 1.2, ease: 'power2.inOut' }, '-=0.25');
}

export default function SafeGoldSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GoldState>(createState(false));
  const timeRef = useRef(0);
  const narrowRef = useRef(false);

  // The scroll story: pinned, and played by scrolling, forwards and backwards
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let context: gsap.Context | null = null;
      let playhead: ReturnType<typeof createPlayhead> | null = null;
      let pin: ScrollTrigger | null = null;
      let story: gsap.core.Timeline | null = null;
      let toStory: (progress: number) => number = (p) => p;
      let beatCount = 1;

      const build = () => {
        const place = pin?.progress ?? 0;
        toStory = (progress: number) => progress;
        const wasPinned = !!pin && window.scrollY >= pin.start;
        playhead?.kill();
        context?.revert();
        // Below md the phone stands upright and the step panel sits along its bottom (matches the md: classes)
        narrowRef.current = window.innerWidth < 768;
        const state = createState(narrowRef.current);
        stateRef.current = state;
        context = gsap.context(() => {
          const tl = buildTimeline(section, state, narrowRef.current);
          const intro = playLogoIntro(section);
          ScrollTrigger.create({ trigger: section, start: 'top 75%', once: true, onEnter: () => intro.play() });
          const onUpdate = tl.eventCallback('onUpdate') as () => void;
          tl.eventCallback('onUpdate', () => {
            onUpdate();
            timeRef.current = tl.time();
          });
          story = tl;
          playhead = createPlayhead(tl, PACE);
          // Scroll is split evenly between the beats; within a beat it maps onto that beat's stretch
          const marks = [0, ...STOPS, tl.duration()];
          const beats = marks.length - 1;
          beatCount = beats;
          toStory = (progress: number) => {
            const at = Math.min(Math.max(progress, 0), 1) * beats;
            const k = Math.min(Math.floor(at), beats - 1);
            return (marks[k] + (marks[k + 1] - marks[k]) * (at - k)) / tl.duration();
          };
          pin = ScrollTrigger.create({
            trigger: section,
            start: 'top 72px',
            end: `+=${beats * SCROLL_PER_BEAT}`,
            pin: true,
            anticipatePin: 1,
            refreshPriority: 2,
            onUpdate: (self) => playhead?.follow(toStory(self.progress)),
            snap: {
              snapTo: marks.map((_, k) => k / beats),
              directional: true,
              delay: 0.05,
              duration: { min: 0.25, max: 0.6 },
              ease: 'power1.inOut',
              inertia: false,
            },
          });
        }, section);
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        if (pin && wasPinned) {
          window.scrollTo({ top: pin.start + (pin.end - pin.start) * place, behavior: 'instant' });
          playhead?.jump(toStory(place));
        }
      };
      build();

      const onRevealPartner = () => {
        if (story && toStory) {
          story.progress(1);
          playhead?.jump(toStory(1));
        }
      };
      window.addEventListener('reveal-partner', onRevealPartner);

      // While a beat is still playing, the page holds still: wheel, touch and keyboard scrolling are
      // ignored until the animation has caught up with the scroll, so every beat is seen in full
      const playing = () => {
        if (!pin || !story) return false;
        const y = window.scrollY;
        if (y < pin.start - 1 || y > pin.end + 1) return false;
        return Math.abs(story.time() - toStory(pin.progress) * story.duration()) > 0.02;
      };
      // Inside the story each gesture (a wheel flick, a swipe, a key) moves exactly one beat, and only
      // once the beat before it has finished. A flick from outside stops at the story's edge.
      const ARRIVAL_QUIET_MS = 400;
      let arrivedAt = 0;
      const markY = (k: number) => (pin ? Math.round(pin.start + ((pin.end - pin.start) * k) / beatCount) : 0);
      const gate = (e: Event, delta: number, mayStep: boolean) => {
        if (!pin || !story || delta === 0) return false;
        const y = window.scrollY;
        const dir = Math.sign(delta);
        const prevent = () => e.cancelable && e.preventDefault();
        if (y < pin.start - 1 || y > pin.end + 1) {
          if (dir > 0 && y < pin.start - 1 && y + delta > pin.start) {
            prevent();
            window.scrollTo({ top: pin.start, behavior: 'instant' });
            arrivedAt = performance.now();
          } else if (dir < 0 && y > pin.end + 1 && y + delta < pin.end) {
            prevent();
            window.scrollTo({ top: pin.end, behavior: 'instant' });
            arrivedAt = performance.now();
          }
          return false;
        }
        const busy = playing();
        if (!busy && ((dir > 0 && y >= pin.end - 1) || (dir < 0 && y <= pin.start + 1))) return false;
        prevent();
        if (busy || !mayStep || performance.now() - arrivedAt < ARRIVAL_QUIET_MS) return false;
        const at = pin.progress * beatCount;
        const k = dir > 0 ? Math.floor(at + 0.01) + 1 : Math.ceil(at - 0.01) - 1;
        window.scrollTo({ top: markY(Math.min(Math.max(k, 0), beatCount)), behavior: 'instant' });
        return true;
      };
      const LINE_PX = 16;
      const onWheel = (e: WheelEvent) => {
        const scale = e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? window.innerHeight : 1;
        if (performance.now() - arrivedAt < ARRIVAL_QUIET_MS) arrivedAt = performance.now();
        gate(e, e.deltaY * scale, true);
      };
      const SWIPE_PX = 24;
      let touchY = 0;
      let swiped = false;
      const onTouchStart = (e: TouchEvent) => {
        touchY = e.touches[0]?.clientY ?? 0;
        swiped = false;
      };
      const onTouchMove = (e: TouchEvent) => {
        const delta = touchY - (e.touches[0]?.clientY ?? touchY);
        if (gate(e, delta, !swiped && Math.abs(delta) > SWIPE_PX)) swiped = true;
      };
      const KEY_DIR: Record<string, number> = { ' ': 1, PageDown: 1, ArrowDown: 1, End: 1, PageUp: -1, ArrowUp: -1, Home: -1 };
      const onKey = (e: KeyboardEvent) => {
        const el = e.target as HTMLElement | null;
        if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
        const dir = e.key === ' ' && e.shiftKey ? -1 : KEY_DIR[e.key];
        if (!dir || !pin) return;
        const y = window.scrollY;
        if (y < pin.start - 1 || y > pin.end + 1) return;
        gate(e, dir, true);
      };
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('keydown', onKey);

      let lastWidth = window.innerWidth;
      let lastHeight = window.innerHeight;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onResize = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 120) return;
          lastWidth = window.innerWidth;
          lastHeight = window.innerHeight;
          build();
        }, 250);
      };
      window.addEventListener('resize', onResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('reveal-partner', onRevealPartner);
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('keydown', onKey);
        playhead?.kill();
        context?.revert();
      };
    });
    return () => mm.revert();
  }, []);

  // The 3D scene draws inside the phone's screen. It loads only as the section comes near, and
  // draws only while it is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let scene: GoldScene | null = null;
    let visible = false;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    // Wall-clock seconds, so the piggy bank and its coins keep floating once the story has stopped
    let drift = 0;

    const q = (k: string) => section.querySelector<HTMLElement>(`[data-g="${k}"]`);
    const tips = () => Array.from(section.querySelectorAll<HTMLElement>('[data-g="tip"]'));

    const tick = (_time: number, deltaMs: number) => {
      drift += Math.min(deltaMs, 100) / 1000;
      if (!scene || !visible) return;
      const S = stateRef.current;
      const narrow = narrowRef.current;
      // The phone is scaled as it zooms; the scene works in the canvas's own (unscaled) pixels
      const origin = canvas.getBoundingClientRect();
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const k = origin.width / Math.max(1, W) || 1;
      const local = (el: Element | null | undefined) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: (r.left - origin.left) / k, right: (r.right - origin.left) / k, top: (r.top - origin.top) / k, bottom: (r.bottom - origin.top) / k };
      };
      const center = (el: Element | null | undefined): ScreenPoint => {
        const r = local(el);
        return r ? { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 } : { x: W / 2, y: H / 2 };
      };

      // The part of the screen no readout, message or panel covers
      const gap = 10;
      const hud = local(q('hud'));
      const panel = local(q('panel'));
      const room: Room = {
        left: gap,
        top: (hud?.bottom ?? 0) + gap,
        right: W - gap,
        bottom: H - gap,
      };
      if (panel) {
        if (narrow) room.bottom = Math.min(room.bottom, panel.top - gap);
        else room.right = Math.min(room.right, panel.left - gap);
      }
      // Where the withdraw box sits and the ₹ appears: to the right of the piggy bank
      const benchX = narrow ? W * 0.76 : room.right - Math.min(150, (room.right - room.left) * 0.16);
      const benchY = narrow ? room.bottom - 60 : (room.top + room.bottom) / 2 + 30;
      const cards = tips();
      const frame: GoldFrame = {
        time: timeRef.current,
        drift,
        room: [room],
        keepLeftOfBench: !narrow,
        appears: S.appears.map((a) => a.t),
        cam: S.cam,
        pig: S.pig,
        sheen: S.sheen.v,
        deposits: S.deposits.map((d) => d.t),
        returns: S.returns.map((r) => r.t),
        landings: LANDINGS,
        emerge: S.emerge.t,
        withdraw: S.withdraw,
        sell: S.sell,
        anchors: {
          // The coin rising out of the piggy bank goes up into the holdings readout
          portfolio: center(q('hud-grams')),
          // The withdraw and sell coins come out of their cards in the panel
          withdraw: center(cards[2]),
          sell: center(cards[3]),
          bench: { x: benchX, y: benchY },
          rupee: { x: benchX, y: benchY - (narrow ? 50 : 15) },
        },
      };
      scene.render(frame);
    };

    const load = () => {
      import('./goldScene')
        .then(({ GoldScene }) => {
          if (cancelled) return;
          try {
            scene = new GoldScene(canvas);
          } catch (error) {
            console.warn('SafeGold scene unavailable:', error);
            return;
          }
          resizeObserver = new ResizeObserver(() => scene?.resize(canvas.clientWidth, canvas.clientHeight));
          resizeObserver.observe(canvas);
          scene.resize(canvas.clientWidth, canvas.clientHeight);
          gsap.ticker.add(tick);
        })
        .catch((error) => console.warn('SafeGold scene failed to load:', error));
    };

    const near = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          near.disconnect();
          load();
        }
      },
      { rootMargin: '150% 0px' }
    );
    near.observe(section);
    const onScreen = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    onScreen.observe(section);

    return () => {
      cancelled = true;
      near.disconnect();
      onScreen.disconnect();
      resizeObserver?.disconnect();
      gsap.ticker.remove(tick);
      scene?.dispose();
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        data-safegold
        aria-label="Digital Gold"
        className="relative w-full h-[calc(100svh-72px)] overflow-hidden select-none motion-reduce:hidden"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 70%, #15100a 0%, #0c0a07 45%, rgba(0,0,0,0) 100%)' }}
      >
        {/* The headline: the opening one over the phone, and the closing one over the tiles */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center px-4 pt-6 sm:pt-8 text-center">
          <div data-g="logo" className="relative overflow-hidden">
            <SafeGoldLogo className="text-[14px] sm:text-[16px] lg:text-[18px]" />
            <span data-g="g-shine" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#FFE9A3]/40 to-transparent mix-blend-overlay" />
          </div>
          <div className="grid w-full max-w-3xl">
            <div data-g="intro" className="[grid-area:1/1] pt-3">
              <h2 className="text-[26px] xs:text-[30px] sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08] text-[#F5F5F5]">
                {SCENES[0].title}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-xs xs:text-sm sm:text-base tracking-tight text-[#A3A3A3]">{SCENES[0].body}</p>
            </div>
            <div data-g="closing" style={HIDDEN} className="[grid-area:1/1] pt-3">
              <h2 className="text-[24px] xs:text-[28px] sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.08] text-[#F5F5F5]">
                Start small. Build something <span className="text-[#F5D76E]">golden.</span>
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-xs xs:text-sm sm:text-base tracking-tight text-[#A3A3A3]">{SCENES[6].body}</p>
            </div>
          </div>
        </div>

        {/* The closing tiles, one per step */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-4 pb-5 sm:pb-8">
          <div className="grid w-full max-w-6xl grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:items-start">
            {STEPS_INFO.map((s, i) => (
              <div key={s.label} data-g="tile" style={HIDDEN}>
                <div className={`relative aspect-[5/4] lg:aspect-[1/1] overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.6)] ${CARD_BG}`}>
                  <FeatureArt step={i} className="absolute inset-0 h-full w-full" />
                </div>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base font-medium tracking-tight text-[#F5F5F5]">{s.label}</p>
                <p className="mt-0.5 text-[11px] sm:text-[13px] leading-snug text-[#A3A3A3]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* The phone: held in two hands at first, then lifted to fill the view. Upright on phones,
            on its side from md up. Sized here at its full (zoomed-in) size; the timeline scales it. */}
        <div
          data-g="device"
          style={HIDDEN}
          className="absolute left-1/2 top-1/2 z-10 w-[min(92vw,calc((100svh-100px)*0.468))] aspect-[9/19.2] md:w-[min(94vw,calc((100svh-104px)*2.06))] md:aspect-[2.06/1]"
        >
          {/* The hands, behind the phone: palms and wrists below its corners */}
          <div data-g="hand" className="pointer-events-none absolute z-0 bottom-[-30%] left-[-14%] h-[62%] md:bottom-[-74%] md:left-[2%] md:h-[150%]">
            <Image src="/assets/images/human_hand_clean.png" alt="" width={1173} height={2655} sizes="(min-width: 768px) 560px, 360px" className="h-full w-auto rotate-[14deg] md:rotate-[-4deg]" />
          </div>
          <div data-g="hand" className="pointer-events-none absolute z-0 hidden md:block md:bottom-[-74%] md:right-[2%] md:h-[150%]">
            <Image src="/assets/images/human_hand_clean.png" alt="" width={1173} height={2655} sizes="(min-width: 768px) 560px, 360px" className="h-full w-auto -scale-x-100 rotate-[4deg]" />
          </div>

          {/* The body: a metal edge around a black bezel */}
          <div className="absolute inset-0 z-10 rounded-[2.6rem] md:rounded-[3.2rem] bg-[linear-gradient(145deg,#4a4a4a,#151515_30%,#0d0d0d_60%,#3d3d3d)] p-[2px] shadow-[0_40px_90px_rgba(0,0,0,0.75)]">
            <div className="relative h-full w-full rounded-[2.5rem] md:rounded-[3.1rem] bg-[#050505] p-[9px] md:p-[13px]">
              {/* Buttons on the frame */}
              <span className="absolute hidden md:block -top-[4px] left-[16%] h-[3px] w-[6%] rounded-t bg-[#2c2c2c]" />
              <span className="absolute hidden md:block -top-[4px] left-[24%] h-[3px] w-[6%] rounded-t bg-[#2c2c2c]" />
              <span className="absolute md:hidden -right-[4px] top-[22%] h-[9%] w-[3px] rounded-r bg-[#2c2c2c]" />

              {/* The screen */}
              <div
                className="relative h-full w-full overflow-hidden rounded-[2.1rem] md:rounded-[2.5rem]"
                style={{ background: 'radial-gradient(ellipse 70% 75% at 42% 58%, #131110 0%, #0b0a09 55%, #070707 100%)' }}
              >
                <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />


                {/* The readouts across the top */}
                <div
                  data-g="hud"
                  className="absolute z-20 inset-x-0 top-0 flex flex-wrap items-start justify-center gap-x-5 gap-y-2 px-4 pt-[12%] md:flex-nowrap md:justify-start md:gap-x-[3.2%] md:pl-[6%] md:pr-[28%] md:pt-[2.6%]"
                >
                  <HudItem label="Karat" value="24K" />
                  <HudItem label="Purity" value="99.9%" />
                  <div data-g="hud-item" style={HIDDEN} className="order-first w-full text-center md:order-none md:w-auto md:px-[2%]">
                    <p data-g="hud-grams" className="text-[22px] md:text-[clamp(18px,2.1vw,30px)] font-semibold leading-none tracking-tight text-[#F5F5F5] tabular-nums">0.000 g</p>
                    <p className="mt-1 text-[8px] md:text-[9px] uppercase tracking-[0.18em] text-[#A3A3A3]/70">Illustrative, not live</p>
                  </div>
                  <HudItem label="Rate" value={`${inr(RATE)}/g`} />
                  <div data-g="hud-item" style={HIDDEN}>
                    <p className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.16em] text-[#A3A3A3]">Value</p>
                    <p data-g="hud-value" className="mt-0.5 text-[12px] md:text-[clamp(11px,1.05vw,15px)] font-semibold text-[#F5D76E] tabular-nums">₹0</p>
                  </div>
                </div>

                {/* The steps, sliding in from the side (from the bottom on phones) */}
                <div
                  data-g="panel"
                  className="absolute z-20 inset-x-2 bottom-2 h-[30%] rounded-[1.4rem] bg-black/75 p-2.5 backdrop-blur-md md:inset-x-auto md:right-[1.2%] md:top-[2.5%] md:bottom-[2.5%] md:h-auto md:w-[25%] md:rounded-[1.8rem] md:p-[1.1%]"
                >
                  <div className="flex h-full flex-col">
                    <p className="flex items-center gap-2 px-1 pb-2 text-[11px] md:text-[clamp(11px,1vw,14px)] font-medium leading-tight text-[#F5F5F5]">
                      <Sparkle className="h-4 w-4 shrink-0" />
                      Your gold, step by step
                    </p>
                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
                      <div data-g="tip-list" className="flex h-full gap-2 md:h-auto md:flex-col md:gap-[0.7vw]">
                        {STEPS_INFO.map((s, i) => (
                          <div
                            key={s.label}
                            data-g="tip"
                            className={`relative h-full w-[46%] shrink-0 overflow-hidden rounded-xl shadow-[0_10px_24px_rgba(0,0,0,0.55)] md:h-auto md:w-full md:aspect-[16/10] ${CARD_BG}`}
                          >
                            <FeatureArt step={i} className="absolute inset-x-0 top-0 h-[76%] w-full" />
                            <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-2 md:p-[6%]">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/70 text-[9px] font-semibold text-[#F5D76E]">{i + 1}</span>
                              <span className="text-[10.5px] md:text-[clamp(10px,0.95vw,14px)] font-semibold leading-tight text-[#F5F5F5]">{s.label}</span>
                            </div>
                            <span data-g="tip-ring" style={HIDDEN} className="pointer-events-none absolute inset-0 rounded-xl border-[1.5px] border-[#F5D76E]/85" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Without motion, the journey is simply listed */}
      <div className="hidden motion-reduce:block w-full max-w-4xl mx-auto mt-16 px-4">
        <p className="text-sm font-medium text-[#D4AF37]">Digital Gold</p>
        <ol className="mt-4 grid gap-6 sm:grid-cols-2">
          {SCENES.map((scene) => (
            <li key={scene.title}>
              <h3 className="text-xl font-semibold text-[#F5F5F5] tracking-tight">{scene.title}</h3>
              <p className="text-sm text-[#A3A3A3] tracking-tight mt-1">{scene.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-[#A3A3A3]/70">
          Illustrative values, not live prices. Example sale: {SALE.grams} for {SALE.value}.
        </p>
      </div>
    </>
  );
}

// Each step shown with its own flat element: amount chips, growing bars, a delivery timeline, a payout receipt
function FeatureArt({ step, className = '' }: { step: number; className?: string }) {
  const G = '#D4AF37';
  const LIGHT = '#F5D76E';
  const MUTED = '#A3A3A3';
  const LINE = '#2a2a2a';
  const chip = (x: number, y: number, w: number, text: string, on = false) => (
    <g key={text}>
      <rect x={x} y={y} width={w} height="15" rx="7.5" fill={on ? G : 'none'} stroke={on ? G : '#3a3a3a'} strokeWidth="0.8" />
      <text x={x + w / 2} y={y + 10.2} textAnchor="middle" fontSize="7" fontWeight="600" fill={on ? '#120d02' : MUTED}>{text}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" className={className} aria-hidden="true">
      {step === 0 && (
        <g>
          {/* Pick an amount */}
          <text x="80" y="26" textAnchor="middle" fontSize="7" fill={MUTED}>Amount</text>
          <text x="80" y="47" textAnchor="middle" fontSize="18" fontWeight="700" fill="#F5F5F5">₹500</text>
          <path d="M52 55 H108" stroke={LINE} strokeWidth="1" />
          {chip(26, 64, 34, '₹100')}
          {chip(63, 64, 34, '₹500', true)}
          {chip(100, 64, 34, '₹1000')}
          <text x="80" y="95" textAnchor="middle" fontSize="7" fill={LIGHT}>≈ 0.075 g of 24K gold</text>
        </g>
      )}
      {step === 1 && (
        <g>
          {/* Holdings building up, month by month */}
          <text x="20" y="24" fontSize="7" fill={MUTED}>Your gold</text>
          <text x="20" y="39" fontSize="13" fontWeight="700" fill="#F5F5F5">5.250 g</text>
          {[14, 20, 26, 33, 40, 48].map((h, i) => (
            <rect key={i} x={22 + i * 20} y={92 - h} width="12" height={h} rx="2" fill={i === 5 ? G : '#3a3a3a'} />
          ))}
          <path d="M18 92.5 H142" stroke={LINE} strokeWidth="1" />
        </g>
      )}
      {step === 2 && (
        <g>
          {/* Order to doorstep */}
          <path d="M28 46 H132" stroke={LINE} strokeWidth="2" />
          <path d="M28 46 H97" stroke={G} strokeWidth="2" />
          {['Ordered', 'Packed', 'Shipped', 'Delivered'].map((label, i) => {
            const x = 28 + i * 34.67;
            const done = i < 3;
            return (
              <g key={label}>
                <circle cx={x} cy="46" r="5" fill={done ? G : '#111111'} stroke={done ? G : '#3a3a3a'} strokeWidth="1.2" />
                {done && <path d={`M${x - 2.2} 46.2l1.5 1.5 2.9-3.1`} fill="none" stroke="#120d02" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />}
                <text x={x} y="64" textAnchor="middle" fontSize="6.5" fill={done ? '#F5F5F5' : MUTED}>{label}</text>
              </g>
            );
          })}
          <text x="80" y="88" textAnchor="middle" fontSize="7" fill={LIGHT}>1 g coin · insured delivery</text>
        </g>
      )}
      {step === 3 && (
        <g>
          {/* Choose how much to sell, and see what you get */}
          <text x="80" y="26" textAnchor="middle" fontSize="7" fill={MUTED}>You get</text>
          <text x="80" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="#F5F5F5">₹6,650</text>
          <rect x="24" y="61" width="112" height="4" rx="2" fill="#3a3a3a" />
          <rect x="24" y="61" width="42" height="4" rx="2" fill={G} />
          <circle cx="66" cy="63" r="6" fill="#F5F5F5" stroke={G} strokeWidth="1.5" />
          <text x="24" y="80" fontSize="6.5" fill={MUTED}>0 g</text>
          <text x="66" y="80" textAnchor="middle" fontSize="6.5" fontWeight="600" fill={LIGHT}>1.000 g</text>
          <text x="136" y="80" textAnchor="end" fontSize="6.5" fill={MUTED}>5.250 g</text>
        </g>
      )}
    </svg>
  );
}

function HudItem({ label, value }: { label: string; value: string }) {
  return (
    <div data-g="hud-item" style={HIDDEN}>
      <p className="text-[8px] md:text-[10px] font-medium uppercase tracking-[0.16em] text-[#A3A3A3]">{label}</p>
      <p className="mt-0.5 text-[12px] md:text-[clamp(11px,1.05vw,15px)] font-semibold text-[#F5F5F5] tabular-nums">{value}</p>
    </div>
  );
}

// A four-point spark, in gold
function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M10 2.5c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7z" fill={GOLD.champagne} />
      <path d="M18.5 13.5c.3 2.1 1.3 3.1 3.4 3.4-2.1.3-3.1 1.3-3.4 3.4-.3-2.1-1.3-3.1-3.4-3.4 2.1-.3 3.1-1.3 3.4-3.4z" fill={GOLD.primary} />
    </svg>
  );
}

// The section's title in gold, set letter by letter so it can rise in
function SafeGoldLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center font-bold leading-none tracking-[0.3em] text-[#D4AF37] ${className}`} aria-label="Digital Gold" role="img">
      <span className="flex" aria-hidden="true">
        {'DIGITAL GOLD'.split('').map((letter, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
            <span data-g="g-letter" className="inline-block">
              {letter === ' ' ? ' ' : letter}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
