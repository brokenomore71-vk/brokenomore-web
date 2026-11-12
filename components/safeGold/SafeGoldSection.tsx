'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createPlayhead } from '../journey';
import { CHART, GOLD, PORTFOLIO, SALE, SCENES, type GoldFrame, type ScreenPoint } from './goldData';
import type { GoldScene } from './goldScene';

gsap.registerPlugin(ScrollTrigger);

const HIDDEN = { visibility: 'hidden' } as const;
const CARD =
  'rounded-2xl border border-[#D4AF37]/30 bg-[#0b0a08]/90 p-4 md:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl';
const METAL = 'bg-[linear-gradient(120deg,#8C6B20_0%,#D4AF37_28%,#FFE9A3_50%,#D4AF37_72%,#8C6B20_100%)]';
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// The chart's line and the area under it, in a 260 × 64 box
const chartPoints = CHART.map((v, i) => [(i / (CHART.length - 1)) * 260, 60 - ((v - 10) / 26) * 54] as const);
const CHART_LINE = chartPoints.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const CHART_AREA = `${CHART_LINE} L260 64 L0 64 Z`;

// Everything the timeline moves. Plain numbers, so GSAP can tween them and the scene can read them.
// It starts with the piggy bank alone in the middle, facing you.
function createState(narrow: boolean) {
  return {
    cam: { z: 10.8, y: 0.6 },
    pig: { sx: 0.5, sy: narrow ? 0.5 : 0.58, z: 0, scale: 1, rotY: -1.18, value: 0.55 },
    sheen: { v: -1 },
    appears: DEPOSITS.map(() => ({ t: 0 })),
    deposits: DEPOSITS.map(() => ({ t: 0 })),
    returns: DEPOSITS.map(() => ({ t: 0 })),
    emerge: { t: 0 },
    withdraw: { coin: 0, morph: 0, pack: 0, drop: 0, lid: 0, away: 0 },
    sell: { coin: 0, burst: 0, fade: 0 },
    count: { v: 0 },
  };
}
type GoldState = ReturnType<typeof createState>;

// Each of the six circling coins drops into the slot in turn: the first on its own as the purchase,
// the rest as the gold builds up. When each one starts, and how long its trip lasts (timeline units).
const DEPOSITS = [
  { at: 0.9, dur: 1.4 },
  { at: 3.8, dur: 1.1 },
  { at: 4.15, dur: 1.1 },
  { at: 4.5, dur: 1.1 },
  { at: 4.85, dur: 1.1 },
  { at: 5.2, dur: 1.1 },
];
// The four steps, and where each one starts and ends on the timeline
export const STEPS = [
  { label: 'Buy', from: 0.4, to: 3.4 },
  { label: 'Grow', from: 3.6, to: 6.4 },
  { label: 'Withdraw', from: 6.5, to: 10.3 },
  { label: 'Sell', from: 10.5, to: 13 },
];
// Scroll distance per timeline unit: short, so one scroll carries the whole story
const SCROLL_PER_STEP_UNIT = 120;
// Whatever the scroll, the story plays at this pace: about ten seconds from first coin to last sale
const PACE = { watchingSpeed: 1 / 0.7, longestCatchUp: 10 };
// The moment each coin passes through the slot
// Before the story, the SafeGold logo flies from the middle up to the corner (timeline units)
const LOGO_UNITS = 1.2;
// When each coin passes through the slot: inside the story, and on the whole timeline
const STORY_LANDINGS = DEPOSITS.map((d) => d.at + d.dur * 0.93);
const LANDINGS = STORY_LANDINGS.map((t) => LOGO_UNITS + t);

function buildTimeline(root: HTMLElement, S: GoldState, narrow: boolean) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const one = (k: string) => root.querySelector<HTMLElement>(`[data-g="${k}"]`)!;
  const qa = (el: HTMLElement, k: string) => Array.from(el.querySelectorAll<HTMLElement>(`[data-g="${k}"]`));
  const captions = Array.from(root.querySelectorAll<HTMLElement>('[data-g="caption"]'));
  const closing = captions[captions.length - 1];
  const txn = one('txn');
  const dash = one('dash');
  const portfolio = one('portfolio');
  const withdrawCard = one('withdraw-card');
  const sold = one('sold');
  const fills = { withdraw: one('fill-withdraw'), sell: one('fill-sell') };
  const labels = { withdraw: one('label-withdraw'), sell: one('label-sell') };
  const cta = one('cta');
  const faint = narrow ? { autoAlpha: 0, scale: 0.92 } : { autoAlpha: 0.22, scale: 0.92 };

  // ---- The opening frame: just the piggy bank ----
  gsap.set(captions, { autoAlpha: 0, y: 18 });
  gsap.set(cta, { autoAlpha: 0, y: 12 });
  gsap.set([txn, dash, withdrawCard, sold], { autoAlpha: 0, y: 24 });
  gsap.set(portfolio, { autoAlpha: 0, scale: 0.92, clipPath: 'circle(75% at 50% 50%)' });
  gsap.set([fills.withdraw, fills.sell], { autoAlpha: 0 });
  gsap.set(one('check'), { strokeDashoffset: 1 });
  gsap.set(one('chart-line'), { strokeDashoffset: 1 });
  gsap.set(one('chart-area'), { autoAlpha: 0 });
  gsap.set(one('route'), { strokeDashoffset: 1 });
  gsap.set(one('sold-check'), { strokeDashoffset: 1 });

  const captionIn = (el: HTMLElement, at: number) => tl.to(el, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at);
  const captionOut = (el: HTMLElement, at: number) => tl.to(el, { autoAlpha: 0, y: -18, duration: 0.35, ease: 'power2.in' }, at);
  const cardIn = (el: HTMLElement, at: number) => tl.to(el, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, at);
  const cardOut = (el: HTMLElement, at: number) => tl.to(el, { autoAlpha: 0, y: -16, duration: 0.4, ease: 'power2.in' }, at);
  const press = (which: 'withdraw' | 'sell', on: number, off: number) => {
    tl.to(fills[which], { autoAlpha: 1, duration: 0.3 }, on);
    tl.to(labels[which], { color: '#120d02', duration: 0.3 }, on);
    tl.to(fills[which], { autoAlpha: 0, duration: 0.3 }, off);
    tl.to(labels[which], { color: GOLD.highlight, duration: 0.3 }, off);
  };
  // The piggy bank stays in the middle throughout. On phones it rides higher while cards are
  // showing beneath it.
  const pigY = (sy: number, at: number) => {
    if (narrow) tl.to(S.pig, { sy, duration: 1, ease: 'power2.inOut' }, at);
  };

  // The step bar: each step's line fills while that step plays
  qa(root, 'step-fill').forEach((fill, i) => {
    gsap.set(fill, { scaleX: 0 });
    tl.to(fill, { scaleX: 1, duration: STEPS[i].to - STEPS[i].from }, STEPS[i].from);
  });
  qa(root, 'step-label').forEach((label, i) => {
    gsap.set(label, { color: '#6b6b6b' });
    tl.to(label, { color: GOLD.champagne, duration: 0.2 }, STEPS[i].from);
    tl.to(label, { color: GOLD.muted, duration: 0.2 }, STEPS[i].to);
  });
  gsap.set(one('steps'), { autoAlpha: 0 });
  tl.to(one('steps'), { autoAlpha: 1, duration: 0.3 }, 0.3);
  tl.to(one('steps'), { autoAlpha: 0, duration: 0.3 }, 13.1);

  // ============ The coins come out from behind the piggy bank, one by one, into orbit ============
  S.appears.forEach((a, i) => tl.to(a, { t: 1, duration: 0.8 }, i * 0.18));
  tl.to(S.pig, { rotY: -0.55, duration: 2.5, ease: 'power1.inOut' }, 0.2);
  tl.to(S.cam, { z: 8.4, y: 0.75, duration: 1.8, ease: 'power2.inOut' }, 0.2);
  tl.to(S.sheen, { v: 1, duration: 1.6, ease: 'power1.inOut' }, 0.6);
  pigY(0.4, 1.2);

  // ============ Step 1. Buy: the first coin leaves its orbit for the slot ============
  captionIn(captions[1], 0.4);
  tl.to(S.deposits[0], { t: 1, duration: DEPOSITS[0].dur }, DEPOSITS[0].at);
  cardIn(txn, STORY_LANDINGS[0] + 0.05);
  tl.to(one('check'), { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, STORY_LANDINGS[0] + 0.2);
  cardOut(txn, 3.3);
  captionOut(captions[1], 3.3);

  // ============ Step 2. Grow: the rest follow, and the gold builds up ============
  captionIn(captions[2], 3.6);
  cardIn(dash, 3.7);
  DEPOSITS.slice(1).forEach((d, i) => tl.to(S.deposits[i + 1], { t: 1, duration: d.dur }, d.at));
  tl.to(S.pig, { value: 1, duration: 2.6, ease: 'power1.inOut' }, 3.7);
  tl.to(S.count, { v: 1, duration: 2.4, ease: 'power1.inOut' }, 3.9);
  tl.to(one('chart-line'), { strokeDashoffset: 0, duration: 2, ease: 'power1.inOut' }, 4);
  tl.to(one('chart-area'), { autoAlpha: 1, duration: 0.8 }, 5.5);
  tl.to(S.sheen, { v: -1, duration: 1.4, ease: 'power1.inOut' }, 5);
  cardOut(dash, 6.3);
  captionOut(captions[2], 6.3);

  // ============ Step 3. Withdraw: a coin rises into the portfolio, then out as a bar ============
  captionIn(captions[4], 6.7);
  tl.to(S.cam, { z: 9.8, y: 0.7, duration: 0.8, ease: 'power2.inOut' }, 6.5);
  tl.to(S.pig, { rotY: -1.0, duration: 0.8, ease: 'power2.inOut' }, 6.5);
  pigY(0.32, 6.5);
  tl.to(S.emerge, { t: 1, duration: 1.2 }, 6.5);
  tl.set(portfolio, { clipPath: 'circle(0% at 50% 50%)', scale: 1 }, 7.35);
  tl.to(portfolio, { autoAlpha: 1, duration: 0.01 }, 7.4);
  tl.to(portfolio, { clipPath: 'circle(75% at 50% 50%)', duration: 0.4, ease: 'power2.out' }, 7.4);
  press('withdraw', 7.8, 10.1);
  tl.to(S.withdraw, { coin: 1, duration: 0.7 }, 7.9);
  tl.to(portfolio, { autoAlpha: 0, duration: 0.3 }, 8.3);
  cardIn(withdrawCard, 8.4);
  tl.to(S.withdraw, { morph: 1, duration: 0.6, ease: 'power1.inOut' }, 8.5);
  tl.to(S.withdraw, { pack: 1, duration: 0.4 }, 8.9);
  tl.to(S.withdraw, { drop: 1, duration: 0.4 }, 9.2);
  tl.to(S.withdraw, { lid: 1, duration: 0.3 }, 9.55);
  tl.to(one('route'), { strokeDashoffset: 0, duration: 0.7, ease: 'power1.inOut' }, 9.6);
  tl.to(S.withdraw, { away: 1, duration: 0.7, ease: 'power1.in' }, 9.8);
  cardOut(withdrawCard, 10.2);
  captionOut(captions[4], 10.2);
  tl.to(portfolio, { autoAlpha: 1, duration: 0.3 }, 10.4);

  // ============ Step 4. Sell: a coin streams into a ₹ ============
  captionIn(captions[5], 10.6);
  press('sell', 10.6, 13);
  tl.to(S.sell, { coin: 1, duration: 0.7 }, 10.8);
  tl.to(portfolio, { autoAlpha: 0, duration: 0.3 }, 11.3);
  tl.to(S.sell, { burst: 1, duration: 0.9 }, 11.4);
  cardIn(sold, 12);
  tl.to(one('sold-check'), { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, 12.2);
  tl.to(S.sell, { fade: 1, duration: 0.4 }, 12.4);
  cardOut(sold, 12.9);
  captionOut(captions[5], 12.9);

  // ============ The finished picture: the coins rise back out into orbit ============
  tl.to(S.pig, { rotY: -1.18, duration: 1.2, ease: 'power2.inOut' }, 13.1);
  pigY(0.5, 13.1);
  tl.to(S.cam, { z: 10.8, y: 0.6, duration: 1.4, ease: 'power2.inOut' }, 13.1);
  S.returns.forEach((r, i) => tl.to(r, { t: 1, duration: 0.9 }, 13.2 + i * 0.15));
  tl.to(portfolio, { ...faint, duration: 0.7, ease: 'power2.inOut' }, 13.5);
  captionIn(closing, 13.6);
  tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 13.8);
  tl.to(S.sheen, { v: 1, duration: 1.2, ease: 'power1.inOut' }, 13.9);
  tl.to({}, { duration: 0.01 }, 15);

  // Numbers on the cards that count up
  const balance = one('dash-grams');
  const value = one('dash-value');
  const sync = () => {
    balance.textContent = `${(PORTFOLIO.grams * S.count.v).toFixed(3)} g`;
    value.textContent = inr(PORTFOLIO.value * S.count.v);
  };
  sync();

  // ---- The whole: the logo flies up to the corner as the piggy bank fades in, then the story ----
  const whole = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const bigLogo = one('big-logo');
  const slot = one('logo-slot');
  const canvas = root.querySelector('canvas');
  const toSlot = () => {
    const s = root.getBoundingClientRect();
    const t = slot.getBoundingClientRect();
    return {
      x: t.left + t.width / 2 - s.left - root.clientWidth / 2,
      y: t.top + t.height / 2 - s.top - root.clientHeight * 0.45,
      scale: slot.offsetHeight / bigLogo.offsetHeight,
    };
  };
  const target = toSlot();
  whole.to(bigLogo, { x: target.x, y: target.y, scale: target.scale, duration: LOGO_UNITS, ease: 'power2.inOut' }, 0);
  if (canvas) {
    gsap.set(canvas, { autoAlpha: 0 });
    whole.to(canvas, { autoAlpha: 1, duration: 0.6, ease: 'power1.out' }, LOGO_UNITS - 0.5);
  }
  whole.add(tl.paused(false), LOGO_UNITS);
  whole.eventCallback('onUpdate', sync);
  return whole;
}

// The SafeGold logo builds itself in the middle, once, as the section arrives
function playLogoIntro(root: HTMLElement) {
  const q = (k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-g="${k}"]`));
  const bigLogo = q('big-logo')[0];
  gsap.set(bigLogo, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
  gsap.set(q('g-arc'), { strokeDashoffset: 1 });
  gsap.set(q('g-bar'), { scaleX: 0, transformOrigin: '0% 50%' });
  gsap.set(q('g-letter'), { yPercent: 110, autoAlpha: 0 });
  gsap.set(q('g-shine'), { xPercent: -120 });
  const intro = gsap.timeline({ paused: true });
  intro
    .to(q('g-arc'), { strokeDashoffset: 0, duration: 0.8, ease: 'power3.inOut', stagger: 0.12 })
    .to(q('g-bar'), { scaleX: 1, duration: 0.4, ease: 'power3.out' }, '-=0.25')
    .to(q('g-letter'), { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power4.out', stagger: 0.06 }, '-=0.3')
    .to(q('g-shine'), { xPercent: 120, duration: 1.2, ease: 'power2.inOut' }, '-=0.25');
  return intro;
}

function centerOf(el: Element | null, origin: DOMRect): ScreenPoint {
  if (!el) return { x: origin.width / 2, y: origin.height / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top };
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

      const build = () => {
        const place = pin?.progress ?? 0;
        const wasPinned = !!pin && window.scrollY >= pin.start;
        playhead?.kill();
        context?.revert();
        narrowRef.current = window.innerWidth < 768;
        const state = createState(narrowRef.current);
        stateRef.current = state;
        context = gsap.context(() => {
          const tl = buildTimeline(section, state, narrowRef.current);
          // The logo's own entrance plays once, on arrival; the flight to the corner is scrolled
          const intro = playLogoIntro(section);
          ScrollTrigger.create({ trigger: section, start: 'top 75%', once: true, onEnter: () => intro.play() });
          const onUpdate = tl.eventCallback('onUpdate') as () => void;
          tl.eventCallback('onUpdate', () => {
            onUpdate();
            timeRef.current = tl.time();
          });
          playhead = createPlayhead(tl, PACE);
          pin = ScrollTrigger.create({
            trigger: section,
            start: 'top 72px',
            end: `+=${tl.duration() * SCROLL_PER_STEP_UNIT}`,
            pin: true,
            refreshPriority: 2,
            onUpdate: (self) => playhead?.follow(self.progress),
          });
        }, section);
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        if (pin && wasPinned) {
          window.scrollTo({ top: pin.start + (pin.end - pin.start) * place, behavior: 'instant' });
          playhead?.jump(place);
        }
      };
      build();

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
        playhead?.kill();
        context?.revert();
      };
    });
    return () => mm.revert();
  }, []);

  // The site's navbar belongs to the top of the page: it fades out as SafeGold begins, and comes
  // back when the user scrolls up to the phone again
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('[data-site-nav]');
    const from = document.querySelector<HTMLElement>('[data-nav-hides-here]');
    if (!nav || !from) return;
    const trigger = ScrollTrigger.create({
      trigger: from,
      start: 'top 55%',
      onEnter: () => gsap.to(nav, { autoAlpha: 0, duration: 0.3, overwrite: true }),
      onLeaveBack: () => gsap.to(nav, { autoAlpha: 1, duration: 0.3, overwrite: true }),
    });
    return () => {
      trigger.kill();
      gsap.set(nav, { clearProps: 'opacity,visibility' });
    };
  }, []);

  // The 3D scene loads only as the section comes near, and draws only while it is on screen
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let scene: GoldScene | null = null;
    let visible = false;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const tick = () => {
      if (!scene || !visible) return;
      const S = stateRef.current;
      const origin = canvas.getBoundingClientRect();
      const narrow = narrowRef.current;
      const frame: GoldFrame = {
        time: timeRef.current,
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
          portfolio: centerOf(section.querySelector('[data-g="portfolio"]'), origin),
          withdraw: centerOf(section.querySelector('[data-g="btn-withdraw"]'), origin),
          sell: centerOf(section.querySelector('[data-g="btn-sell"]'), origin),
          // The withdraw and sell pieces play out beside the piggy bank, never over it
          rupee: { x: origin.width * (narrow ? 0.5 : 0.79), y: origin.height * (narrow ? 0.52 : 0.48) },
          bench: { x: origin.width * (narrow ? 0.5 : 0.79), y: origin.height * (narrow ? 0.58 : 0.56) },
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
        aria-label="SafeGold"
        className="relative w-full h-[calc(100svh-72px)] overflow-hidden select-none motion-reduce:hidden"
        style={{
          background:
            'radial-gradient(ellipse 50% 55% at 50% 60%, #15100a 0%, #0c0a07 40%, rgba(0,0,0,0) 100%)',
        }}
      >
        {/* The portfolio sits behind the 3D scene, so the coin can rise out of it */}
        <div className="absolute z-0 bottom-4 left-1/2 -translate-x-1/2 w-[min(340px,calc(100%-32px))] md:bottom-auto md:left-[5%] md:translate-x-0 md:top-1/2 md:-translate-y-1/2 md:w-[320px]">
          <div data-g="portfolio" style={HIDDEN} className={`${CARD} pointer-events-auto`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A3A3A3]">Total gold balance</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-[#F5F5F5] tabular-nums">
                  {PORTFOLIO.grams.toFixed(3)}
                  <span className="ml-1 text-lg font-medium text-[#A3A3A3]">g</span>
                </p>
                <p className="mt-1 text-sm text-[#A3A3A3]">
                  ≈ {inr(PORTFOLIO.value)} · {PORTFOLIO.karat}
                </p>
              </div>
              <CoinStack />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(['withdraw', 'sell'] as const).map((which) => (
                <span
                  key={which}
                  data-g={`btn-${which}`}
                  className="relative flex items-center justify-center overflow-hidden rounded-full border border-[#D4AF37]/60 py-2 text-[13px] font-semibold"
                >
                  <span data-g={`fill-${which}`} style={HIDDEN} className={`absolute inset-0 ${METAL}`} />
                  <span data-g={`label-${which}`} className="relative text-[#FFE9A3]">
                    {which === 'withdraw' ? 'Withdraw Gold' : 'Sell Gold'}
                  </span>
                </span>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-[#A3A3A3]/70">Illustrative values</p>
          </div>
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 z-10 block h-full w-full" aria-hidden="true" />

        {/* SafeGold's logo: big in the middle at first, then it flies up into the corner */}
        <div data-g="big-logo" className="pointer-events-none absolute left-1/2 top-[45%] z-30" style={{ transform: 'translate(-50%, -50%)' }}>
          <div className="relative overflow-hidden">
            <SafeGoldLogo animated className="text-[40px] sm:text-[76px]" />
            <span data-g="g-shine" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#FFE9A3]/40 to-transparent mix-blend-overlay" />
          </div>
        </div>

        {/* Headlines, down the left under the logo */}
        <div className="absolute left-4 right-4 top-6 sm:top-8 md:left-[5%] md:right-auto md:top-6 md:w-[min(42rem,58vw)] z-20 pointer-events-none">
          <span data-g="logo-slot" className="inline-flex invisible">
            <SafeGoldLogo className="text-[20px] sm:text-[24px]" />
          </span>
          <div className="relative mt-2">
            {SCENES.map((scene, i) => (
              <div key={scene.title} data-g="caption" className="absolute inset-x-0 top-0 text-left">
                <h2 className="text-[26px] sm:text-4xl font-semibold text-[#F5F5F5] tracking-tight leading-[1.15]">{scene.title}</h2>
                <p className="max-w-xl text-sm sm:text-base text-[#A3A3A3] tracking-tight mt-2">{scene.body}</p>
                {i === SCENES.length - 1 && (
                  <a
                    data-g="cta"
                    href="#safegold"
                    style={HIDDEN}
                    className={`pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-full ${METAL} bg-[length:220%_100%] bg-[position:0%_0] px-6 py-2.5 text-sm font-semibold text-[#120d02] shadow-[0_8px_24px_rgba(212,175,55,0.18)] transition-[background-position,transform,box-shadow] duration-700 ease-out hover:bg-[position:100%_0] hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] active:scale-[0.97]`}
                  >
                    Explore SafeGold
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cards to the left of the piggy bank on desktop, below it on phones */}
        <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 w-[min(340px,calc(100%-32px))] md:bottom-auto md:left-[5%] md:translate-x-0 md:top-1/2 md:-translate-y-1/2 md:w-[320px] pointer-events-none">
          <div className="relative">
            <div data-g="txn" style={HIDDEN} className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
                  <circle cx="20" cy="20" r="18" fill="none" stroke={GOLD.primary} strokeOpacity="0.45" strokeWidth="1.5" />
                  <path data-g="check" d="M12.5 20.5l5 5 10-11" fill="none" stroke={GOLD.champagne} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" />
                </svg>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Gold Purchase Successful</p>
                  <p className="text-[13px] text-[#A3A3A3]">24K Digital Gold</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#D4AF37]/15 pt-3 text-[13px]">
                <span className="text-[#A3A3A3]">Status</span>
                <span className="font-medium text-[#F5D76E]">Investment Added</span>
              </div>
            </div>

            <div data-g="dash" style={HIDDEN} className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}>
              <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Your Gold Portfolio</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                <div>
                  <dt className="text-[#A3A3A3]">Gold Balance</dt>
                  <dd data-g="dash-grams" className="font-semibold text-[#F5F5F5] tabular-nums">0.000 g</dd>
                </div>
                <div>
                  <dt className="text-[#A3A3A3]">Investment Value</dt>
                  <dd data-g="dash-value" className="font-semibold text-[#F5F5F5] tabular-nums">₹0</dd>
                </div>
                <div>
                  <dt className="text-[#A3A3A3]">Gold Type</dt>
                  <dd className="font-semibold text-[#F5F5F5]">{PORTFOLIO.karat}</dd>
                </div>
                <div>
                  <dt className="text-[#A3A3A3]">Portfolio Status</dt>
                  <dd className="font-semibold text-[#F5D76E]">{PORTFOLIO.status}</dd>
                </div>
              </dl>
              <svg viewBox="0 0 260 64" className="mt-3 h-14 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="sg-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={GOLD.primary} stopOpacity="0.28" />
                    <stop offset="1" stopColor={GOLD.primary} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path data-g="chart-area" d={CHART_AREA} fill="url(#sg-area)" />
                <path data-g="chart-line" d={CHART_LINE} fill="none" stroke={GOLD.champagne} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" vectorEffect="non-scaling-stroke" />
              </svg>
              <p className="mt-2 text-[10px] text-[#A3A3A3]/70">Illustrative values, not live data</p>
            </div>

            <div data-g="withdraw-card" style={HIDDEN} className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}>
              <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Withdraw Physical Gold</p>
              <p className="mt-1 text-[13px] text-[#A3A3A3]">Convert your digital gold into physical gold.</p>
              <ul className="mt-3 space-y-2.5 text-[13px] text-[#F5F5F5]">
                <li className="flex items-center gap-2.5">
                  <IconBar />
                  Choose your preferred available coin or bar.
                </li>
                <li className="flex items-center gap-2.5">
                  <IconPin />
                  Delivered to your selected address.
                </li>
              </ul>
              {/* Package on its way to the address */}
              <div className="mt-4 flex items-center gap-2">
                <IconPackage />
                <svg viewBox="0 0 160 8" className="h-2 flex-1" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 4H158" stroke={GOLD.primary} strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 4" />
                  <path data-g="route" d="M2 4H158" stroke={GOLD.champagne} strokeWidth="1.5" pathLength={1} strokeDasharray="1" />
                </svg>
                <IconPin />
              </div>
            </div>

            <div data-g="sold" style={HIDDEN} className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}>
              <div className="flex items-center gap-3">
                <span data-g="sold-icon" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/50 text-xl font-semibold text-[#F5D76E]">
                  ₹
                </span>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Gold Sold Successfully</p>
                  <p className="flex items-center gap-1.5 text-[13px] text-[#A3A3A3]">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                      <path data-g="sold-check" d="M3.5 8.5l3 3 6-7" fill="none" stroke={GOLD.champagne} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" />
                    </svg>
                    Amount credited
                  </p>
                </div>
              </div>
              <dl className="mt-3 space-y-1.5 border-t border-[#D4AF37]/15 pt-3 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-[#A3A3A3]">Gold Sold</dt>
                  <dd className="font-semibold text-[#F5F5F5] tabular-nums">{SALE.grams}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#A3A3A3]">Sale Value</dt>
                  <dd className="font-semibold text-[#F5D76E] tabular-nums">{SALE.value}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[10px] text-[#A3A3A3]/70">Illustrative values, not live prices</p>
            </div>
          </div>
        </div>

        {/* The four steps, and how far along them the story is */}
        <ol data-g="steps" style={HIDDEN} className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 md:flex">
          {STEPS.map((step, i) => (
            <li key={step.label} className="flex items-center gap-3">
              <span data-g="step-label" className="text-xs font-medium uppercase tracking-[0.16em]">
                {String(i + 1).padStart(2, '0')} {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="h-px w-14 overflow-hidden bg-[#D4AF37]/20">
                  <span data-g="step-fill" className="block h-full w-full origin-left bg-[#D4AF37]" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Without motion, the journey is simply listed */}
      <div className="hidden motion-reduce:block w-full max-w-4xl mx-auto mt-16 px-4">
        <p className="text-sm font-medium text-[#D4AF37]">SafeGold</p>
        <ol className="mt-4 grid gap-6 sm:grid-cols-2">
          {SCENES.map((scene) => (
            <li key={scene.title}>
              <h3 className="text-xl font-semibold text-[#F5F5F5] tracking-tight">{scene.title}</h3>
              <p className="text-sm text-[#A3A3A3] tracking-tight mt-1">{scene.body}</p>
            </li>
          ))}
        </ol>
        <a href="#safegold" className={`mt-6 inline-flex rounded-full ${METAL} px-6 py-2.5 text-sm font-semibold text-[#120d02] pointer-events-auto`}>
          Explore SafeGold
        </a>
      </div>
    </>
  );
}

function CoinStack() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="sg-coin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={GOLD.dark} />
          <stop offset="0.45" stopColor={GOLD.highlight} />
          <stop offset="1" stopColor={GOLD.dark} />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${i % 2 ? 2 : 0} ${46 - i * 7})`}>
          <rect x="10" y="0" width="42" height="7" fill="url(#sg-coin)" />
          <ellipse cx="31" cy="0" rx="21" ry="5" fill={GOLD.primary} stroke={GOLD.highlight} strokeOpacity="0.6" strokeWidth="0.75" />
          <ellipse cx="31" cy="7" rx="21" ry="5" fill="url(#sg-coin)" />
        </g>
      ))}
    </svg>
  );
}

const iconProps = { viewBox: '0 0 20 20', className: 'h-5 w-5 shrink-0', fill: 'none', stroke: GOLD.primary, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
function IconBar() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M5 7h10l2.5 7h-15z" />
      <path d="M8 10.5h4" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M10 17.5s5.5-4.8 5.5-9a5.5 5.5 0 0 0-11 0c0 4.2 5.5 9 5.5 9z" />
      <circle cx="10" cy="8.5" r="2" />
    </svg>
  );
}
function IconPackage() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5z" />
      <path d="M3 6.5 10 10l7-3.5M10 10v7" />
    </svg>
  );
}

// SafeGold's mark and name: a G drawn as two arcs with a crossbar, then the letters, in gold
function SafeGoldLogo({ animated = false, className = '' }: { animated?: boolean; className?: string }) {
  const k = (name: string) => (animated ? name : undefined);
  return (
    <span className={`flex items-center gap-[0.4em] font-bold leading-none tracking-[0.18em] text-[#D4AF37] ${className}`} aria-label="SafeGold" role="img">
      <svg viewBox="0 0 48 48" className="h-[1.1em] w-[1.1em] shrink-0" fill="none" stroke="#D4AF37" strokeLinecap="round" aria-hidden="true">
        {/* Outer G */}
        <path data-g={k('g-arc')} d="M40 14 A19 19 0 1 0 43 26 H25" strokeWidth="5.5" pathLength={1} strokeDasharray="1" />
        {/* Inner stroke, echoing it */}
        <path data-g={k('g-arc')} d="M31 17.5 A10 10 0 1 0 33.5 26" strokeWidth="4.5" pathLength={1} strokeDasharray="1" />
        <path data-g={k('g-bar')} d="M12 26 H20" strokeWidth="4.5" />
      </svg>
      <span className="flex" aria-hidden="true">
        {'SAFEGOLD'.split('').map((letter, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
            <span data-g={k('g-letter')} className="inline-block">
              {letter}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
