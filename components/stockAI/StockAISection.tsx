'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { BLUE, COLLECTIONS, GREEN, POPULAR, REPORT_TABS, STOCK, SWINGS } from './data';
import { CARD, Mark, Tilt } from './ui';
import { Collection, ExploreHeader, MarketPulse, Popular, Recent, SearchPanel } from './explore';
import { FinancialsPanel, FundamentalsPanel, PerformancePanel, PricePanel, ShareholdingPanel, WatchlistPanel } from './detail';
import { DeckCards } from './deck';
import { ReportPanel } from './report';
import { CrystalMark } from './AiCore';
import type { Ticker } from './aiCoreScene';
import IntroHero, { Gradient } from '../IntroHero';
import { glideBetweenLabels, pinned, usePointerVars } from '../scrollSteps';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Stock Analysis & AI, the first section of the Features page, told in five parts:
//   the AI core: the app's crystal in 3D, with the market circling it
//   Explore (pinned): the Explore tab's cards as a tilted 3D wall that settles flat, then a search
//     for "hindu" that finds Hindustan Unilever
//   a stock's page: its panels flip up as they scroll in, and they work (timeframes, quarterly or
//     yearly, filings, watchlist)
//   the AI analysis (pinned): the six questions as a 3D deck of cards, answered one per scroll,
//     ending with the AI core spinning up to write the report
//   the report: all six tabs, turning in 3D, playing through on their own or tapped
// Everything shown is the app's own UI, with illustrative figures.

const EYEBROW = 'text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500';

const HERO_TICKERS: Ticker[] = [
  { name: 'NIFTY 50', value: '24,979.00', change: '-7.40 (-0.03%)', up: false },
  { name: 'HINDUNILVR', value: '₹1,999.80', change: '+0.14%', up: true },
  { name: 'SENSEX', value: '80,973.70', change: '-25.70 (-0.03%)', up: false },
  { name: 'HDFCBANK', value: '₹1,004.60', change: '+1.65%', up: true },
  { name: 'NIFTY BANK', value: '59,390.90', change: '+540.25 (+0.92%)', up: true },
  { name: 'TCS', value: '₹3,071.40', change: '-0.93%', up: false },
  { name: 'RELIANCE', value: '₹1,412.30', change: '-0.82%', up: false },
  { name: 'INFY', value: '₹1,472.90', change: '-1.74%', up: false },
];

export default function StockAISection() {
  return (
    <div id="stock-ai" className="relative w-full bg-black text-[#F5F5F5]">
      <Hero />
      <ExploreAct />
      <StockStage />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The AI core. On arrival it plays an intro: the crystal appears alone in the middle, the market's
// cards fly out of it into orbit, then the whole core glides over to its place on the right and
// the words type themselves in beside it.
const HERO_PILLS: [string, string][] = [
  ['6,000+', 'stocks to explore'],
  ['Live', 'NSE / BSE prices'],
  ['6 questions', 'one AI report'],
];

function Hero() {
  return (
    <IntroHero
      label="Stock Analysis and AI"
      eyebrow="Stock Analysis Planner · AI"
      title={
        <>
          Know a stock <Gradient>before</Gradient> you buy it.
        </>
      }
      body="Explore 6,000+ NSE and BSE stocks, read every number on one page, then let the AI weigh it all against your money, your timeline and your goal."
      pills={HERO_PILLS}
      tickers={HERO_TICKERS}
    />
  );
}

// ---------------------------------------------------------------------------------------------
// Explore
const EXPLORE_CAPTIONS = [
  { title: 'The whole market, in one tab.', body: 'Live indices, what you looked at last, curated collections and the NIFTY leaders.' },
  { title: 'Live, while you look.', body: 'Market Pulse ticks with NSE and BSE. Collections spot the movers for you.' },
  { title: 'Find any stock in a keystroke.', body: 'Search 6,000+ stocks by name or symbol.' },
  { title: 'Then open it up.', body: 'Pick a result and everything about it is one tap away.' },
];

function ExploreAct() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  usePointerVars(sectionRef);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-e="${k}"]`));
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [fit] = q('fit');
      const [tilt] = q('tilt');
      const [spin] = q('spin');
      const tiles = q('tile');
      const [search] = q('search');
      const [typed] = q('typed');
      const [count] = q('count');
      const results = q('result');
      const pick = results.find((r) => r.dataset.pick !== undefined)!;
      const captions = q('caption');
      const scaleFit = () => Math.min(1, (stage.clientWidth * 0.96) / fit.offsetWidth, (stage.clientHeight * 0.96) / fit.offsetHeight);

      gsap.set(fit, { xPercent: -50, yPercent: -50, scale: () => scaleFit() * 0.74 });
      gsap.set(tilt, { rotationX: 52 });
      gsap.set(spin, { rotation: -30 });
      tiles.forEach((t) => gsap.set(t, { z: Number(t.dataset.z) }));
      gsap.set(search, { xPercent: -50, yPercent: -50, z: 520, y: 80, autoAlpha: 0 });
      gsap.set([count, ...results], { autoAlpha: 0, y: 12 });
      gsap.set(captions, { autoAlpha: 0, y: 14 });
      gsap.set(captions[0], { autoAlpha: 1, y: 0 });
      const text = { n: 0 };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => {
          typed.textContent = 'hindu'.slice(0, Math.round(text.n));
        },
        scrollTrigger: pinned(section, EXPLORE_CAPTIONS.length - 1, 10),
      });
      const caption = (k: number, at: number) => {
        tl.to(captions[k - 1], { autoAlpha: 0, y: -14, duration: 0.2 }, at);
        tl.to(captions[k], { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.12);
      };
      tl.addLabel('wall', 0);

      // 1. The wall swings flat to face you, and its cards settle into it
      caption(1, 0.05);
      tl.to(tilt, { rotationX: 0, duration: 0.8, ease: 'power2.inOut' }, 0.05);
      tl.to(spin, { rotation: 0, duration: 0.8, ease: 'power2.inOut' }, 0.05);
      tl.to(fit, { scale: () => scaleFit(), duration: 0.8, ease: 'power2.inOut' }, 0.05);
      tl.to(tiles, { z: 0, duration: 0.6, ease: 'power2.out', stagger: 0.025 }, 0.2);
      tl.addLabel('flat', 1);

      // 2. It falls back, and the search flies in to the front and is typed into
      caption(2, 1.05);
      tl.to(fit, { z: -520, autoAlpha: 0.3, duration: 0.5, ease: 'power2.inOut' }, 1.05);
      tl.to(search, { z: 0, y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' }, 1.15);
      tl.to(text, { n: 5, duration: 0.3, ease: 'steps(5)' }, 1.5);
      tl.to(count, { autoAlpha: 1, y: 0, duration: 0.15 }, 1.8);
      tl.to(results, { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.05, ease: 'power2.out' }, 1.82);
      tl.addLabel('search', 2);

      // 3. Hindustan Unilever is picked: it lifts out of the list
      caption(3, 2.05);
      tl.to(results.filter((r) => r !== pick), { autoAlpha: 0.3, duration: 0.25 }, 2.1);
      tl.to(pick, { scale: 1.05, z: 60, borderColor: '#6E5BFF', backgroundColor: '#211d3d', boxShadow: '0 0 0 3px rgba(110,91,255,0.35), 0 24px 48px -10px rgba(110,91,255,0.55)', duration: 0.3, ease: 'back.out(2)' }, 2.15);
      tl.to(search, { rotationX: 8, rotationY: -10, duration: 0.6, ease: 'power2.inOut' }, 2.2);
      tl.addLabel('open', 3);
      tl.set({}, {}, 3); // the timeline ends on its last label
      const unglide = glideBetweenLabels(tl);
      ScrollTrigger.sort();
      return unglide;
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} aria-label="Explore stocks" className="relative flex h-[calc(100svh-72px)] w-full flex-col overflow-hidden select-none motion-reduce:h-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_60%,rgba(110,91,255,0.08),transparent_70%)]" />
      <div className="relative z-30 shrink-0 px-4 pt-6 text-center sm:pt-8">
        <p className={EYEBROW}>01 · Explore</p>
        <div className="relative mx-auto mt-2 min-h-[68px] max-w-3xl sm:min-h-[104px]">
          {EXPLORE_CAPTIONS.map((c, i) => (
            <div key={c.title} data-e="caption" className={`absolute inset-x-0 top-0 ${i ? 'motion-reduce:hidden' : ''}`}>
              <h2 className="text-xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{c.title}</h2>
              <p className="mt-1 text-xs text-neutral-400 sm:mt-2 sm:text-base">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div ref={stageRef} className="relative min-h-0 flex-1 [perspective:1600px] motion-reduce:min-h-[760px]">
        <div
          className="absolute inset-0 [transform-style:preserve-3d]"
          style={{ transform: 'rotateX(calc(var(--py, 0) * -4deg)) rotateY(calc(var(--px, 0) * 6deg))' }}
        >
          <div data-e="fit" className="absolute left-1/2 top-1/2 w-[380px] [transform-style:preserve-3d] md:w-[1080px] motion-reduce:-translate-x-1/2 motion-reduce:-translate-y-1/2 motion-reduce:scale-[0.8]">
            <div data-e="tilt" className="[transform-style:preserve-3d]">
              <div data-e="spin" className="grid grid-cols-2 gap-3 [transform-style:preserve-3d] md:grid-cols-4 md:gap-4">
                <div data-e="tile" data-z="60" className={`${CARD} col-span-2 h-[176px] md:col-span-4 md:h-[176px]`}>
                  <ExploreHeader />
                </div>
                <div data-e="tile" data-z="130" className={`${CARD} col-span-2 h-[160px] md:h-[170px]`}>
                  <MarketPulse />
                </div>
                <div data-e="tile" data-z="90" className={`${CARD} col-span-2 hidden h-[170px] md:block`}>
                  <Recent />
                </div>
                {COLLECTIONS.map((c, i) => (
                  <div key={c.title} data-e="tile" data-z={[180, 110, 160, 80][i]} className={`${CARD} h-[190px] md:h-[210px]`}>
                    <Collection c={c} />
                  </div>
                ))}
                {POPULAR.map((p, i) => (
                  <div key={p.symbol} data-e="tile" data-z={[70, 140, 100, 50][i]} className={`${CARD} hidden h-[150px] md:block`}>
                    <Popular p={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div data-e="search" className="absolute left-1/2 top-1/2 w-[min(520px,92vw)] motion-reduce:hidden">
            <SearchPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// One pinned section for everything after Explore. The header stays put and each scroll changes
// what's under it, in place:
//   a stock's page: its panels, two at a time (one on phones), turning over in 3D
//   the AI analysis: the six questions as a 3D deck of cards, ending with the AI core spinning up
//   the report: all six tabs, turning in 3D, playing through on their own or tapped
const PANELS: { key: string; render: (run: boolean) => React.ReactNode }[] = [
  { key: 'price', render: (run) => <PricePanel run={run} /> },
  { key: 'performance', render: (run) => <PerformancePanel run={run} /> },
  { key: 'financials', render: () => <FinancialsPanel /> },
  { key: 'fundamentals', render: () => <FundamentalsPanel /> },
  { key: 'shareholding', render: () => <ShareholdingPanel /> },
  { key: 'watchlist', render: () => <WatchlistPanel /> },
];
const CHAPTERS = [
  { eyebrow: '02 · Every stock’s page', title: 'Every number, on one page.', body: 'Price and chart, the day’s range, revenue and profit, fundamentals and who owns it. Try the timeframes, quarters and filings.' },
  { eyebrow: '03 · AI Analysis', title: 'Now ask the AI.', body: 'Six quick questions turn a stock’s numbers into a report about you and your money.' },
  { eyebrow: '04 · The AI report', title: 'A report written for you.', body: 'A score out of 10 and your goal fit, then volatility, consistency, downside risk, a SWOT and ownership. Tap through, or let it play.' },
];
const ANSWERS = [
  { label: 'Watchlist', color: BLUE },
  { label: '₹15,000', color: GREEN },
  { label: 'Less than 1 year', color: GREEN },
  { label: 'Moderate', color: '#F5A524' },
];
const DECK_W = 440;
const DECK_H = 610;
const DECK_STEPS = 6;
// Scroll per step, as a share of the screen's height
const STAGE_STEP = 0.55;

const tint = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// The six questions, answered one per step from time 0 (card 1 up) to 6 (the report being written)
function buildDeck(root: HTMLElement, stage: HTMLElement, energyRef: React.MutableRefObject<number>) {
  const q = (k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-s="${k}"]`));
  const one = (k: string) => q(k)[0];
  const fit = one('fit');
  const cards = q('card');
  const segs = q('seg');
  const chips = q('chip');
  const stepText = one('step');
  const scaleFit = () => Math.min(1, (stage.clientWidth * 0.94) / DECK_W, (stage.clientHeight * 0.96) / (DECK_H + 70));
  const pose = (d: number) =>
    d < 0
      ? { y: -420, z: 260, rotationX: 50, scale: 1, autoAlpha: 0, filter: 'brightness(1)' }
      : { y: -d * 32, z: -d * 120, rotationX: 0, scale: 1 - d * 0.04, autoAlpha: d > 2 ? 0 : 1, filter: `brightness(${1 - d * 0.28})` };

  gsap.set(fit, { xPercent: -50, yPercent: -50, scale: scaleFit, y: 22 });
  cards.forEach((c, k) => gsap.set(c, { ...pose(k), transformPerspective: 1600, transformOrigin: '50% 100%' }));
  gsap.set(segs, { scaleX: 0, transformOrigin: 'left' });
  gsap.set(segs[0], { scaleX: 1 });
  gsap.set(chips, { autoAlpha: 0, scale: 0.6 });

  const amount = { v: 1000 };
  const swing = { p: 5 };
  const energy = { v: 0 };
  const amountEl = one('amount');
  const fill = one('amount-fill');
  const knob = one('amount-knob');
  const low = one('swing-low');
  const high = one('swing-high');
  const stages = q('stage');
  const swingG = one('swing-g');
  const dotLow = one('swing-dot-low');
  const dotHigh = one('swing-dot-high');
  const render = () => {
    const rounded = Math.round(amount.v / 50) * 50;
    amountEl.textContent = rounded >= 1000 ? rounded.toLocaleString('en-IN') : '1,000';
    const f = Math.log(amount.v / 1000) / Math.log(1000);
    fill.style.transform = `scaleX(${f})`;
    knob.style.left = `${f * 100}%`;
    const r = (15000 * swing.p) / 100;
    low.textContent = `₹${Math.round(15000 - r).toLocaleString('en-IN')}`;
    high.textContent = `₹${Math.round(15000 + r).toLocaleString('en-IN')}`;
    // The line stretches with the swing picked: ±15% fills the chart
    const k = swing.p / 15;
    swingG.setAttribute('transform', `scale(1 ${k.toFixed(3)})`);
    dotLow.setAttribute('cy', (34 * k).toFixed(2));
    dotHigh.setAttribute('cy', (-34 * k).toFixed(2));
    energyRef.current = energy.v;
    const step = Math.max(0, Math.min(DECK_STEPS, Math.round(tl.time())));
    stepText.textContent = step < DECK_STEPS ? `Step ${step + 1} of 6` : 'Writing your report';
  };

  const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: render });
  const pick = (el: Element, color: string, at: number, extra: gsap.TweenVars = {}) =>
    tl.to(el, { borderColor: color, backgroundColor: tint(color, 0.12), scale: 1.04, boxShadow: `0 0 0 1px ${color}, 0 18px 40px -12px ${tint(color, 0.65)}`, duration: 0.22, ease: 'back.out(2)', ...extra }, at);
  const unpick = (el: Element, at: number) => tl.to(el, { borderColor: 'rgba(255,255,255,0.09)', backgroundColor: '#1a1a1d', scale: 1, boxShadow: '0 0 0 0px rgba(0,0,0,0), 0 0 0 0px rgba(0,0,0,0)', duration: 0.18 }, at);
  const chipIn = (k: number, at: number) => tl.to(chips[k], { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'back.out(2.5)' }, at);

  for (let i = 1; i <= DECK_STEPS; i++) {
    const at = i - 1 + 0.05;
    cards.forEach((c, k) => tl.to(c, { ...pose(k - i), duration: 0.45, ease: 'power3.inOut' }, at));
    if (segs[i]) tl.to(segs[i], { scaleX: 1, duration: 0.3, ease: 'power2.out' }, at + 0.1);
  }
  // 1. On my watchlist
  pick(one('own-pick'), BLUE, 0.55);
  chipIn(0, 0.75);
  // 2. ₹15,000
  tl.to(amount, { v: 15000, duration: 0.4, ease: 'power2.out' }, 1.5);
  tl.to(one('amount-note'), { opacity: 1, duration: 0.2 }, 1.85);
  chipIn(1, 1.9);
  // 3. Under a year
  pick(one('horizon-pick'), GREEN, 2.55, { backgroundColor: GREEN, color: '#06281b', scale: 1.18 });
  chipIn(2, 2.8);
  // 4. Low, then Moderate: the line stretches to ±15%
  const opts = q('swing-opt');
  pick(opts[0], SWINGS[0].color, 3.5);
  unpick(opts[0], 3.7);
  pick(opts[1], SWINGS[1].color, 3.7);
  tl.to(swing, { p: 15, duration: 0.3, ease: 'power2.inOut' }, 3.7);
  chipIn(3, 3.9);
  // 5. Grow my wealth, and Generate
  pick(one('goal-pick'), GREEN, 4.5);
  tl.to(one('goal-note'), { opacity: 1, duration: 0.2 }, 4.65);
  tl.to(one('generate'), { scale: 0.95, filter: 'brightness(1.3)', duration: 0.06 }, 4.85);
  tl.to(one('generate'), { scale: 1, filter: 'brightness(1)', duration: 0.1 }, 4.92);
  // 6. The AI core spins up while the report is written
  tl.to(energy, { v: 1, duration: 0.6, ease: 'power1.in' }, 5.3);
  tl.to(one('progress'), { scaleX: 1, duration: 0.65, ease: 'power1.inOut' }, 5.3);
  tl.to(stages[0], { opacity: 0, duration: 0.08 }, 5.5);
  tl.to(stages[1], { opacity: 1, duration: 0.08 }, 5.52);
  tl.to(stages[1], { opacity: 0, duration: 0.08 }, 5.74);
  tl.to(stages[2], { opacity: 1, duration: 0.08 }, 5.76);
  tl.set({}, {}, DECK_STEPS);
  render();
  return tl;
}

function StockStage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pageStageRef = useRef<HTMLDivElement | null>(null);
  const deckStageRef = useRef<HTMLDivElement | null>(null);
  const energyRef = useRef(0);
  // How many panels have come up (their charts draw and count as they do), and whether the report
  // is the one showing (its tabs only play through then)
  const [reached, setReached] = useState(0);
  const [reportOn, setReportOn] = useState(false);
  usePointerVars(sectionRef);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pageStage = pageStageRef.current;
    const deckStage = deckStageRef.current;
    if (!section || !pageStage || !deckStage) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-x="${k}"]`));
    const mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 768px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
      const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
      if (!motion) {
        setReached(PANELS.length);
        setReportOn(true);
        return;
      }
      const per = wide ? 2 : 1;
      const pages = Math.ceil(PANELS.length / per);
      const [fit] = q('fit');
      const slots = q('slot');
      const heads = q('head');
      const [layerB] = q('layer-deck');
      const [layerC] = q('layer-report');
      const pageSlots = (k: number) => slots.slice(k * per, k * per + per);
      const scaleFit = () => Math.min(1, (pageStage.clientWidth * 0.96) / fit.offsetWidth, (pageStage.clientHeight * 0.96) / fit.offsetHeight);
      const ACTIVE = { y: 0, z: 0, rotationX: 0, autoAlpha: 1 };
      const PAST = { y: -260, z: 180, rotationX: 40, autoAlpha: 0 };
      const FUTURE = { y: 240, z: -220, rotationX: -25, autoAlpha: 0 };

      gsap.set(fit, { xPercent: -50, yPercent: -50, scale: scaleFit });
      slots.forEach((el, i) => gsap.set(el, { ...(i < per ? ACTIVE : FUTURE), transformPerspective: 1400, transformOrigin: '50% 50%' }));
      gsap.set(heads, { autoAlpha: 0, y: 14 });
      gsap.set(heads[0], { autoAlpha: 1, y: 0 });
      gsap.set([layerB, layerC], { autoAlpha: 0 });

      const deckStart = pages;
      const reportAt = deckStart + DECK_STEPS + 1;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => {
          const t = tl.time();
          const page = Math.min(pages - 1, Math.floor(t + 0.5));
          setReached((r) => Math.max(r, (page + 1) * per));
          setReportOn(t > reportAt - 0.5);
        },
        scrollTrigger: { ...pinned(section, reportAt, 9), end: () => `+=${window.innerHeight * STAGE_STEP * reportAt}` },
      });
      const head = (k: number, at: number) => {
        tl.to(heads[k - 1], { autoAlpha: 0, y: -14, duration: 0.2 }, at);
        tl.to(heads[k], { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.12);
      };
      tl.addLabel('page0', 0);

      // The panels turn over, page by page
      for (let k = 1; k < pages; k++) {
        const at = k - 1 + 0.05;
        tl.to(pageSlots(k - 1), { ...PAST, duration: 0.45, ease: 'power2.in', stagger: 0.05 }, at);
        tl.to(pageSlots(k), { ...ACTIVE, duration: 0.55, ease: 'power3.out', stagger: 0.07 }, at + 0.15);
        tl.addLabel(`page${k}`, k);
      }

      // Into the AI analysis: the last page flips away and the deck rises in
      const intoDeck = deckStart - 1 + 0.05;
      head(1, intoDeck);
      tl.to(pageSlots(pages - 1), { ...PAST, duration: 0.45, ease: 'power2.in', stagger: 0.05 }, intoDeck);
      tl.fromTo(layerB, { autoAlpha: 0, y: 90, rotationX: -14, transformPerspective: 1400 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }, intoDeck + 0.2);
      tl.add(buildDeck(layerB, deckStage, energyRef), deckStart);
      for (let i = 0; i <= DECK_STEPS; i++) tl.addLabel(`deck${i}`, deckStart + i);

      // Into the report
      const intoReport = reportAt - 1 + 0.05;
      head(2, intoReport);
      tl.to(layerB, { autoAlpha: 0, y: -70, scale: 0.94, duration: 0.4, ease: 'power2.in' }, intoReport);
      tl.fromTo(layerC, { autoAlpha: 0, y: 90, rotationX: -12, transformPerspective: 1400 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }, intoReport + 0.2);
      tl.addLabel('report', reportAt);
      tl.set({}, {}, reportAt);

      const unglide = glideBetweenLabels(tl);
      ScrollTrigger.sort();
      return unglide;
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="stock-ai-analysis" aria-label="A stock's page and its AI analysis" className="relative flex h-[calc(100svh-72px)] w-full flex-col overflow-hidden select-none motion-reduce:h-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_60%,rgba(110,91,255,0.1),transparent_70%)]" />

      {/* The header: one per part, swapped as the part changes */}
      <div className="relative z-30 shrink-0 px-4 pt-5 text-center sm:pt-7">
        <div className="relative mx-auto min-h-[58px] max-w-3xl sm:min-h-[136px] motion-reduce:min-h-0">
          {CHAPTERS.map((c, i) => (
            <div key={c.title} data-x="head" className={`absolute inset-x-0 top-0 ${i ? 'motion-reduce:hidden' : 'motion-reduce:static'}`}>
              <p className={EYEBROW}>{c.eyebrow}</p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight sm:mt-2 sm:text-4xl md:text-[44px]">{c.title}</h2>
              <p className="mx-auto mt-2 hidden max-w-2xl text-base text-neutral-400 sm:block">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 motion-reduce:flex-none">
        {/* A stock's page */}
        <div ref={pageStageRef} className="absolute inset-0 [perspective:1600px] motion-reduce:static">
          <div className="absolute inset-0 [transform-style:preserve-3d] motion-reduce:static" style={{ transform: 'rotateX(calc(var(--py, 0) * -3deg)) rotateY(calc(var(--px, 0) * 4deg))' }}>
            <div
              data-x="fit"
              className="absolute left-1/2 top-1/2 h-[640px] w-[400px] [transform-style:preserve-3d] md:h-[600px] md:w-[1100px] motion-reduce:static motion-reduce:mx-auto motion-reduce:grid motion-reduce:h-auto motion-reduce:max-w-6xl motion-reduce:w-auto motion-reduce:gap-4 motion-reduce:px-4 md:motion-reduce:grid-cols-2"
            >
              {PANELS.map((panel, i) => (
                <div
                  key={panel.key}
                  data-x="slot"
                  className={`absolute inset-0 ${i % 2 ? 'md:left-auto md:right-0 md:w-[calc(41.667%-8px)]' : 'md:right-auto md:w-[calc(58.333%-8px)]'} motion-reduce:relative motion-reduce:w-auto`}
                >
                  <div className={`sa-scope ${i < reached ? 'sa-in' : ''} h-full`}>
                    <Tilt className={`${CARD} h-full overflow-hidden`} max={4}>
                      {panel.render(i < reached)}
                    </Tilt>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The AI analysis */}
        <div data-x="layer-deck" className="absolute inset-0 motion-reduce:hidden">
          <div className="mx-auto flex h-full max-w-6xl flex-col gap-3 px-4 pb-4 sm:px-6 md:flex-row md:items-center md:gap-10">
            <div className="relative z-20 shrink-0 md:w-[40%]">
              <div className="rounded-2xl border border-white/[0.07] bg-[#141416]/80 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Mark symbol="HINDUNILVR" size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{STOCK.name}</p>
                    <p className="truncate text-[12px] text-[#8b8b94]">{STOCK.symbol} • FMCG &amp; Consumer Goods</p>
                  </div>
                  <span className="text-[13px] font-semibold text-[#a1a1aa]">Change</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <p className="text-[15px] font-semibold">Stock Analysis</p>
                  <p data-s="step" className="text-[12px] text-[#8b8b94]">
                    Step 1 of 6
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 6 }, (_, i) => (
                    <span key={i} className="h-1.5 overflow-hidden rounded-full bg-[#2a2a2f]">
                      <span data-s="seg" className="block h-full w-full rounded-full bg-[#6E5BFF]" />
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex min-h-[30px] flex-wrap gap-1.5">
                  {ANSWERS.map((a) => (
                    <span key={a.label} data-s="chip" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#1c1c20] px-2.5 py-1 text-[12px] font-semibold">
                      <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div ref={deckStageRef} className="relative min-h-0 flex-1 self-stretch [perspective:1600px]">
              <div className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: 'rotateX(calc(var(--py, 0) * -3deg)) rotateY(calc(var(--px, 0) * 5deg))' }}>
                <div data-s="fit" className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]" style={{ width: DECK_W, height: DECK_H }}>
                  {DeckCards({ energyRef }).map((card, k) => (
                    <div key={k} data-s="card" className="absolute inset-0">
                      {card}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The report */}
        <div data-x="layer-report" className="absolute inset-0 px-3 pb-4 sm:px-6 motion-reduce:relative motion-reduce:mt-12">
          <ReportFrame active={reportOn} />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// The report: a fixed frame whose tab panel scrolls on its own if it's taller than the screen
const TAB_MS = 7000;

function ReportFrame({ active }: { active: boolean }) {
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(true);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const playing = auto && active;

  useEffect(() => {
    if (!playing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setTab((t) => (t + 1) % REPORT_TABS.length), TAB_MS);
    return () => window.clearTimeout(id);
  }, [playing, tab]);

  // Keep the open tab in view in the tab bar, and start each tab at its top
  useEffect(() => {
    const bar = tabsRef.current;
    const el = bar?.children[tab] as HTMLElement | undefined;
    if (bar && el) bar.scrollTo({ left: el.offsetLeft - bar.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    bodyRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <div className="relative mx-auto flex h-full max-w-6xl flex-col rounded-[28px] border border-white/[0.08] bg-[#111113] p-3 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)] sm:p-5 motion-reduce:h-auto">
      <div className="sa-float pointer-events-none absolute -right-2 -top-8 hidden h-16 w-14 opacity-80 md:block">
        <CrystalMark className="h-full w-full drop-shadow-[0_0_18px_rgba(110,91,255,0.8)]" />
      </div>
      <div className="flex shrink-0 items-center gap-3 px-2 pt-1">
        <span className="text-xl text-white">‹</span>
        <p className="flex-1 truncate text-lg font-semibold sm:text-2xl">{STOCK.name} Report</p>
        <button type="button" onClick={() => setTab(0)} aria-label="Back to the overview" className="text-[#8b8b94] transition-transform hover:rotate-180 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />
          </svg>
        </button>
      </div>
      <div ref={tabsRef} role="tablist" aria-label="Report sections" className="no-scrollbar mt-3 flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.08]">
        {REPORT_TABS.map((t, i) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={i === tab}
            onClick={() => {
              setAuto(false);
              setTab(i);
            }}
            className={`relative shrink-0 px-3 pb-3 pt-1 text-[15px] font-semibold transition-colors sm:px-5 sm:text-[17px] ${i === tab ? 'text-white' : 'text-[#6f6f78] hover:text-[#bdbdc4]'}`}
          >
            {t}
            <span className={`absolute inset-x-2 -bottom-px h-[3px] overflow-hidden rounded-full ${i === tab ? 'bg-[#6E5BFF]/30' : ''}`}>
              {i === tab && (
                <span
                  key={`${tab}-${playing}`}
                  className="block h-full rounded-full bg-[#6E5BFF]"
                  style={playing ? { animation: `sa-grow-x ${TAB_MS}ms linear both`, transformOrigin: 'left', transform: 'scaleX(1)' } : undefined}
                />
              )}
            </span>
          </button>
        ))}
      </div>
      <div ref={bodyRef} className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto [perspective:1400px]" role="tabpanel" aria-label={REPORT_TABS[tab]}>
        <div key={tab} className="sa-scope sa-in sa-turn">
          <ReportPanel tab={tab} />
        </div>
        <div className="mt-4 flex gap-3 rounded-2xl border border-white/[0.07] bg-[#141416] p-4 text-[12px] leading-relaxed text-[#8b8b94]">
          <span className="text-[#facc15]">⚠</span>
          <p>
            Stock investments are subject to market risks. The swings shown illustrate your own risk tolerance; they are not forecasts of gains or losses. Real-time metrics and AI analysis are for
            educational purposes only, not financial advice. Figures on this page are illustrative.
          </p>
        </div>
      </div>
    </div>
  );
}
