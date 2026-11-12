'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { holdPinUntilPlayed } from '../journey';

gsap.registerPlugin(ScrollTrigger);


// File ITR with Quicko. Quicko's logo builds itself in the middle of the screen; scrolling then
// flies it up into the top-left corner, brings the heading in, and slides a row of flat cards from
// right to left, one tax job per card. As each card reaches the middle, its little piece of
// interface fills in: steps tick, bars grow, a refund lands. Everything is flat and orthogonal.

type CardId = 'file' | 'regime' | 'deductions' | 'gains' | 'pay' | 'expert' | 'refund';

const CARDS: { id: CardId; icon: IconKind; title: string; body: string }[] = [
  { id: 'file', icon: 'file', title: 'Do your own taxes', body: 'Autofill, review & e-file in just a few minutes.' },
  { id: 'regime', icon: 'scale', title: 'Pick the better regime', body: 'Old vs new, compared on your own numbers.' },
  { id: 'deductions', icon: 'tag', title: 'Maximize your tax savings', body: 'Every eligible deduction, tracked as you go.' },
  { id: 'gains', icon: 'chart', title: 'Investments, imported', body: 'Capital gains from stocks & mutual funds, worked out for you.' },
  { id: 'pay', icon: 'scan', title: 'Pay taxes on time', body: 'Advance and self-assessment tax, with reminders before due dates.' },
  { id: 'expert', icon: 'chat', title: 'Talk to a tax expert', body: 'Book a call with a verified expert when you need one.' },
  { id: 'refund', icon: 'check', title: 'Track your refund', body: 'From filed to credited, every step in one place.' },
];

export default function QuickoSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;
    const q = (k: string) => section.querySelector<HTMLElement>(`[data-q="${k}"]`)!;
    const qa = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-q="${k}"]`));
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const bigLogo = q('big-logo');
      const slot = q('logo-slot');
      const letters = qa('q-letter');
      // The letters of "Income Tax Return" that aren't I, T or R: they fold away on the flight up
      const rests = qa('q-rest');
      const shine = q('q-shine');
      const intro = qa('intro');
      const counter = q('counter');
      const progressBar = q('progress');
      const footer = q('footer');
      const cards = qa('card');
      // The row's side padding, which lines its first and last cards up with the heading
      const pad = () => parseFloat(getComputedStyle(track).paddingRight) || 0;
      // How far the row has to travel: until the last card sits at the right-hand edge, lined up
      // with the heading. The row (and the pin) ends there, with no empty space after it.
      const distance = () => {
        const last = cards[cards.length - 1];
        const width = last ? last.offsetLeft + last.offsetWidth + pad() : track.scrollWidth;
        return Math.max(0, width - viewport.clientWidth);
      };

      // Centred on its spot by GSAP, so its later moves don't undo the centring
      gsap.set(bigLogo, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

      // ---- 1. The title rises in, letter by letter, in the middle, once, as the section arrives ----
      gsap.set(letters, { yPercent: 110, autoAlpha: 0 });
      gsap.set(shine, { xPercent: -120 });
      const build = gsap.timeline({ paused: true });
      build
        .to(letters, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power4.out', stagger: 0.045 })
        .to(shine, { xPercent: 120, duration: 1.1, ease: 'power2.inOut' }, '-=0.25');
      const arrival = ScrollTrigger.create({ trigger: section, start: 'top 75%', once: true, onEnter: () => build.play() });

      // Where the big logo has to go to sit exactly on the small one in the top-left corner
      const toSlot = () => {
        const s = section.getBoundingClientRect();
        const t = slot.getBoundingClientRect();
        const scale = slot.offsetHeight / bigLogo.offsetHeight;
        return {
          x: t.left + t.width / 2 - s.left - section.clientWidth / 2,
          y: t.top + t.height / 2 - s.top - section.clientHeight * 0.45,
          scale,
        };
      };

      // ---- 2. Scrolling: the logo flies to the corner, the heading comes in, the row slides ----
      gsap.set(intro, { autoAlpha: 0, y: 24 });
      gsap.set([footer, counter.parentElement], { autoAlpha: 0 });
      const entry = () => viewport.clientWidth * 1.05;
      gsap.set(track, { x: entry() });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top 72px',
          end: () => `+=${distance() + window.innerHeight * 1.2}`,
          pin: true,
          refreshPriority: 1,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onRefresh: () => syncCards(),
        },
        // Runs on every frame the row actually moves, including while it eases to a stop
        onUpdate: () => {
          progressBar.style.transform = `scaleX(${tl.progress()})`;
          syncCards();
        },
      });
      // The logo glides up to the corner, shrinking as it goes
      tl.to(bigLogo, { x: () => toSlot().x, y: () => toSlot().y, scale: () => toSlot().scale, duration: 1, ease: 'power2.inOut' }, 0);
      // ...and "Income Tax Return" closes up into "ITR" on the way: every letter but the initials
      // narrows to nothing and fades
      tl.fromTo(
        rests,
        { width: (_: number, el: HTMLElement) => el.scrollWidth, autoAlpha: 1 },
        { width: 0, autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' },
        0.1
      );
      // The heading rises in beside it, line by line
      tl.to(intro, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' }, 0.75);
      tl.to([footer, counter.parentElement], { autoAlpha: 1, duration: 0.4 }, 1.1);
      // The cards come in from the right, then slide past right to left
      const slideUnits = () => Math.max(2, (distance() + entry()) / Math.max(1, viewport.clientWidth) * 2.4);
      tl.fromTo(track, { x: () => entry() }, { x: () => -distance(), duration: slideUnits, ease: 'none' }, 1);

      // ---- Each card brightens and fills in as it reaches the middle ----
      const parts = cards.map((card) => ({
        card,
        fills: Array.from(card.querySelectorAll<HTMLElement>('[data-q="fill"]')),
        ticks: Array.from(card.querySelectorAll<HTMLElement>('[data-q="tick"]')),
      }));
      const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
      const syncCards = () => {
        const vw = viewport.clientWidth;
        const left = viewport.getBoundingClientRect().left;
        // Where the last card comes to rest. Every card is fully in and filled by the time it gets
        // there, so the last one finishes exactly as the row stops.
        const last = cards[cards.length - 1];
        const rest = vw - pad() - (last?.offsetWidth ?? 0);
        let current = 1;
        parts.forEach(({ card, fills, ticks }, i) => {
          const x = card.getBoundingClientRect().left - left;
          const seen = clamp01((rest + vw * 0.42 - x) / (vw * 0.3));
          const filled = clamp01((rest + vw * 0.25 - x) / (vw * 0.25));
          // The counter shows how many cards have reached the resting line
          if (x <= rest + 2) current = i + 1;
          gsap.set(card, { opacity: 0.4 + 0.6 * seen, y: 18 * (1 - seen) });
          fills.forEach((f, k) => gsap.set(f, { scaleX: clamp01(filled * 1.3 - k * 0.15) }));
          ticks.forEach((t, k) => gsap.set(t, { autoAlpha: 0.2 + 0.8 * clamp01(filled * 1.6 - k * 0.25) }));
        });
        counter.textContent = String(Math.min(current, cards.length)).padStart(2, '0');
      };
      syncCards();
      // Put every pinned section back in page order, and measure again once the fonts have settled
      ScrollTrigger.sort();
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      // The row always finishes sliding before the page moves on
      const releaseHold = holdPinUntilPlayed(
        () => tl.scrollTrigger,
        () => tl.progress(),
        (toEnd) => tl.progress(toEnd ? 1 : 0)
      );

      return () => {
        releaseHold();
        arrival.kill();
        build.kill();
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="file-itr"
      data-quicko
      aria-label="File ITR with Quicko"
      className={`relative flex w-full flex-col overflow-hidden bg-black text-[#F5F5F5] select-none motion-safe:h-[calc(100svh-72px)]`}
    >
      {/* The title: "Income Tax Return", big in the middle at first, then it flies up into the corner
          and closes up into "ITR" */}
      <div
        data-q="big-logo"
        className="pointer-events-none absolute left-1/2 top-[45%] z-30 motion-reduce:hidden"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative overflow-hidden px-3 py-2">
          <ItrTitle animated className="text-[34px] sm:text-[64px] lg:text-[84px]" />
          <span data-q="q-shine" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent mix-blend-overlay" />
        </div>
      </div>

      {/* Heading */}
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-8 sm:px-6 sm:pt-12">
        <div>
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            {/* The title lands here as "ITR" (shown as is when motion is reduced) */}
            <span data-q="logo-slot" className="inline-flex px-3 py-2 motion-safe:invisible">
              <ItrTitle className="text-[24px] sm:text-[28px]" />
            </span>
          </div>
          <h2 data-q="intro" className="mt-3 sm:mt-4 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Taxes, done in minutes.
          </h2>
          <p data-q="intro" className="mt-1.5 sm:mt-2 max-w-xl text-xs xs:text-sm sm:text-base text-neutral-400">
            Autofill, review and e-file your return, save every rupee you&apos;re owed, and track your refund.
          </p>
        </div>
        <div className="hidden items-baseline gap-1 font-mono text-sm text-neutral-500 motion-safe:flex">
          <span data-q="counter" className="text-2xl text-[#F5F5F5] tabular-nums">
            01
          </span>
          <span>/ {String(CARDS.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* The sliding row */}
      <div ref={viewportRef} className="relative mt-6 sm:mt-10 flex-1 min-h-0 overflow-hidden motion-reduce:overflow-x-auto">
        <div ref={trackRef} className="flex h-full items-start gap-4 sm:gap-6 px-4 pb-6 sm:pb-8 will-change-transform sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
          {CARDS.map((card, i) => (
            <article
              key={card.id}
              data-q="card"
              className="flex h-full max-h-[min(440px,calc(100svh-220px))] w-[84vw] xs:w-[80vw] sm:w-[380px] max-w-[380px] shrink-0 flex-col rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#333] bg-[#222] text-neutral-200">
                  <Icon kind={card.icon} />
                </span>
                <span className="font-mono text-xs text-neutral-500">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-3 sm:mt-5 text-lg sm:text-2xl font-semibold tracking-tight">{card.title}</h3>
              <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-neutral-400">{card.body}</p>
              <div className="mt-auto pt-3 sm:pt-4">
                <CardDetail id={card.id} />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* How far along the row you are */}
      <div data-q="footer" className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 motion-reduce:hidden">
        <div className="h-px w-full bg-[#2A2A2A]">
          <div data-q="progress" className="h-px w-full origin-left bg-[#F5F5F5]" style={{ transform: 'scaleX(0)' }} />
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">Tax filing powered by Quicko. Figures shown are illustrative.</p>
      </div>
    </section>
  );
}

// The section's title. Big, it reads "Income Tax Return", set letter by letter so it can rise in;
// the letters after each initial sit in their own group so they can fold away, leaving "ITR".
// Small (in the corner), it is just "ITR".
const ITR_WORDS = [
  ['I', 'ncome'],
  ['T', 'ax'],
  ['R', 'eturn'],
];
function ItrTitle({ animated = false, className = '' }: { animated?: boolean; className?: string }) {
  const k = (name: string) => (animated ? name : undefined);
  const letter = (ch: string, key: React.Key) => (
    <span key={key} className="inline-block overflow-hidden pb-[0.1em]">
      <span data-q={k('q-letter')} className="inline-block">
        {ch === ' ' ? '\u00A0' : ch}
      </span>
    </span>
  );
  return (
    <span
      className={`flex items-center font-semibold leading-none tracking-[0.02em] text-white whitespace-nowrap ${className}`}
      aria-label={animated ? 'Income Tax Return' : 'ITR'}
      role="img"
    >
      <span className="flex" aria-hidden="true">
        {animated
          ? ITR_WORDS.map(([initial, rest], w) => (
              <span key={w} className="inline-flex">
                {letter(initial, 'i')}
                <span data-q="q-rest" className="inline-flex overflow-hidden">
                  {(rest + (w < ITR_WORDS.length - 1 ? ' ' : '')).split('').map((ch, i) => letter(ch, i))}
                </span>
              </span>
            ))
          : 'ITR'.split('').map((ch, i) => letter(ch, i))}
      </span>
    </span>
  );
}

// ---- Each card's small piece of interface ----

function Bar({ label, value, width, strong = false }: { label: string; value: string; width: string; strong?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-neutral-400">{label}</span>
        <span className={strong ? 'font-semibold text-[#F5F5F5]' : 'text-neutral-300'}>{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-[#2A2A2A]">
        <div data-q="fill" className={`h-full origin-left rounded-full ${strong ? 'bg-[#F5F5F5]' : 'bg-neutral-500'}`} style={{ width }} />
      </div>
    </div>
  );
}

function Step({ label, done = true }: { label: string; done?: boolean }) {
  return (
    <li data-q="tick" className="flex items-center gap-2.5 text-sm">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${done ? 'border-[#F5F5F5] bg-[#F5F5F5] text-[#111]' : 'border-[#444] text-transparent'}`}>
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m2.5 6.2 2.2 2.2 4.8-5" />
        </svg>
      </span>
      <span className={done ? 'text-neutral-200' : 'text-neutral-500'}>{label}</span>
    </li>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div data-q="tick" className="flex items-center justify-between border-b border-[#2A2A2A] py-2 text-sm last:border-0">
      <span className="text-neutral-300">{left}</span>
      <span className="font-medium text-[#F5F5F5] tabular-nums">{right}</span>
    </div>
  );
}

function CardDetail({ id }: { id: CardId }) {
  switch (id) {
    case 'file':
      return (
        <div>
          <ul className="space-y-2.5">
            <Step label="Autofill from AIS & Form 26AS" />
            <Step label="Review income & deductions" />
            <Step label="e-File & e-verify" done={false} />
          </ul>
          <span className="mt-5 inline-flex rounded-lg bg-[#F5F5F5] px-4 py-2 text-sm font-semibold text-[#111]">File your Return</span>
        </div>
      );
    case 'regime':
      return (
        <div className="space-y-3">
          <Bar label="Old regime" value="₹1,24,800" width="100%" />
          <Bar label="New regime" value="₹98,400" width="79%" strong />
          <p className="pt-1 text-sm text-neutral-300">
            New regime saves you <span className="font-semibold text-[#F5F5F5]">₹26,400</span>
          </p>
        </div>
      );
    case 'deductions':
      return (
        <div className="space-y-3">
          <Bar label="80C · PF, ELSS" value="₹1.2L / 1.5L" width="80%" strong />
          <Bar label="80D · Health insurance" value="₹25K / 25K" width="100%" />
          <Bar label="80CCD(1B) · NPS" value="₹20K / 50K" width="40%" />
        </div>
      );
    case 'gains':
      return (
        <div>
          <Row left="Stocks · STCG" right="₹18,240" />
          <Row left="Mutual funds · LTCG" right="₹42,600" />
          <Row left="Dividends" right="₹3,150" />
        </div>
      );
    case 'pay':
      return (
        <div className="rounded-xl border border-[#2A2A2A] p-3.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Advance tax · 3rd instalment</span>
            <span>Due 15 Dec</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">₹14,500</p>
          <div className="mt-3 h-1.5 rounded-full bg-[#2A2A2A]">
            <div data-q="fill" className="h-full w-3/4 origin-left rounded-full bg-[#F5F5F5]" />
          </div>
          <p className="mt-2 text-xs text-neutral-500">75% of the year&apos;s advance tax paid</p>
        </div>
      );
    case 'expert':
      return (
        <div className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A] text-sm font-semibold">CA</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Verified tax expert</p>
            <p data-q="tick" className="text-xs text-neutral-400">★ 4.8 / 5 · 1,500+ reviews</p>
          </div>
          <span className="shrink-0 rounded-lg border border-[#444] px-3 py-1.5 text-xs font-medium">Book a call</span>
        </div>
      );
    case 'refund':
      return (
        <div>
          <ul className="space-y-2.5">
            <Step label="Return filed" />
            <Step label="Processed by the department" />
            <Step label="Refund credited" />
          </ul>
          <p data-q="tick" className="mt-4 text-2xl font-semibold tabular-nums">
            ₹8,240 <span className="text-sm font-normal text-neutral-400">refunded</span>
          </p>
        </div>
      );
  }
}

type IconKind = 'file' | 'scale' | 'tag' | 'chart' | 'scan' | 'chat' | 'check';

function Icon({ kind }: { kind: IconKind }) {
  const props = { viewBox: '0 0 20 20', className: 'h-[18px] w-[18px]', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
  switch (kind) {
    case 'file':
      return (
        <svg {...props}>
          <path d="M5 2.5h6.5L15 6v11.5H5z" />
          <path d="M11.5 2.5V6H15M7.5 10h5M7.5 13h3.5" />
        </svg>
      );
    case 'scale':
      return (
        <svg {...props}>
          <path d="M10 3v14M5 17h10M4 7h12M4 7l-2 5h4zM16 7l-2 5h4z" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...props}>
          <path d="M10.5 2.5 17.5 9.5l-8 8-7-7v-8z" />
          <circle cx="6.5" cy="6.5" r="1.2" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...props}>
          <path d="M3 17.5h14M5.5 14.5v-4M10 14.5V5.5M14.5 14.5v-7" />
        </svg>
      );
    case 'scan':
      return (
        <svg {...props}>
          <path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M13 3h2.5A1.5 1.5 0 0 1 17 4.5V7M17 13v2.5a1.5 1.5 0 0 1-1.5 1.5H13M7 17H4.5A1.5 1.5 0 0 1 3 15.5V13M6 10h8" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...props}>
          <path d="M3.5 4.5h13v9h-7l-4 3v-3h-2z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <circle cx="10" cy="10" r="7" />
          <path d="m7 10.2 2 2 4-4.4" />
        </svg>
      );
  }
}
