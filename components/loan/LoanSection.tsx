'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import type { CalculatorScene } from './calculatorScene';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Loan Planner, worked out on a desk calculator in the middle of the screen. One scroll each:
// the calculator comes in; a home loan is keyed in and its card slides out with the EMI; two more
// loans join and the display adds up the total EMI; a prepayment is keyed in and the years and
// the interest shrink; and "=" prints the whole summary out of the top, on a paper tape.
// All figures are illustrative, but they are real EMI arithmetic.

const BRAND = 'linear-gradient(120deg, #E86AB4 0%, #8B5CF6 55%, #6E5BFF 100%)';
const inr = (n: number) => Math.round(n).toLocaleString('en-IN');

const LOANS = [
  { kind: 'home', name: 'Home loan', detail: '₹25,00,000 · 8.5% · 20 yrs', emi: 21696, color: '#6E5BFF' },
  { kind: 'car', name: 'Car loan', detail: '₹8,00,000 · 9.2% · 5 yrs', emi: 16684, color: '#E86AB4' },
  { kind: 'education', name: 'Education loan', detail: '₹6,00,000 · 10% · 7 yrs', emi: 9961, color: '#F5A524' },
] as const;
const TOTAL_EMI = LOANS.reduce((t, l) => t + l.emi, 0); // 48,341
// The home loan with ₹5,000 a month extra: 240 months become 155, and this much interest goes
const PREPAY = { extra: 5000, monthsBefore: 240, monthsAfter: 155, interestBefore: 2706939, interestAfter: 1617579 };
const SAVED = PREPAY.interestBefore - PREPAY.interestAfter; // 10,89,360
const lakh = (n: number) => `₹${(n / 100000).toFixed(2)}L`;
const yearsMonths = (m: number) => `${Math.floor(m / 12)}Y ${String(Math.round(m) % 12).padStart(2, '0')}M`;

const CAPTIONS = [
  { title: 'Every loan, planned in one place.', body: 'Track your EMIs, see the interest you’ll pay, and find the fastest way out.' },
  { title: 'Add a loan.', body: 'Pick a type, enter the amount, rate and tenure. We work out the EMI.' },
  { title: 'Your total EMI.', body: 'Everything you pay towards loans each month, added up across all of them.' },
  { title: 'Close them faster.', body: 'Prepay a little each month, and watch years and lakhs of interest disappear.' },
  { title: 'The total summary.', body: 'Every loan, the interest and when you’ll be debt-free, on one page.' },
];

const KEYS = [
  ['AC', '%', '÷', '×'],
  ['7', '8', '9', '−'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '='],
  ['0', '00', '.', 'EMI'],
];

// What the display shows, in order. A typed value appears key by key; a counted one rolls between
// two numbers.
type Frame = { label: string; value: string; typed?: boolean };
const FRAMES: Frame[] = [
  { label: 'LOAN PLANNER', value: '0.' },
  { label: 'HOME LOAN · AMOUNT', value: '25,00,000', typed: true },
  { label: 'RATE · % P.A.', value: '8.5', typed: true },
  { label: 'TENURE · YEARS', value: '20', typed: true },
  { label: 'EMI / MONTH', value: inr(LOANS[0].emi) },
  { label: 'TOTAL EMI / MONTH', value: inr(LOANS[0].emi) },
  { label: `PREPAY +${inr(PREPAY.extra)} / MO`, value: yearsMonths(PREPAY.monthsBefore) },
  { label: 'PRINTING SUMMARY', value: inr(TOTAL_EMI) },
];

// The printed summary's lines, for the 3D receipt ('---' is a dashed rule)
const RECEIPT_LINES: [string, string, boolean?][] = [
  ...LOANS.map((l): [string, string] => [l.name, inr(l.emi)]),
  ['---', ''],
  ['TOTAL EMI / MO', `₹${inr(TOTAL_EMI)}`, true],
  ['INTEREST SAVED', lakh(SAVED)],
  ['HOME LOAN DONE', `${Math.floor(PREPAY.monthsAfter / 12)}y ${PREPAY.monthsAfter % 12}m`],
];

const CARD_W = 290;
const CARD_H = 76;
const PANEL_W = 290;

export default function LoanSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sceneHostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const qa = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-l="${k}"]`));
    const one = (k: string) => qa(k)[0];
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const place = one('place'); // positions and scales the calculator on the stage
      const entrance = one('entrance');
      const shadow = one('shadow');
      const captions = qa('caption');
      const frames = qa('frame');
      const values = qa('value');
      const cards = qa('card');
      const panel = one('panel');
      const paper = one('paper');
      const tape = one('tape');
      const key = (k: string) => section.querySelector<HTMLElement>(`[data-key="${CSS.escape(k)}"]`)!;

      // ---- Layout: measured from the stage, so it holds on any screen ----
      const narrow = () => stage.clientWidth < 768;
      const calcW = () => place.offsetWidth;
      const calcH = () => place.offsetHeight;
      const H = () => stage.clientHeight;
      const W = () => stage.clientWidth;
      // Where the calculator's centre sits (relative to the stage's centre)
      const restY = () => (narrow() ? calcH() / 2 + 8 - H() / 2 : 0);
      // For the summary it moves down (and on short screens shrinks) to make room for the tape above
      const paperH = () => paper.offsetHeight;
      const summaryScale = () => Math.min(1, (H() - 24) / (paperH() + calcH() + 12));
      const summaryY = () => H() / 2 - 8 - (calcH() * summaryScale()) / 2;
      // Cards and the prepayment panel: beside the calculator on wide screens, under it on phones
      const cardScale = () => {
        if (!narrow()) return Math.min(1, (W() / 2 - calcW() / 2 - 36) / (CARD_W + 12));
        const below = H() - (calcH() + 8) - 26;
        return Math.min(1, (W() - 24) / CARD_W, below / (LOANS.length * CARD_H + (LOANS.length - 1) * 10));
      };
      const cardRest = (k: number) => {
        const s = cardScale();
        if (narrow()) {
          const top = calcH() + 8 + 18;
          return { x: W() / 2, y: top + (CARD_H * s) / 2 + k * (CARD_H * s + 10), s };
        }
        const x = W() / 2 - calcW() / 2 - 40 - (CARD_W * s) / 2;
        return { x: Math.max((CARD_W * s) / 2 + 12, x), y: H() / 2 + (k - 1) * (CARD_H * s + 12), s };
      };
      const panelRest = () => {
        const s = cardScale();
        if (narrow()) return { x: W() / 2, y: calcH() + 8 + 18 + (panel.offsetHeight * s) / 2, s };
        const x = W() / 2 + calcW() / 2 + 40 + (PANEL_W * s) / 2;
        return { x: Math.min(W() - (PANEL_W * s) / 2 - 12, x), y: H() / 2, s };
      };
      // Cards slide out of the calculator's display
      const fromCalc = () => ({ x: W() / 2, y: H() / 2 + restY() - calcH() * 0.22 });

      // ---- Starting state ----
      gsap.set(place, { xPercent: -50, yPercent: -50, y: restY });
      gsap.set(entrance, { y: 240, rotateY: 55, rotateX: -18, scale: 0.75, autoAlpha: 0 });
      gsap.set(shadow, { opacity: 0, scale: 0.4 });
      gsap.set(captions, { autoAlpha: 0, y: 14 });
      gsap.set(captions[0], { autoAlpha: 1, y: 0 });
      gsap.set(frames, { autoAlpha: 0 });
      gsap.set(frames[0], { autoAlpha: 1 });
      gsap.set([...cards, panel], { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.2 });
      gsap.set(paper, { yPercent: 100 });
      gsap.set(tape, { autoAlpha: 0 });

      // Typed values and counters, written out on every update
      const typed = FRAMES.map((f) => ({ n: f.typed ? 0 : f.value.length }));
      const total = { v: LOANS[0].emi };
      const months = { v: PREPAY.monthsBefore };
      const interest = { v: 0 };
      const saved = one('saved');
      const bar = one('bar-after');
      const render = () => {
        FRAMES.forEach((f, k) => {
          if (f.typed) values[k].textContent = f.value.slice(0, Math.round(typed[k].n)) || '0';
        });
        values[5].textContent = inr(total.v);
        values[6].textContent = yearsMonths(months.v);
        saved.textContent = `₹${inr(SAVED * interest.v)}`;
        bar.style.transform = `scaleX(${1 - (1 - PREPAY.interestAfter / PREPAY.interestBefore) * interest.v})`;
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: render,
        scrollTrigger: {
          trigger: section,
          start: 'top 72px',
          end: () => `+=${window.innerHeight * 0.6 * CAPTIONS.length}`,
          pin: true,
          scrub: 0.8,
          refreshPriority: -2,
          invalidateOnRefresh: true,
        },
      });
      tl.addLabel('start', 0);

      let shown = 0;
      const show = (k: number, at: number) => {
        tl.set(frames[shown], { autoAlpha: 0 }, at);
        tl.set(frames[k], { autoAlpha: 1 }, at);
        shown = k;
      };
      const press = (k: string, at: number) => {
        const el = key(k);
        tl.to(el, { y: 3, scale: 0.95, filter: 'brightness(1.35)', duration: 0.04 }, at);
        tl.to(el, { y: 0, scale: 1, filter: 'brightness(1)', duration: 0.07 }, at + 0.045);
      };
      const type = (frame: number, keys: string[], at: number, step = 0.045) => {
        show(frame, at);
        keys.forEach((k, i) => press(k, at + i * step));
        tl.to(typed[frame], { n: FRAMES[frame].value.length, duration: keys.length * step, ease: `steps(${keys.length})` }, at);
        return at + keys.length * step;
      };
      const swapCaption = (k: number, at: number) => {
        tl.to(captions[k - 1], { autoAlpha: 0, y: -14, duration: 0.25 }, at);
        tl.to(captions[k], { autoAlpha: 1, y: 0, duration: 0.35 }, at + 0.15);
      };
      const cardOut = (k: number, at: number) => {
        tl.fromTo(
          cards[k],
          { x: () => fromCalc().x, y: () => fromCalc().y, scale: 0.2, autoAlpha: 0 },
          { x: () => cardRest(k).x, y: () => cardRest(k).y, scale: () => cardRest(k).s, autoAlpha: 1, duration: 0.3, ease: 'back.out(1.4)', immediateRender: false },
          at
        );
      };

      // ---- 1. The calculator comes in: it rises from below and swings round ----
      tl.to(entrance, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0);
      tl.to(entrance, { y: 0, rotateX: 0, scale: 1, duration: 0.85, ease: 'back.out(1.4)' }, 0);
      tl.to(entrance, { rotateY: 0, duration: 1, ease: 'power3.out' }, 0);
      tl.to(shadow, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 0.2);
      tl.addLabel('calculator', 1);

      // ---- 2. A home loan is keyed in, and "=" sends its card out with the EMI ----
      swapCaption(1, 1.02);
      let t = type(1, ['2', '5', '00', '00', '0'], 1.1);
      t = type(2, ['8', '.', '5'], t + 0.06);
      t = type(3, ['2', '0'], t + 0.06);
      press('=', t + 0.06);
      show(4, t + 0.1);
      cardOut(0, t + 0.12);
      tl.addLabel('add', 2);

      // ---- 3. Two more loans join, and the display adds them up ----
      swapCaption(2, 2.02);
      show(5, 2.1);
      press('+', 2.15);
      cardOut(1, 2.22);
      tl.to(total, { v: LOANS[0].emi + LOANS[1].emi, duration: 0.25, ease: 'power1.out' }, 2.25);
      press('+', 2.52);
      cardOut(2, 2.58);
      tl.to(total, { v: TOTAL_EMI, duration: 0.25, ease: 'power1.out' }, 2.61);
      tl.addLabel('total', 3);

      // ---- 4. A prepayment goes in: the years and the interest shrink ----
      swapCaption(3, 3.02);
      if (narrow()) {
        // On phones the panel takes the cards' place under the calculator
        tl.to(cards, { autoAlpha: 0, scale: () => cardScale() * 0.9, duration: 0.2 }, 3.05);
      }
      press('+', 3.08);
      show(6, 3.14);
      ['5', '0', '00'].forEach((k, i) => press(k, 3.14 + i * 0.045));
      press('EMI', 3.3);
      tl.fromTo(
        panel,
        { x: () => fromCalc().x, y: () => fromCalc().y, scale: 0.2, autoAlpha: 0 },
        { x: () => panelRest().x, y: () => panelRest().y, scale: () => panelRest().s, autoAlpha: 1, duration: 0.3, ease: 'back.out(1.3)', immediateRender: false },
        3.2
      );
      tl.to(months, { v: PREPAY.monthsAfter, duration: 0.5, ease: 'power1.inOut' }, 3.38);
      tl.to(interest, { v: 1, duration: 0.5, ease: 'power1.inOut' }, 3.38);
      tl.addLabel('faster', 4);

      // ---- 5. "=" prints the summary out of the top ----
      swapCaption(4, 4.02);
      if (narrow()) tl.to(panel, { autoAlpha: 0, duration: 0.2 }, 4.04);
      press('=', 4.08);
      show(7, 4.12);
      tl.to(place, { y: summaryY, scale: summaryScale, duration: 0.35, ease: 'power2.inOut' }, 4.1);
      tl.set(tape, { autoAlpha: 1 }, 4.4);
      tl.to(paper, { yPercent: 0, duration: 0.5, ease: 'steps(14)' }, 4.42);
      tl.addLabel('summary', 5);

      // ---- Each scroll moves exactly one step: when the scroll comes to rest between two steps,
      // it glides on to the next one in the direction it was going ----
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
        const target = dir > 0 ? list.find((q) => q > p + eps) ?? 1 : [...list].reverse().find((q) => q < p - eps) ?? 0;
        gliding = true;
        // The page's smooth scrolling would fight the glide frame by frame, so it's off meanwhile
        const html = document.documentElement;
        const before = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        const done = () => {
          html.style.scrollBehavior = before;
          gliding = false;
          settledAt = st.scroll();
        };
        gsap.to(window, {
          scrollTo: { y: st.start + target * (st.end - st.start), autoKill: true },
          duration: 0.7,
          ease: 'power2.inOut',
          onComplete: done,
          onInterrupt: done,
        });
      };
      ScrollTrigger.addEventListener('scrollEnd', onScrollEnd);
      render();
      ScrollTrigger.sort();
      return () => ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
    });

    return () => mm.revert();
  }, []);

  // The 3D calculator: loaded as the section comes near, drawn only while it's on screen. The scroll
  // timeline above moves the flat calculator's parts; each frame this reads where they are and poses
  // the 3D model to match, so the story is told once.
  useEffect(() => {
    const section = sectionRef.current;
    const host = sceneHostRef.current;
    if (!section || !host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const qa = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-l="${k}"]`));
    const place = qa('place')[0];
    const entrance = qa('entrance')[0];
    const paper = qa('paper')[0];
    const tape = qa('tape')[0];
    const frames = qa('frame');
    const flat = qa('flat');
    const keys = Array.from(section.querySelectorAll<HTMLElement>('[data-key]'));

    let scene: CalculatorScene | null = null;
    let visible = false;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const started = performance.now();

    const tick = () => {
      if (!scene || !visible) return;
      const origin = host.getBoundingClientRect();
      const box = place.getBoundingClientRect();
      const frame = frames.find((el) => el.style.visibility !== 'hidden') ?? frames[0];
      const num = (el: Element, p: string) => Number(gsap.getProperty(el, p)) || 0;
      scene.render({
        box: { cx: box.left + box.width / 2 - origin.left, cy: box.top + box.height / 2 - origin.top, w: box.width, h: box.height },
        enter: {
          y: num(entrance, 'y'),
          rotateX: num(entrance, 'rotateX'),
          rotateY: num(entrance, 'rotateY'),
          scale: num(entrance, 'scale') || 1,
          alpha: entrance.style.visibility === 'hidden' ? 0 : Number(gsap.getProperty(entrance, 'opacity')),
        },
        presses: Object.fromEntries(keys.map((k) => [k.dataset.key!, num(k, 'y') / 3])),
        display: { label: frame.children[0]?.textContent ?? '', value: frame.children[1]?.textContent ?? '' },
        paper: tape.style.visibility === 'hidden' ? 0 : 1 - num(paper, 'yPercent') / 100,
        time: (performance.now() - started) / 1000,
      });
    };

    const load = () => {
      import('./calculatorScene')
        .then(({ CalculatorScene }) => CalculatorScene.create(RECEIPT_LINES))
        .then((created) => {
          if (cancelled) {
            created.dispose();
            return;
          }
          scene = created;
          host.appendChild(scene.canvas);
          const fit = () => scene?.resize(host.clientWidth, host.clientHeight);
          resizeObserver = new ResizeObserver(fit);
          resizeObserver.observe(host);
          fit();
          flat.forEach((el) => (el.style.opacity = '0'));
          gsap.ticker.add(tick);
        })
        .catch((error) => console.warn('3D calculator failed to load:', error));
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
      flat.forEach((el) => (el.style.opacity = ''));
      scene?.dispose();
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="loan-planner"
        data-loan
        aria-label="Loan Planner"
        className="relative flex w-full h-[calc(100svh-72px)] flex-col overflow-hidden bg-black text-[#F5F5F5] select-none motion-reduce:hidden"
      >
        {/* A soft light on the desk */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_50%_60%,rgba(255,255,255,0.06),transparent_70%)]" />

        {/* Captions */}
        <div className="relative z-30 shrink-0 px-4 pt-6 text-center sm:pt-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">Loan Planner</p>
          <div className="relative mx-auto mt-2 min-h-[64px] max-w-2xl sm:min-h-[96px]">
            {CAPTIONS.map((c) => (
              <div key={c.title} data-l="caption" className="absolute inset-x-0 top-0">
                <h2 className="text-xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{c.title}</h2>
                <p className="mt-1 text-xs text-neutral-400 sm:mt-2 sm:text-base">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* The desk */}
        <div ref={stageRef} className="relative min-h-0 flex-1 [perspective:1400px]">
          <div
            data-l="place"
            className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]"
            style={{ '--w': 'min(340px, 80vw, 44svh)', width: 'var(--w)', height: 'calc(var(--w) * 0.92)' } as React.CSSProperties}
          >
            <div data-l="entrance" className="relative h-full w-full [transform-style:preserve-3d]">
              {/* Shadow on the desk */}
              <div data-l="shadow" className="pointer-events-none absolute left-1/2 top-[94%] h-12 w-[130%] -translate-x-1/2 rounded-[50%] bg-black/80 blur-2xl" />

              {/* The paper tape: printed out of the slot at the top */}
              <div
                data-l="tape"
                className="absolute bottom-[calc(100%-0.6rem)] left-1/2 w-[76%] -translate-x-1/2 overflow-hidden"
                style={{ height: 'calc(var(--w) * 0.98)', visibility: 'hidden' }}
              >
                <div data-l="paper" className="absolute inset-0">
                  <div data-l="flat" className="absolute inset-0">
                    <Receipt />
                  </div>
                </div>
              </div>

              {/* The flat calculator: drives nothing, and is only seen if the 3D one can't load */}
              <div data-l="flat" className="absolute inset-0">
                <Calculator />
              </div>
            </div>
          </div>

          {/* The 3D calculator draws here, over the whole desk, so the receipt has room above it */}
          <div ref={sceneHostRef} className="pointer-events-none absolute inset-0 z-10" />

          {/* The loan cards and the prepayment panel, sliding out of the calculator */}
          <div className="pointer-events-none absolute inset-0 z-40">
            {LOANS.map((loan) => (
              <div key={loan.kind} data-l="card" className="absolute left-0 top-0" style={{ visibility: 'hidden' }}>
                <LoanCard loan={loan} />
              </div>
            ))}
            <div data-l="panel" className="absolute left-0 top-0" style={{ visibility: 'hidden', width: PANEL_W }}>
              <PrepayPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Without motion: the loans and the summary, listed */}
      <div className="hidden motion-reduce:block w-full bg-black px-4 py-16 text-[#F5F5F5]">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Loan Planner</h2>
        <p className="mt-2 text-center text-neutral-400">Track EMIs, see the interest you’ll pay, and find ways to close loans faster.</p>
        <ul className="mx-auto mt-8 grid max-w-md gap-3">
          {LOANS.map((loan) => (
            <li key={loan.kind}>
              <LoanCard loan={loan} />
            </li>
          ))}
          <li>
            <PrepayPanel done />
          </li>
        </ul>
      </div>
    </>
  );
}

// A desk calculator: a solar strip, the display, and the keypad
function Calculator() {
  return (
    <div className="absolute inset-0">
      {/* Its thickness, showing under the front */}
      <div className="absolute inset-x-0 bottom-[-10px] top-[10px] rounded-[1.6rem] bg-[#0d0d10]" />
      <div
        className="absolute inset-0 flex flex-col rounded-[1.6rem] border border-white/10 p-[7%] shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
        style={{ background: 'linear-gradient(150deg, #2b2b31 0%, #1c1c21 45%, #141417 100%)' }}
      >
        {/* The slot the paper tape comes out of */}
        <div className="absolute left-1/2 top-[3%] h-[1.5%] w-[70%] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]" />

        {/* Brand and the solar strip */}
        <div className="mt-[4%] flex items-center justify-between">
          <span className="text-[calc(var(--w)*0.045)] font-semibold tracking-wide text-neutral-400">BrokeNoMore</span>
          <span className="flex h-[calc(var(--w)*0.055)] w-[34%] overflow-hidden rounded-sm border border-black/60 bg-[#2a1e14]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="flex-1 border-r border-black/50 bg-gradient-to-b from-[#4a3424] to-[#22170f] last:border-r-0" />
            ))}
          </span>
        </div>

        {/* The display */}
        <div className="relative mt-[5%] h-[22%] overflow-hidden rounded-lg border-[3px] border-[#0b0b0d] bg-[#b9c4ad] shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]">
          {FRAMES.map((f, k) => (
            <div key={k} data-l="frame" className="absolute inset-0 flex flex-col justify-between px-[6%] py-[5%] font-mono text-[#1b2617]" style={{ visibility: k === 0 ? 'visible' : 'hidden' }}>
              <span className="text-[calc(var(--w)*0.042)] font-semibold tracking-wider opacity-75">{f.label}</span>
              <span data-l="value" className="self-end text-[calc(var(--w)*0.11)] font-semibold leading-none tabular-nums tracking-tight">
                {f.typed ? '0' : f.value}
              </span>
            </div>
          ))}
        </div>

        {/* The keypad */}
        <div className="mt-[6%] grid flex-1 grid-cols-4 grid-rows-5 gap-[calc(var(--w)*0.03)]">
          {KEYS.flat().map((k) => {
            const op = ['÷', '×', '−', '+', '%'].includes(k);
            const style: React.CSSProperties =
              k === 'EMI'
                ? { background: BRAND, color: '#fff' }
                : k === '='
                  ? { background: '#ECECF1', color: '#141417' }
                  : k === 'AC'
                    ? { background: '#3a2a30', color: '#F7A8C8' }
                    : { background: op ? '#33333b' : '#26262c', color: op ? '#C9C2FF' : '#F2F2F5' };
            return (
              <span
                key={k}
                data-key={k}
                className="flex items-center justify-center rounded-[calc(var(--w)*0.04)] text-[calc(var(--w)*0.06)] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.55)]"
                style={style}
              >
                {k}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// The summary the calculator prints: a strip of till paper with a torn top edge
function Receipt() {
  const row = (a: string, b: string, strong = false) => (
    <div className={`flex justify-between ${strong ? 'font-bold' : ''}`}>
      <span>{a}</span>
      <span className="tabular-nums">{b}</span>
    </div>
  );
  return (
    <div
      className="absolute inset-0 flex flex-col gap-[0.35em] px-[8%] pb-[6%] pt-[9%] font-mono text-[calc(var(--w)*0.042)] leading-tight text-[#222] bg-[#f4f2ec]"
      style={{
        // The torn top edge
        clipPath:
          'polygon(0 3%, 5% 0, 10% 3%, 15% 0, 20% 3%, 25% 0, 30% 3%, 35% 0, 40% 3%, 45% 0, 50% 3%, 55% 0, 60% 3%, 65% 0, 70% 3%, 75% 0, 80% 3%, 85% 0, 90% 3%, 95% 0, 100% 3%, 100% 100%, 0 100%)',
      }}
    >
      <p className="text-center font-bold tracking-widest">BROKENOMORE</p>
      <p className="text-center text-[0.85em] text-[#666]">LOAN SUMMARY</p>
      <div className="my-[0.2em] border-t border-dashed border-[#aaa]" />
      {LOANS.map((l) => (
        <React.Fragment key={l.kind}>{row(l.name, inr(l.emi))}</React.Fragment>
      ))}
      <div className="my-[0.2em] border-t border-dashed border-[#aaa]" />
      {row('TOTAL EMI / MO', `₹${inr(TOTAL_EMI)}`, true)}
      {row('INTEREST SAVED', lakh(SAVED))}
      {row('HOME LOAN DONE', `${Math.floor(PREPAY.monthsAfter / 12)}y ${PREPAY.monthsAfter % 12}m`)}
      <div className="my-[0.2em] border-t border-dashed border-[#aaa]" />
      <p className="text-center text-[0.8em] text-[#888]">* Illustrative figures</p>
    </div>
  );
}

function LoanIcon({ kind }: { kind: (typeof LOANS)[number]['kind'] }) {
  const props = { viewBox: '0 0 24 24', className: 'h-6 w-6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
  if (kind === 'home')
    return (
      <svg {...props}>
        <path d="M3.5 11 12 4l8.5 7" />
        <path d="M6 9.5V20h12V9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    );
  if (kind === 'car')
    return (
      <svg {...props}>
        <path d="M4 16v-3.5L6 7.5h12l2 5V16" />
        <path d="M3.5 16h17" />
        <circle cx="7.5" cy="17" r="1.6" />
        <circle cx="16.5" cy="17" r="1.6" />
      </svg>
    );
  return (
    <svg {...props}>
      <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" />
      <path d="M6.5 11v4.5c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2V11" />
      <path d="M21.5 9v5" />
    </svg>
  );
}

function LoanCard({ loan }: { loan: (typeof LOANS)[number] }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#141414] px-4 shadow-[0_24px_48px_rgba(0,0,0,0.7)]" style={{ width: CARD_W, height: CARD_H }}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: loan.color }}>
        <LoanIcon kind={loan.kind} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{loan.name}</p>
        <p className="truncate text-xs text-neutral-500">{loan.detail}</p>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-semibold tabular-nums">₹{inr(loan.emi)}</p>
        <p className="text-[11px] text-neutral-500">EMI / mo</p>
      </div>
    </div>
  );
}

// Interest on the home loan as planned, and with ₹5,000 a month more
function PrepayPanel({ done = false }: { done?: boolean }) {
  const after = PREPAY.interestAfter / PREPAY.interestBefore;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.7)]">
      <p className="text-[15px] font-semibold">Home loan, +₹{inr(PREPAY.extra)} a month</p>
      <p className="text-xs text-neutral-500">
        {Math.floor(PREPAY.monthsBefore / 12)} yrs → {Math.floor(PREPAY.monthsAfter / 12)} yrs {PREPAY.monthsAfter % 12} mo
      </p>
      <div className="mt-3 space-y-2.5 text-xs">
        <div>
          <div className="flex justify-between text-neutral-400">
            <span>Interest as planned</span>
            <span className="tabular-nums">{lakh(PREPAY.interestBefore)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#3a3a42]" />
        </div>
        <div>
          <div className="flex justify-between text-neutral-200">
            <span>With prepayment</span>
            <span className="tabular-nums">{lakh(PREPAY.interestAfter)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[#232329]">
            <div
              data-l={done ? undefined : 'bar-after'}
              className="h-full origin-left rounded-full"
              style={{ background: BRAND, transform: done ? `scaleX(${after})` : undefined }}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
        <span className="text-xs text-neutral-400">You save</span>
        <span data-l={done ? undefined : 'saved'} className="text-xl font-semibold tabular-nums">
          ₹{done ? inr(SAVED) : '0'}
        </span>
      </div>
    </div>
  );
}
