'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createPlayhead, SCROLL_PER_UNIT } from '../journey';
import {
  HUB,
  SCENES,
  SUMMARY,
  PRIMARY_GIFT,
  SAVINGS_CHART,
  type HubbleFrame,
  type ScreenPoint,
} from './hubbleData';
import type { HubbleScene } from './hubbleScene';

gsap.registerPlugin(ScrollTrigger);

const HIDDEN = { visibility: 'hidden' } as const;

// Luxury dark fintech card styling with ultra-thin metallic border
const CARD =
  'rounded-2xl border border-white/15 bg-[#0a0a0a]/92 p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl';

// SVG chart points for Scene 3
const chartPoints = SAVINGS_CHART.map((v, i) => [
  (i / (SAVINGS_CHART.length - 1)) * 260,
  60 - ((v - 12) / 46) * 54,
] as const);
const CHART_LINE = chartPoints.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const CHART_AREA = `${CHART_LINE} L260 64 L0 64 Z`;

// Featured docking timeline marks
const DOCK_TIMES = [
  { at: 4.4, dur: 1.6 },
  { at: 8.6, dur: 1.3 },
  { at: 9.1, dur: 1.3 },
  { at: 9.6, dur: 1.3 },
  { at: 10.1, dur: 1.3 },
  { at: 10.6, dur: 1.3 },
];
const LANDING_TIMES = DOCK_TIMES.map((d) => d.at + d.dur * 0.92);

function createState(narrow: boolean) {
  return {
    time: 0,
    cam: { z: 7.2, y: 0.65 },
    grid: { tilt: 0.12, converge: 0, back: 0, reveal: 0 },
    terminal: { sx: 0.5, sy: narrow ? 0.44 : 0.54, z: 0, scale: 1, rotY: -0.95, recoil: 0, statusLight: 0 },
    sheen: { v: -1 },
    featuredDock: DOCK_TIMES.map(() => ({ t: 0 })),
    featuredReturn: DOCK_TIMES.map(() => ({ t: 0 })),
    cardFocus: { t: 0, action: 'none' as 'none' | 'redeem' | 'transfer', redeemProgress: 0, voucherDeploy: 0 },
    payout: { streamProgress: 0, settlementConfirm: 0 },
    count: { v: 0 },
  };
}
type HubbleState = ReturnType<typeof createState>;

function buildTimeline(root: HTMLElement, S: HubbleState, narrow: boolean) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const one = (k: string) => root.querySelector<HTMLElement>(`[data-g="${k}"]`)!;
  const captions = Array.from(root.querySelectorAll<HTMLElement>('[data-g="caption"]'));
  const closing = captions[captions.length - 1];

  // Floating UI Cards
  const txnCard = one('txn-card');
  const dashCard = one('dash-card');
  const actionCard = one('action-card');
  const voucherCard = one('voucher-card');
  const settlementCard = one('settlement-card');
  const ctaBtn = one('cta-btn');

  // Interactive buttons inside action card
  const btnRedeem = one('btn-redeem');
  const btnTransfer = one('btn-transfer');

  // Initial visibility and positions
  gsap.set(captions, { autoAlpha: 0, y: 18 });
  gsap.set([txnCard, dashCard, actionCard, voucherCard, settlementCard], { autoAlpha: 0, y: 24 });
  gsap.set(ctaBtn, { autoAlpha: 0, y: 14 });
  gsap.set(one('check-icon'), { strokeDashoffset: 1 });
  gsap.set(one('chart-line'), { strokeDashoffset: 1 });
  gsap.set(one('chart-area'), { autoAlpha: 0 });
  gsap.set(one('settle-check'), { strokeDashoffset: 1 });

  const captionIn = (el: HTMLElement, at: number) =>
    tl.to(el, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at);
  const captionOut = (el: HTMLElement, at: number) =>
    tl.to(el, { autoAlpha: 0, y: -16, duration: 0.35, ease: 'power2.in' }, at);

  const cardIn = (el: HTMLElement, at: number) =>
    tl.to(el, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, at);
  const cardOut = (el: HTMLElement, at: number) =>
    tl.to(el, { autoAlpha: 0, y: -16, duration: 0.4, ease: 'power2.in' }, at);

  // =========================================================================
  // SCENE 1: The Architectural Brand Grid Awakening (0.0 to 4.0)
  // =========================================================================
  captionIn(captions[0], 0.2);
  // Grid tilts horizontally and camera glides forward through the 400+ matrix
  tl.to(S.cam, { z: 6.2, y: 0.45, duration: 3.6, ease: 'power1.inOut' }, 0.0);
  tl.to(S.grid, { tilt: -0.08, duration: 3.6, ease: 'power1.inOut' }, 0.0);
  tl.to(S.terminal, { rotY: -0.65, duration: 3.8, ease: 'power1.inOut' }, 0.2);
  captionOut(captions[0], 3.7);

  // =========================================================================
  // SCENE 2: Precision Gift Card Docking (4.0 to 8.0)
  // =========================================================================
  captionIn(captions[1], 4.1);
  // Grid gracefully converges toward the terminal
  tl.to(S.grid, { converge: 1, duration: 2.2, ease: 'power2.inOut' }, 4.0);
  tl.to(S.cam, { z: 7.8, y: 0.6, duration: 2.4, ease: 'power2.inOut' }, 4.0);

  // First featured partner card glides from orbit into the central slot
  tl.to(S.featuredDock[0], { t: 1, duration: DOCK_TIMES[0].dur, ease: 'power1.inOut' }, DOCK_TIMES[0].at);

  // Docking click occurs at LANDING_TIMES[0] -> Transaction card slides in
  cardIn(txnCard, LANDING_TIMES[0] + 0.05);
  tl.to(one('check-icon'), { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, LANDING_TIMES[0] + 0.2);
  tl.to(S.sheen, { v: 1, duration: 1.8, ease: 'power1.inOut' }, LANDING_TIMES[0] + 0.1);

  cardOut(txnCard, 7.8);
  captionOut(captions[1], 7.8);

  // =========================================================================
  // SCENE 3: Portfolio Aggregation & Value Tracking (8.0 to 12.6)
  // =========================================================================
  captionIn(captions[2], 8.1);
  cardIn(dashCard, 8.4);

  // Remaining partner cards sequentially dock into the terminal
  DOCK_TIMES.slice(1).forEach((d, i) => {
    tl.to(S.featuredDock[i + 1], { t: 1, duration: d.dur, ease: 'power1.inOut' }, d.at);
  });

  // Terminal counts up savings metrics
  tl.to(S.count, { v: 1, duration: 3.4, ease: 'power1.inOut' }, 8.8);
  tl.to(one('chart-line'), { strokeDashoffset: 0, duration: 2.4, ease: 'power2.out' }, 9.0);
  tl.to(one('chart-area'), { autoAlpha: 1, duration: 1.2 }, 10.2);

  cardOut(dashCard, 12.4);
  captionOut(captions[2], 12.4);

  // =========================================================================
  // SCENE 4: Total Control: Redeem or Transfer (12.6 to 16.6)
  // =========================================================================
  captionIn(captions[3], 12.8);
  // Terminal recedes slightly, camera reframes, primary card floats forward into focus
  tl.to(S.cam, { z: 7.2, y: 0.5, duration: 1.6, ease: 'power2.inOut' }, 12.7);
  tl.to(S.terminal, { scale: 0.85, rotY: -0.85, duration: 1.6, ease: 'power2.inOut' }, 12.7);
  tl.to(S.cardFocus, { t: 1, duration: 1.8, ease: 'power2.out' }, 12.9);
  cardIn(actionCard, 13.5);

  captionOut(captions[3], 16.3);

  // =========================================================================
  // SCENE 5: Frictionless Brand Redemption (16.6 to 20.6)
  // =========================================================================
  captionIn(captions[4], 16.8);
  // Redeem Instantly button press animation
  tl.to(btnRedeem, { scale: 0.95, borderColor: '#ffffff', duration: 0.2 }, 16.9);
  tl.to(btnRedeem, { scale: 1.0, duration: 0.2 }, 17.1);

  // Primary card transitions into active digital voucher with barcode
  tl.to(S.cardFocus, { redeemProgress: 1, duration: 1.6, ease: 'power2.inOut' }, 17.0);
  cardOut(actionCard, 17.2);
  cardIn(voucherCard, 17.6);

  cardOut(voucherCard, 20.3);
  captionOut(captions[4], 20.3);

  // =========================================================================
  // SCENE 6: Seamless Liquidity & Payouts (20.6 to 24.6)
  // =========================================================================
  captionIn(captions[5], 20.7);
  // Transfer to Bank liquidity flow
  tl.to(btnTransfer, { scale: 0.95, borderColor: '#ffffff', duration: 0.2 }, 20.8);
  tl.to(btnTransfer, { scale: 1.0, duration: 0.2 }, 21.0);

  // Voucher particle stream into settlement conduit & ₹ symbol
  tl.to(S.payout, { streamProgress: 1, duration: 2.2, ease: 'power1.inOut' }, 21.0);
  tl.to(S.cardFocus, { t: 0, duration: 1.0, ease: 'power2.in' }, 21.8);
  cardIn(settlementCard, 22.2);
  tl.to(one('settle-check'), { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, 22.5);
  tl.to(S.payout, { settlementConfirm: 1, duration: 0.8 }, 22.6);

  cardOut(settlementCard, 24.4);
  captionOut(captions[5], 24.4);

  // =========================================================================
  // SCENE 7: The Connected Ecosystem & CTA (24.6 to 28.5)
  // =========================================================================
  // Terminal and cards return to balanced panoramic constellation
  tl.to(S.terminal, { scale: 1.0, rotY: -0.95, duration: 2.0, ease: 'power2.inOut' }, 24.6);
  tl.to(S.cam, { z: 8.4, y: 0.6, duration: 2.4, ease: 'power2.inOut' }, 24.6);
  tl.to(S.grid, { back: 1, reveal: 1, duration: 2.0, ease: 'power2.out' }, 24.8);

  // Featured partner cards return from terminal into their balanced orbit
  S.featuredReturn.forEach((r, i) => {
    tl.to(r, { t: 1, duration: 1.5, ease: 'power1.inOut' }, 25.0 + i * 0.25);
  });

  captionIn(closing, 25.8);
  tl.to(ctaBtn, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 26.2);
  tl.to(S.sheen, { v: 1, duration: 1.8, ease: 'power1.inOut' }, 26.8);

  tl.to({}, { duration: 0.01 }, 28.5);

  // Sync counting numbers on Scene 3 dashboard
  const userSavings = one('dash-savings');
  const userBrands = one('dash-brands');
  const sync = () => {
    const savingsVal = Math.round(10 * S.count.v);
    const brandsVal = Math.round(400 * S.count.v);
    if (userSavings) userSavings.textContent = `₹${savingsVal}Cr+`;
    if (userBrands) userBrands.textContent = `${brandsVal}+ Connected`;
  };
  tl.eventCallback('onUpdate', sync);
  sync();

  return tl;
}

function centerOf(el: Element | null, origin: DOMRect): ScreenPoint {
  if (!el) return { x: origin.width / 2, y: origin.height / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top };
}

export default function HubbleSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<HubbleState>(createState(false));
  const timeRef = useRef(0);
  const narrowRef = useRef(false);

  // Scroll synchronization with GSAP ScrollTrigger and playhead
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
          const onUpdate = tl.eventCallback('onUpdate') as () => void;
          tl.eventCallback('onUpdate', () => {
            if (onUpdate) onUpdate();
            timeRef.current = tl.time();
          });
          playhead = createPlayhead(tl);

          pin = ScrollTrigger.create({
            trigger: section,
            start: 'top 72px',
            end: `+=${tl.duration() * SCROLL_PER_UNIT}`,
            pin: true,
            onUpdate: (self) => playhead?.follow(self.progress),
          });
        }, section);

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

  // WebGL 3D Scene Initialization and Render Loop
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let scene: HubbleScene | null = null;
    let visible = false;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const tick = () => {
      if (!scene || !visible) return;
      const S = stateRef.current;
      const origin = canvas.getBoundingClientRect();

      const frame: HubbleFrame = {
        time: timeRef.current,
        cam: S.cam,
        grid: S.grid,
        terminal: S.terminal,
        sheen: S.sheen.v,
        featuredDock: S.featuredDock.map((d) => d.t),
        featuredReturn: S.featuredReturn.map((r) => r.t),
        landings: LANDING_TIMES,
        cardFocus: S.cardFocus,
        payout: S.payout,
        count: S.count.v,
        anchors: {
          dashboard: centerOf(section.querySelector('[data-g="dash-card"]'), origin),
          dockCard: centerOf(section.querySelector('[data-g="txn-card"]'), origin),
          primaryCard: { x: origin.width * (narrowRef.current ? 0.5 : 0.68), y: origin.height * 0.52 },
          deliveryBadge: centerOf(section.querySelector('[data-g="voucher-card"]'), origin),
          settlementBadge: centerOf(section.querySelector('[data-g="settlement-card"]'), origin),
        },
      };

      scene.render(frame);
    };

    const load = () => {
      import('./hubbleScene')
        .then(({ HubbleScene }) => {
          if (cancelled) return;
          try {
            scene = new HubbleScene(canvas);
          } catch (error) {
            console.warn('Hubble scene unavailable:', error);
            return;
          }
          resizeObserver = new ResizeObserver(() => scene?.resize(canvas.clientWidth, canvas.clientHeight));
          resizeObserver.observe(canvas);
          scene.resize(canvas.clientWidth, canvas.clientHeight);
          gsap.ticker.add(tick);
        })
        .catch((error) => console.warn('Hubble scene failed to load:', error));
    };

    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          nearObserver.disconnect();
          load();
        }
      },
      { rootMargin: '150% 0px' }
    );
    nearObserver.observe(section);

    const onScreenObserver = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    onScreenObserver.observe(section);

    return () => {
      cancelled = true;
      nearObserver.disconnect();
      onScreenObserver.disconnect();
      resizeObserver?.disconnect();
      gsap.ticker.remove(tick);
      scene?.dispose();
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        data-hubble
        aria-label="Hubble brand partnerships and instant discounts"
        className="relative w-full h-[calc(100svh-72px)] overflow-hidden select-none motion-reduce:hidden"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 55%, #0d0d0d 0%, #050505 55%, #000000 100%)',
        }}
      >
        {/* Three.js Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 z-10 block h-full w-full" aria-hidden="true" />

        {/* Scene Headlines and Supporting Texts */}
        <div className="absolute inset-x-0 top-6 sm:top-8 md:top-6 z-20 px-4 pointer-events-none">
          <div className="relative mx-auto max-w-3xl">
            {SCENES.map((scene, i) => (
              <div key={scene.title} data-g="caption" className="absolute inset-x-0 top-0 text-center">
                <h2 className="text-[25px] sm:text-4xl md:text-5xl font-semibold text-[#F5F5F5] tracking-tight leading-[1.2] mt-1">
                  {scene.title}
                </h2>
                <p className="mx-auto max-w-xl text-sm sm:text-base text-[#A3A3A3] tracking-tight mt-2.5">
                  {scene.body}
                </p>

                {/* Final Scene CTA Button */}
                {i === SCENES.length - 1 && (
                  <div className="mt-5 pointer-events-auto flex flex-col items-center justify-center">
                    <a
                      data-g="cta-btn"
                      href="#brands"
                      style={HIDDEN}
                      className="group inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-[#0A0A0A] px-7 py-3 text-sm font-medium text-[#F5F5F5] shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-white/70 hover:bg-[#141414] hover:shadow-[0_12px_40px_rgba(255,255,255,0.12)] hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <span>Explore Brands</span>
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                    <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#737373]">
                      Brand partnerships powered by
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/assets/images/hubble-logo.png"
                        alt="Hubble"
                        className="h-5 w-auto invert contrast-200 opacity-80"
                      />
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating Contextual UI Cards */}
        <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 w-[min(350px,calc(100%-32px))] md:bottom-auto md:left-[5%] md:translate-x-0 md:top-1/2 md:-translate-y-1/2 md:w-[340px] pointer-events-none">
          <div className="relative">
            {/* SCENE 2: Precision Docking Card */}
            <div
              data-g="txn-card"
              style={HIDDEN}
              className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
                    <path
                      data-g="check-icon"
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Instant Gift Card Unlocked</p>
                  <p className="text-[12px] text-[#A3A3A3]">Zero Waiting Period</p>
                </div>
              </div>
              <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">Delivery Speed</span>
                  <span className="font-medium text-[#F5F5F5]">Instant WhatsApp & App</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">Status</span>
                  <span className="flex items-center gap-1 font-medium text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                    Verified & Active
                  </span>
                </div>
              </div>
            </div>

            {/* SCENE 3: Hubble Savings Summary Dashboard */}
            <div
              data-g="dash-card"
              style={HIDDEN}
              className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Hubble Savings Summary</p>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  Live
                </span>
              </div>

              <dl className="mt-3.5 grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <dt className="text-[11px] text-[#A3A3A3]">Active Channels</dt>
                  <dd data-g="dash-brands" className="mt-1 font-semibold text-[#F5F5F5]">
                    {SUMMARY.brands} Connected
                  </dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <dt className="text-[11px] text-[#A3A3A3]">Total User Savings</dt>
                  <dd data-g="dash-savings" className="mt-1 font-semibold text-[#F5F5F5]">
                    {SUMMARY.savingsCr} Milestone
                  </dd>
                </div>
              </dl>

              {/* Minimal upward-trending analytics chart */}
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] text-[#A3A3A3] mb-1">
                  <span>Savings Velocity</span>
                  <span className="text-white font-medium">↑ +38% this month</span>
                </div>
                <svg viewBox="0 0 260 64" className="w-full h-12 overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path data-g="chart-area" d={CHART_AREA} fill="url(#chart-grad)" />
                  <path
                    data-g="chart-line"
                    d={CHART_LINE}
                    fill="none"
                    stroke="#F5F5F5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-[12px] text-[#A3A3A3]">
                <span>Status</span>
                <span className="text-white font-medium">{SUMMARY.status}</span>
              </div>
            </div>

            {/* SCENE 4: Total Control (Redeem or Transfer Action Buttons) */}
            <div
              data-g="action-card"
              style={HIDDEN}
              className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 pointer-events-auto`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#A3A3A3]">Primary Voucher</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#F5F5F5]">₹{PRIMARY_GIFT.balance}</p>
                </div>
                <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white">
                  AMAZON
                </span>
              </div>

              <p className="mt-2 text-xs text-[#A3A3A3]">Choose how you want to manage your saved balance:</p>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div
                  data-g="btn-redeem"
                  className="flex flex-col items-center justify-center rounded-xl border border-white/30 bg-[#161616] p-2.5 text-center transition-all duration-200"
                >
                  <span className="text-[13px] font-semibold text-white">Redeem Instantly</span>
                  <span className="text-[10px] text-[#A3A3A3] mt-0.5">Online & In-Store</span>
                </div>

                <div
                  data-g="btn-transfer"
                  className="flex flex-col items-center justify-center rounded-xl border border-white/20 bg-[#111111] p-2.5 text-center transition-all duration-200"
                >
                  <span className="text-[13px] font-semibold text-[#D4D4D4]">Transfer to Bank</span>
                  <span className="text-[10px] text-[#737373] mt-0.5">Direct Payout</span>
                </div>
              </div>
            </div>

            {/* SCENE 5: Frictionless Brand Redemption (Voucher Deployment) */}
            <div
              data-g="voucher-card"
              style={HIDDEN}
              className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor">
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Instant Voucher Deployment</p>
                  <p className="text-[12px] text-[#A3A3A3]">Redeemable across top retail partners</p>
                </div>
              </div>

              <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">Delivery Channel</span>
                  <span className="font-medium text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    WhatsApp (+91 ••••• ••890)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">App Sync</span>
                  <span className="font-medium text-[#F5F5F5]">BrokeNoMore Wallet (Ready)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">Redemption Scope</span>
                  <span className="text-white font-medium">Valid for online & in-store checkout</span>
                </div>
              </div>
            </div>

            {/* SCENE 6: Seamless Liquidity & Payouts Confirmation */}
            <div
              data-g="settlement-card"
              style={HIDDEN}
              className={`${CARD} absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
                    <path
                      data-g="settle-check"
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-[#F5F5F5]">Balance Processed Successfully</p>
                  <p className="text-[12px] text-[#A3A3A3]">Funds Credited to Primary Account</p>
                </div>
              </div>

              <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">Settlement Method</span>
                  <span className="font-medium text-white">Instant IMPS / UPI Transfer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">Security Protocol</span>
                  <span className="font-medium text-[#F5F5F5]">Bank-Grade 256-Bit SSL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#A3A3A3]">Status</span>
                  <span className="text-white font-medium">Secure & Encrypted Transaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
