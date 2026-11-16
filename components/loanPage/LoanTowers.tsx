'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { glideBetweenLabels, pinned } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';
import { Gradient } from '../IntroHero';
import type { TowerLoan, TowersScene } from './towersScene';

// Loan Planner: "Debt, dismantled." Every loan stands as a glossy tower on a dark mirror floor,
// one slab for every year still to pay. One scroll each: the camera flies in and the towers build;
// each loan is named; the EMIs stream into one coin; the interest inside every slab glows red; a
// ₹5,000 prepayment shatters seven years off the home loan; and then every slab lifts away.
// All figures are illustrative, but they are real EMI arithmetic.

const inr = (n: number) => Math.round(n).toLocaleString('en-IN');
const lakh = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

// Each year of a loan: how much of that year's EMIs pays interest, and how much pays it off
function amortise(amount: number, rate: number, emi: number) {
  const i = rate / 1200;
  let left = amount;
  const years: { interest: number; principal: number }[] = [];
  while (left > 1 && years.length < 40) {
    let interest = 0;
    let principal = 0;
    for (let m = 0; m < 12 && left > 1; m++) {
      const int = left * i;
      const pay = Math.min(emi - int, left);
      interest += int;
      principal += pay;
      left -= pay;
    }
    years.push({ interest, principal });
  }
  return years;
}
const exactEmi = (amount: number, rate: number, months: number) => {
  const i = rate / 1200;
  return (amount * i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
};

const LOANS = [
  { key: 'car', name: 'Car loan', amount: 800000, rate: 9.2, months: 60, emi: 16684, color: '#E86AB4' },
  { key: 'home', name: 'Home loan', amount: 2500000, rate: 8.5, months: 240, emi: 21696, color: '#6E5BFF' },
  { key: 'education', name: 'Education loan', amount: 600000, rate: 10, months: 84, emi: 9961, color: '#F5A524' },
] as const;
const TOTAL_EMI = LOANS.reduce((t, l) => t + l.emi, 0); // 48,341
const OUTSTANDING = LOANS.reduce((t, l) => t + l.amount, 0);
// The home loan with ₹5,000 a month extra: 240 months become 155, and this much interest goes
const PREPAY = { extra: 5000, monthsBefore: 240, monthsAfter: 155, interestBefore: 2706939, interestAfter: 1617579 };
const SAVED = PREPAY.interestBefore - PREPAY.interestAfter; // 10,89,360
const INTEREST = LOANS.map((l) => l.emi * l.months - l.amount);
const TOTAL_INTEREST = INTEREST[0] + PREPAY.interestBefore + INTEREST[2];

const TOWERS: TowerLoan[] = LOANS.map((l) => ({
  key: l.key,
  color: l.color,
  years: amortise(l.amount, l.rate, exactEmi(l.amount, l.rate, l.months)),
  ...(l.key === 'home' ? { yearsAfter: amortise(l.amount, l.rate, exactEmi(l.amount, l.rate, l.months) + PREPAY.extra) } : {}),
}));

// The month the last EMI is paid, counting from November 2026
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const doneBy = (months: number) => {
  const m = 10 + Math.round(months) - 1;
  return `${MONTHS[m % 12]} ${2026 + Math.floor(m / 12)}`;
};
const yearsMonths = (m: number) => `${Math.floor(m / 12)}y ${Math.round(m) % 12}m`;

const STEPS = 5;
const CAPTIONS: { kicker: string; title: React.ReactNode; body: string }[] = [
  { kicker: 'Loan Planner', title: <>Debt, <Gradient>dismantled.</Gradient></>, body: 'Every loan you carry, built out of the years you still owe. Then we take it apart, one slab at a time.' },
  { kicker: '01 · Your loans', title: 'Three loans. One skyline.', body: 'Home, car and education, each a tower with one slab for every year left to pay. Add any loan with its amount, rate and tenure.' },
  { kicker: '02 · Total EMI', title: 'One number, every month.', body: `Every EMI streams into a single total. ₹${inr(TOTAL_EMI)} leaves your account each month, and now you can see where it goes.` },
  { kicker: '03 · Interest', title: 'The part nobody shows you.', body: `Red is interest. On the home loan alone, ${lakh(PREPAY.interestBefore)} of what you pay never touches what you borrowed.` },
  { kicker: '04 · Prepay', title: 'Pay ₹5,000 more. Lose seven years.', body: `A little extra each month and the top of the home loan breaks away: 20 years become ${yearsMonths(PREPAY.monthsAfter)}, and ${lakh(SAVED)} of interest is gone.` },
  { kicker: '05 · Debt-free', title: `Debt-free · ${doneBy(PREPAY.monthsAfter)}.`, body: 'Every slab lifted, every EMI accounted for. That’s the day you’re done, and the planner counts you down to it.' },
];

export default function LoanTowers() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const capsRef = useRef<HTMLDivElement | null>(null);
  // What the scroll timeline drives, read by the scene each frame
  const story = useRef({ v: 0, rise: 0, split: 0, emi: 0, prepay: 0, dismantle: 0, free: 0 });
  const intro = useRef({ v: 0, rise: 0 });
  const hud = useRef({ out: OUTSTANDING, interest: TOTAL_INTEREST, months: PREPAY.monthsBefore });

  useTypeOnShow(capsRef, '[data-cap]', 30);

  // The scroll story
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = gsap.utils.selector(section);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const s = story.current;
      const h = hud.current;
      const wraps = q('[data-wrap]');
      gsap.set(wraps.slice(1), { autoAlpha: 0, y: 16 });
      gsap.set(q('[data-cap]')[0], { autoAlpha: 0 });
      gsap.set([q('[data-tag]'), q('[data-coin]'), q('[data-hud]'), q('[data-int]'), q('[data-free]')], { autoAlpha: 0 });

      // The fly-in, once, when the page opens: the camera sweeps in and the towers build
      const opening = gsap.timeline({ delay: 0.2 });
      opening.to(intro.current, { v: 1, duration: 3.4, ease: 'power3.inOut' }, 0);
      opening.to(intro.current, { rise: 1, duration: 2.8, ease: 'none' }, 0.5);
      opening.to(q('[data-cap]')[0], { autoAlpha: 1, duration: 0.4 }, 1.6);

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          ...pinned(section, STEPS, 9),
          end: () => `+=${window.innerHeight * 1.1 * STEPS}`,
          // If the reader scrolls before the fly-in's done, finish it straight away
          onUpdate: (st) => {
            if (st.progress > 0.01 && opening.isActive()) opening.progress(1);
          },
        },
      });
      for (let c = 0; c <= STEPS; c++) tl.addLabel('s' + c, c);
      tl.to(s, { v: STEPS, duration: STEPS, ease: 'none' }, 0);
      // Each caption hands over to the next
      for (let k = 0; k < STEPS; k++) {
        tl.to(wraps[k], { autoAlpha: 0, y: -14, duration: 0.2, ease: 'power1.in' }, k + 0.12);
        tl.fromTo(wraps[k + 1], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, k + 0.55);
      }
      // 1: every loan, named
      tl.to(q('[data-tag]'), { autoAlpha: 1, duration: 0.3, stagger: 0.08 }, 0.45);
      tl.to(q('[data-hud]'), { autoAlpha: 1, duration: 0.3 }, 0.6);
      // 2: the EMIs stream into the coin
      tl.to(s, { emi: 1, duration: 0.8, ease: 'power1.inOut' }, 1.1);
      tl.to(q('[data-coin]'), { autoAlpha: 1, duration: 0.3 }, 1.45);
      // 3: the interest glows
      tl.to(s, { split: 1, duration: 0.7, ease: 'power1.inOut' }, 2.1);
      tl.to(q('[data-int]'), { autoAlpha: 1, duration: 0.3 }, 2.45);
      tl.to(q('[data-coin]'), { autoAlpha: 0, duration: 0.2 }, 2.1);
      // The car loan's label would sit on this caption: it steps out for this one
      tl.to(q('[data-tag]')[0], { autoAlpha: 0, duration: 0.2 }, 2.1);
      tl.to(q('[data-tag]')[0], { autoAlpha: 1, duration: 0.25 }, 3.2);
      // 4: the prepayment
      tl.to(s, { prepay: 1, duration: 0.8, ease: 'power1.inOut' }, 3.1);
      tl.to(h, { interest: TOTAL_INTEREST - SAVED, months: PREPAY.monthsAfter, duration: 0.8, ease: 'power1.inOut' }, 3.1);
      // 5: every slab lifts away
      tl.to(q('[data-tag]'), { autoAlpha: 0, duration: 0.2 }, 4.05);
      tl.to(s, { dismantle: 1, duration: 0.8, ease: 'power1.inOut' }, 4.1);
      tl.to(h, { out: 0, duration: 0.8, ease: 'power1.inOut' }, 4.1);
      tl.to(s, { free: 1, duration: 0.4 }, 4.55);
      tl.to(q('[data-free]'), { autoAlpha: 1, duration: 0.3 }, 4.6);
      tl.fromTo(q('[data-free] > div'), { scale: 0.8 }, { scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, 4.6);
      const unglide = glideBetweenLabels(tl, 1.2);
      return () => {
        unglide();
        opening.kill();
      };
    });
    return () => mm.revert();
  }, []);

  // The 3D scene, and the labels pinned to it
  useEffect(() => {
    const section = sectionRef.current;
    const host = hostRef.current;
    if (!section || !host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-${k}]`));
    const tags = q('tag');
    const coin = q('coin')[0];
    const freeEl = q('free')[0];
    const [out, interest, months, free] = ['h-out', 'h-int', 'h-months', 'h-date'].map((k) => q(k)[0]);
    let scene: TowersScene | null = null;
    let visible = false;
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const tick = () => {
      if (!scene) return;
      const s = story.current;
      const i = intro.current;
      Object.assign(scene.state, { rise: i.rise, split: s.split, emi: s.emi, prepay: s.prepay, dismantle: s.dismantle, free: s.free });
      scene.cam.v = i.v + s.v;
      tags.forEach((el, k) => {
        const p = scene!.towerTop(k);
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      });
      const c = scene.coinOnScreen();
      coin.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0) translate(-50%, 115%)`;
      const f = scene.project(0, 0, 0);
      freeEl.style.transform = `translate3d(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      const h = hud.current;
      out.textContent = `₹${inr(h.out)}`;
      interest.textContent = lakh(h.interest);
      months.textContent = yearsMonths(h.months);
      free.textContent = doneBy(h.months);
    };

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      scene?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const onLeave = () => scene?.setPointer(0, 0);
    if (window.matchMedia('(pointer: fine)').matches) {
      section.addEventListener('pointermove', onMove);
      section.addEventListener('pointerleave', onLeave);
    }

    import('./towersScene')
      .then(({ TowersScene }) => {
        if (cancelled) return;
        scene = new TowersScene(TOWERS);
        host.appendChild(scene.canvas);
        const fit = () => scene?.resize(host.clientWidth, host.clientHeight);
        ro = new ResizeObserver(fit);
        ro.observe(host);
        fit();
        scene.setActive(visible);
        gsap.ticker.add(tick);
      })
      .catch((error) => console.warn('3D loan towers failed to load:', error));

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      scene?.setActive(visible);
    });
    io.observe(section);

    return () => {
      cancelled = true;
      io.disconnect();
      ro?.disconnect();
      gsap.ticker.remove(tick);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      scene?.dispose();
    };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="loan-planner"
        aria-label="Loan Planner"
        className="relative w-full h-[calc(100svh-72px)] overflow-hidden bg-[#030306] text-[#F5F5F5] select-none motion-reduce:hidden"
      >
        {/* The scene */}
        <div ref={hostRef} className="absolute inset-0" />
        {/* Shade behind the captions, so they read over the towers */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,6,0.92)_0%,rgba(3,3,6,0.5)_28%,transparent_45%)] md:bg-[linear-gradient(90deg,rgba(3,3,6,0.92)_0%,rgba(3,3,6,0.55)_30%,transparent_52%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030306] to-transparent" />

        {/* Labels over each tower */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {LOANS.map((l, k) => (
            <div key={l.key} data-tag className="absolute left-0 top-0 will-change-transform">
              <div className="flex flex-col items-center gap-1 whitespace-nowrap">
                <div className="rounded-xl border border-white/15 bg-black/55 px-3 py-1.5 text-center backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 md:text-[12px]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color, boxShadow: `0 0 10px ${l.color}` }} />
                    {l.name}
                  </div>
                  <div className="mt-0.5 text-[12px] tabular-nums text-white/60 md:text-[13px]">
                    ₹{inr(l.emi)}<span className="text-white/35">/mo</span>
                  </div>
                  <div data-int className="text-[11px] tabular-nums text-[#FF6B6B] md:text-[12px]">
                    {lakh(l.key === 'home' ? PREPAY.interestBefore : INTEREST[k])} interest
                  </div>
                </div>
                <div className="h-5 w-px bg-gradient-to-b from-white/40 to-transparent" />
              </div>
            </div>
          ))}
          {/* The total, over the coin */}
          <div data-coin className="absolute left-0 top-0 will-change-transform">
            <div className="rounded-2xl border border-[#8B5CF6]/40 bg-black/60 px-4 py-2 text-center shadow-[0_0_40px_rgba(110,91,255,0.35)] backdrop-blur-md">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Total EMI</div>
              <div className="text-[22px] font-bold tabular-nums leading-tight md:text-[26px]">
                <Gradient>₹{inr(TOTAL_EMI)}</Gradient>
                <span className="text-[13px] font-medium text-white/45">/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Captions */}
        <div ref={capsRef} className="pointer-events-none absolute left-4 right-4 top-6 md:left-[6vw] md:right-auto md:top-1/2 md:w-[min(440px,38vw)] md:-translate-y-1/2 short:top-[42%]">
          {CAPTIONS.map((c, k) => (
            <div key={k} data-wrap className={k === 0 ? 'relative' : 'absolute inset-x-0 top-0'}>
              <div data-cap>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A99DFF] md:text-[12px]">{c.kicker}</div>
                {k === 0 ? (
                  <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight md:text-[60px]">{c.title}</h1>
                ) : (
                  <h2 className="text-[26px] font-bold leading-[1.1] tracking-tight md:text-[40px]">{c.title}</h2>
                )}
                <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-white/65 md:mt-4 md:text-[16px]">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The planner's numbers */}
        <div data-hud className="pointer-events-none absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2 md:bottom-8 md:left-auto md:right-8 md:w-[420px] md:gap-3 short:bottom-6 short:left-[6vw] short:right-auto short:w-[min(480px,40vw)] short:grid-cols-4 short:gap-1.5">
          {[
            ['Outstanding', 'h-out', `₹${inr(OUTSTANDING)}`],
            ['Total interest', 'h-int', lakh(TOTAL_INTEREST)],
            ['Home loan left', 'h-months', yearsMonths(PREPAY.monthsBefore)],
            ['Debt-free by', 'h-date', doneBy(PREPAY.monthsBefore)],
          ].map(([label, key, value]) => (
            <div key={key} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-md md:px-4 md:py-3 short:px-2.5 short:py-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 md:text-[11px] short:truncate short:text-[9px] short:tracking-[0.08em]">{label}</div>
              <div {...{ [`data-${key}`]: '' }} className="mt-0.5 text-[16px] font-semibold tabular-nums md:text-[20px] short:text-[14px]">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Debt-free */}
        <div data-free className="pointer-events-none absolute left-0 top-0 will-change-transform">
          <div className="rounded-full border border-[#22C55E]/40 bg-[#22C55E]/10 px-5 py-2 text-[13px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap text-[#4ADE80] shadow-[0_0_60px_rgba(34,197,94,0.35)] backdrop-blur-md md:text-[15px]">
            ₹0 outstanding
          </div>
        </div>
      </section>

      {/* Reduced motion: the same story, laid out flat */}
      <section className="hidden motion-reduce:block w-full bg-[#030306] px-4 py-16 text-[#F5F5F5]">
        <div className="mx-auto max-w-[720px] space-y-10">
          {CAPTIONS.map((c, k) => (
            <div key={k}>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#A99DFF]">{c.kicker}</div>
              <h2 className="text-[28px] font-bold leading-tight">{c.title}</h2>
              <p className="mt-2 text-white/65">{c.body}</p>
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-3">
            {LOANS.map((l) => (
              <div key={l.key} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[13px] font-semibold" style={{ color: l.color }}>{l.name}</div>
                <div className="mt-1 text-[20px] font-semibold tabular-nums">₹{inr(l.emi)}/mo</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
