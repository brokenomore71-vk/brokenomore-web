'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createPlayhead, SCROLL_PER_UNIT } from '../journey';
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
function createState() {
  return {
    cam: { z: 10.5, y: 0.55 },
    pig: { sx: 0.5, sy: 0.56, z: 0, scale: 1, rotY: -2.3, value: 0 },
    sheen: { v: -1 },
    deposits: [0, 1, 2, 3].map(() => ({ t: 0 })),
    emerge: { t: 0 },
    withdraw: { coin: 0, morph: 0, pack: 0, drop: 0, lid: 0, away: 0 },
    sell: { coin: 0, burst: 0, fade: 0 },
    orbit: { v: 0, spin: 0 },
    count: { v: 0 },
  };
}
type GoldState = ReturnType<typeof createState>;

// When each deposit starts, and how long its flight lasts (timeline units)
const DEPOSITS = [
  { at: 3.4, dur: 1.8 },
  { at: 7.5, dur: 1.5 },
  { at: 8.4, dur: 1.5 },
  { at: 9.3, dur: 1.5 },
];
// The moment each coin passes through the slot
const LANDINGS = DEPOSITS.map((d) => d.at + d.dur * 0.93);

function buildTimeline(root: HTMLElement, S: GoldState, narrow: boolean) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const one = (k: string) => root.querySelector<HTMLElement>(`[data-g="${k}"]`)!;
  const captions = Array.from(root.querySelectorAll<HTMLElement>('[data-g="caption"]'));
  const txn = one('txn');
  const dash = one('dash');
  const portfolio = one('portfolio');
  const withdrawCard = one('withdraw-card');
  const sold = one('sold');
  const fills = { withdraw: one('fill-withdraw'), sell: one('fill-sell') };
  const labels = { withdraw: one('label-withdraw'), sell: one('label-sell') };
  const cta = one('cta');

  gsap.set(captions, { autoAlpha: 0, y: 18 });
  gsap.set(captions[0], { autoAlpha: 1, y: 0 });
  gsap.set([txn, dash, withdrawCard, sold], { autoAlpha: 0, y: 24 });
  gsap.set(portfolio, { autoAlpha: 0, clipPath: 'circle(0% at 50% 50%)', scale: 1 });
  gsap.set([fills.withdraw, fills.sell], { autoAlpha: 0 });
  gsap.set(cta, { autoAlpha: 0, y: 12 });
  gsap.set(one('check'), { strokeDashoffset: 1 });
  gsap.set(one('chart-line'), { strokeDashoffset: 1 });
  gsap.set(one('chart-area'), { autoAlpha: 0 });
  gsap.set(one('route'), { strokeDashoffset: 1 });
  gsap.set(one('sold-check'), { strokeDashoffset: 1 });

  const captionIn = (i: number, at: number) => tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at);
  const captionOut = (i: number, at: number) => tl.to(captions[i], { autoAlpha: 0, y: -18, duration: 0.35, ease: 'power2.in' }, at);
  const cardIn = (el: HTMLElement, at: number) => tl.to(el, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, at);
  const cardOut = (el: HTMLElement, at: number) => tl.to(el, { autoAlpha: 0, y: -16, duration: 0.4, ease: 'power2.in' }, at);
  const press = (which: 'withdraw' | 'sell', on: number, off: number) => {
    tl.to(fills[which], { autoAlpha: 1, duration: 0.3 }, on);
    tl.to(labels[which], { color: '#120d02', duration: 0.3 }, on);
    tl.to(fills[which], { autoAlpha: 0, duration: 0.3 }, off);
    tl.to(labels[which], { color: GOLD.highlight, duration: 0.3 }, off);
  };

  // ============ 1. The piggy bank ============
  tl.to(S.pig, { rotY: -0.55, duration: 3.2, ease: 'power1.inOut' }, 0);
  tl.to(S.cam, { z: 8.4, y: 0.75, duration: 3, ease: 'power2.inOut' }, 0);
  tl.to(S.sheen, { v: 1, duration: 2.2, ease: 'power1.inOut' }, 0.4);
  // It steps aside to make room
  tl.to(S.pig, narrow ? { sy: 0.4, duration: 1, ease: 'power2.inOut' } : { sx: 0.64, duration: 1, ease: 'power2.inOut' }, 2.4);
  captionOut(0, 2.9);

  // ============ 2. Buying gold ============
  captionIn(1, 3.3);
  tl.to(S.deposits[0], { t: 1, duration: DEPOSITS[0].dur }, DEPOSITS[0].at);
  cardIn(txn, LANDINGS[0] + 0.05);
  tl.to(one('check'), { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, LANDINGS[0] + 0.3);
  cardOut(txn, 6.9);
  captionOut(1, 6.9);

  // ============ 3. The gold builds up ============
  captionIn(2, 7.3);
  cardIn(dash, 7.5);
  DEPOSITS.slice(1).forEach((d, i) => tl.to(S.deposits[i + 1], { t: 1, duration: d.dur }, d.at));
  tl.to(S.pig, { value: 1, duration: 3.6, ease: 'power1.inOut' }, 7.4);
  tl.to(S.count, { v: 1, duration: 3.2, ease: 'power1.inOut' }, 7.7);
  tl.to(one('chart-line'), { strokeDashoffset: 0, duration: 2.6, ease: 'power1.inOut' }, 8);
  tl.to(one('chart-area'), { autoAlpha: 1, duration: 1.2 }, 9.4);
  tl.to(S.sheen, { v: -1, duration: 1.8, ease: 'power1.inOut' }, 9.6);
  cardOut(dash, 11.7);
  captionOut(2, 11.7);

  // ============ 4. Your gold, your control ============
  captionIn(3, 12.1);
  tl.to(S.pig, narrow ? { sy: 0.28, z: -6, rotY: -1.0, duration: 1.3, ease: 'power2.inOut' } : { sx: 0.72, sy: 0.36, z: -7, rotY: -1.0, duration: 1.3, ease: 'power2.inOut' }, 12);
  tl.to(S.emerge, { t: 1, duration: 2.2 }, 12.4);
  tl.to(portfolio, { autoAlpha: 1, duration: 0.01 }, 14.1);
  tl.to(portfolio, { clipPath: 'circle(75% at 50% 50%)', duration: 0.6, ease: 'power2.out' }, 14.1);
  captionOut(3, 15.3);

  // ============ 5. Withdraw ============
  captionIn(4, 15.7);
  press('withdraw', 15.8, 20.1);
  tl.to(S.withdraw, { coin: 1, duration: 1.1 }, 16);
  if (narrow) tl.to(portfolio, { autoAlpha: 0, duration: 0.4 }, 16.4);
  cardIn(withdrawCard, 16.5);
  tl.to(S.withdraw, { morph: 1, duration: 0.9, ease: 'power1.inOut' }, 17.1);
  tl.to(S.withdraw, { pack: 1, duration: 0.5 }, 17.6);
  tl.to(S.withdraw, { drop: 1, duration: 0.6 }, 18.1);
  tl.to(S.withdraw, { lid: 1, duration: 0.45 }, 18.7);
  tl.to(one('route'), { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut' }, 18.9);
  tl.to(S.withdraw, { away: 1, duration: 1.1, ease: 'power1.in' }, 19.2);
  cardOut(withdrawCard, 20.1);
  captionOut(4, 20.1);

  // ============ 6. Sell ============
  captionIn(5, 20.5);
  if (narrow) tl.to(portfolio, { autoAlpha: 1, duration: 0.4 }, 20.3);
  press('sell', 20.6, 24.3);
  tl.to(S.sell, { coin: 1, duration: 1.1 }, 20.8);
  if (narrow) tl.to(portfolio, { autoAlpha: 0, duration: 0.4 }, 21.4);
  tl.to(S.sell, { burst: 1, duration: 1.3 }, 22);
  cardIn(sold, 23.2);
  tl.to(one('sold-check'), { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, 23.6);
  tl.to(S.sell, { fade: 1, duration: 0.5 }, 23.8);
  cardOut(sold, 24.3);
  captionOut(5, 24.3);

  // ============ The whole journey ============
  tl.to(S.pig, { sx: 0.5, sy: narrow ? 0.5 : 0.58, z: 0, rotY: -1.18, value: 1, duration: 1.8, ease: 'power2.inOut' }, 24.6);
  tl.to(portfolio, narrow ? { autoAlpha: 0, duration: 0.01 } : { autoAlpha: 0.22, scale: 0.92, duration: 1.2, ease: 'power2.inOut' }, 24.6);
  captionIn(6, 25);
  tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 25.4);
  tl.to(S.orbit, { v: 1, duration: 1.4, ease: 'power1.out' }, 25.1);
  tl.to(S.orbit, { spin: 1, duration: 3.9 }, 25.1);
  tl.to(S.cam, { z: 10.8, y: 0.6, duration: 3.4, ease: 'power1.inOut' }, 25.4);
  tl.to(S.sheen, { v: 1, duration: 1.6, ease: 'power1.inOut' }, 27.2);
  tl.to({}, { duration: 0.01 }, 29);

  // Numbers on the cards that count up
  const balance = one('dash-grams');
  const value = one('dash-value');
  const sync = () => {
    balance.textContent = `${(PORTFOLIO.grams * S.count.v).toFixed(3)} g`;
    value.textContent = inr(PORTFOLIO.value * S.count.v);
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

export default function SafeGoldSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GoldState>(createState());
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
        const state = createState();
        stateRef.current = state;
        context = gsap.context(() => {
          const tl = buildTimeline(section, state, narrowRef.current);
          const onUpdate = tl.eventCallback('onUpdate') as () => void;
          tl.eventCallback('onUpdate', () => {
            onUpdate();
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
        cam: S.cam,
        pig: S.pig,
        sheen: S.sheen.v,
        deposits: S.deposits.map((d) => d.t),
        landings: LANDINGS,
        emerge: S.emerge.t,
        withdraw: S.withdraw,
        sell: S.sell,
        orbit: S.orbit.v,
        orbitSpin: S.orbit.spin,
        anchors: {
          portfolio: centerOf(section.querySelector('[data-g="portfolio"]'), origin),
          withdraw: centerOf(section.querySelector('[data-g="btn-withdraw"]'), origin),
          sell: centerOf(section.querySelector('[data-g="btn-sell"]'), origin),
          rupee: { x: origin.width * 0.47, y: origin.height * (narrow ? 0.36 : 0.5) },
          bench: { x: origin.width * 0.47, y: origin.height * (narrow ? 0.42 : 0.58) },
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

        {/* Headlines */}
        <div className="absolute inset-x-0 top-6 sm:top-8 md:top-4 z-20 px-4 pointer-events-none">
          <div className="relative mx-auto max-w-3xl">
            {SCENES.map((scene, i) => (
              <div key={scene.title} data-g="caption" className="absolute inset-x-0 top-0 text-center">
                <h2 className="text-[26px] sm:text-5xl font-semibold text-[#F5F5F5] tracking-tight leading-[1.2] mt-1">{scene.title}</h2>
                <p className="mx-auto max-w-xl text-sm sm:text-base text-[#A3A3A3] tracking-tight mt-2">{scene.body}</p>
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

        {/* Cards beside the piggy bank (left on desktop, below it on phones) */}
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
          </div>
        </div>

        {/* Cards on the right on desktop, below the scene on phones */}
        <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 w-[min(340px,calc(100%-32px))] md:bottom-auto md:left-auto md:translate-x-0 md:right-[5%] md:top-1/2 md:-translate-y-1/2 md:w-[300px] pointer-events-none">
          <div className="relative">
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
