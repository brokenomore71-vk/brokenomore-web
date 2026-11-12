'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Bills & Subscriptions, on a 3D desk calendar in the middle of the screen. The first scroll brings
// it in, the next flips it to this month. Then one scroll each for what's paid (green), what's
// overdue (red) and what's pending (yellow): their dates are circled in that colour and their
// cards pop out and scatter around the calendar. A last scroll pays the overdue bill.

const LEAN = 20; // degrees the front of the stand leans back from upright
const ENTER = 1; // the first scroll step: the calendar comes in
const TURN = 16; // degrees it's turned towards the right
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SHEETS = 6; // pages in the stack under this month's
const PAST_MONTHS = 3; // flipped past, all on the first scroll
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type Status = 'paid' | 'overdue' | 'pending';

// Days relative to today: paid ones before it, the overdue one just before it, pending ones after
const SUBSCRIPTIONS = [
  { name: 'Netflix', plan: 'Premium · monthly', mark: 'N', amount: 649, offset: -8, status: 'paid', color: '#E50914', ink: '#FFFFFF' },
  { name: 'Amazon Prime', plan: 'Annual plan', mark: 'prime', amount: 1499, offset: -5, status: 'paid', color: '#00A8E1', ink: '#FFFFFF' },
  { name: 'Electricity', plan: 'BESCOM · monthly', mark: '⚡', amount: 1840, offset: -2, status: 'overdue', color: '#F5B400', ink: '#1A1A1A' },
  { name: 'Spotify', plan: 'Individual · monthly', mark: '♫', amount: 119, offset: 3, status: 'pending', color: '#1DB954', ink: '#0B1A10' },
  { name: 'YouTube Premium', plan: 'Family · monthly', mark: '▶', amount: 299, offset: 7, status: 'pending', color: '#FF0033', ink: '#FFFFFF' },
  { name: 'Disney+ Hotstar', plan: 'Super · quarterly', mark: 'D+', amount: 899, offset: 12, status: 'pending', color: '#1F3FB8', ink: '#FFFFFF' },
] as const;

const STATUS: Record<Status, { color: string; tint: string; word: string }> = {
  paid: { color: '#22C55E', tint: 'rgba(34,197,94,0.18)', word: 'Paid on' },
  overdue: { color: '#EF4444', tint: 'rgba(239,68,68,0.18)', word: 'Overdue since' },
  pending: { color: '#EAB308', tint: 'rgba(234,179,8,0.2)', word: 'Due on' },
};
// The order they're shown in, one scroll each
const GROUPS: Status[] = ['paid', 'overdue', 'pending'];

// Where each card comes to rest around the calendar: [x, y] as fractions of the stage, and a tilt
const SCATTER_WIDE: [number, number, number][] = [
  [0.15, 0.2, -6],
  [0.13, 0.58, 4],
  [0.85, 0.22, 5],
  [0.87, 0.55, -4],
  [0.18, 0.8, -3],
  [0.82, 0.78, 4],
];
const SCATTER_NARROW: [number, number, number][] = [
  [0.28, 0.57, -4],
  [0.72, 0.61, 4],
  [0.3, 0.73, 3],
  [0.7, 0.77, -3],
  [0.28, 0.89, -2],
  [0.72, 0.93, 3],
];

// The stand's glossy finish
const STAND = 'linear-gradient(140deg, #141416 0%, #26272b 32%, #3d3e44 55%, #5a5b62 64%, #2c2d31 80%, #121214 100%)';
const STAND_SIDE = 'linear-gradient(160deg, #18181b 0%, #2f3034 40%, #63646b 58%, #2c2d31 75%, #131315 100%)';

const CAPTIONS = [
  { title: 'Every bill, on one calendar.', body: 'Subscriptions and utilities, right where they fall.' },
  { title: 'What’s paid.', body: 'Ticked off in green, on the day you paid it.' },
  { title: 'What’s overdue.', body: 'Flagged in red the moment a date slips by.' },
  { title: 'What’s coming up.', body: 'Pending in yellow, with a nudge before each one is due.' },
  { title: 'Overdue? Sorted in a tap.', body: 'Pay it, and it turns green.' },
];

function buildMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = i - lead + 1;
    return { day: d, inMonth: d >= 1 && d <= days };
  });
  // Drop a last row that's entirely next month
  const rows = cells.slice(35).some((c) => c.inMonth) ? 6 : 5;
  return { name: date.toLocaleString('en-IN', { month: 'long' }), year, days, cells: cells.slice(0, rows * 7), rows };
}

export default function BillsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const { month, past, subs, today } = useMemo(() => {
    const now = new Date();
    const m = buildMonth(now);
    // Each on its own day, within the month and never on today
    const used = new Set<number>([now.getDate()]);
    const placed = SUBSCRIPTIONS.map((s) => {
      let day = Math.min(m.days, Math.max(1, now.getDate() + s.offset));
      const step = s.offset < 0 ? -1 : 1;
      while (used.has(day)) {
        day += step;
        if (day < 1) day = m.days;
        if (day > m.days) day = 1;
      }
      used.add(day);
      return { ...s, status: s.status as Status, day };
    });
    const before = Array.from({ length: PAST_MONTHS }, (_, k) => buildMonth(new Date(now.getFullYear(), now.getMonth() - PAST_MONTHS + k, 1)));
    return { month: m, past: before, subs: placed, today: now.getDate() };
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const qa = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-b="${k}"]`));
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const calendar = qa('calendar')[0];
      const captions = qa('caption');
      const cells = subs.map((s) => section.querySelector<HTMLElement>(`[data-b="sub-cell"][data-day="${s.day}"]`)!);
      const rings = qa('ring');
      const cards = qa('card');
      const flips = qa('flip');
      const narrow = () => stage.clientWidth < 768;

      // A date's centre on the stage, and where its card comes to rest
      const boxOf = (i: number) => {
        const s = stage.getBoundingClientRect();
        const r = cells[i].getBoundingClientRect();
        return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
      };
      const restOf = (i: number) => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        const [fx, fy, tilt] = (narrow() ? SCATTER_NARROW : SCATTER_WIDE)[i % 6];
        const s = narrow() ? 0.5 : 0.92;
        const halfW = (290 * s) / 2;
        const halfH = (92 * s) / 2 + 6;
        let x = w * fx;
        if (!narrow()) {
          // Just beside the calendar, a little in or out per row so they still look scattered
          const calendarHalf = Math.min(390, w * 0.64, window.innerHeight * 0.5) / 2 + 20;
          const gap = [30, 60, 40][Math.min(2, Math.floor(fy * 3))] ?? 40;
          x = w / 2 + (fx < 0.5 ? -1 : 1) * (calendarHalf + gap + halfW);
        }
        // Kept inside the stage, whatever its shape
        return { x: Math.min(w - halfW - 10, Math.max(halfW + 10, x)), y: Math.min(h - halfH, Math.max(halfH, h * fy)), s, tilt };
      };

      gsap.set(calendar, { rotateX: 6, rotateY: TURN });

      const entrance = qa('entrance')[0];
      const shadow = qa('shadow');
      gsap.set(entrance, { y: 260, rotateY: 75, rotateX: -22, scale: 0.75, autoAlpha: 0 });
      gsap.set(shadow, { opacity: 0, scale: 0.4 });
      gsap.set(captions, { autoAlpha: 0, y: 14 });
      gsap.set(captions[0], { autoAlpha: 1, y: 0 });
      rings.forEach((ring, i) => gsap.set(ring, { strokeDashoffset: 1, stroke: STATUS[subs[i].status].color }));
      gsap.set(cards, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.1 });
      gsap.set(flips, { rotateY: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top 72px',
          end: () => `+=${window.innerHeight * 0.6 * (GROUPS.length + 4)}`,
          pin: true,
          scrub: 0.8,
          refreshPriority: -1,
          invalidateOnRefresh: true,
        },
      });
      tl.addLabel('start', 0);

      // ---- The first scroll brings the calendar in: it rises from below and swings round ----
      tl.to(entrance, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0);
      tl.to(entrance, { y: 0, rotateX: 0, scale: 1, duration: 0.85, ease: 'back.out(1.5)' }, 0);
      tl.to(entrance, { rotateY: 0, duration: 1, ease: 'power3.out' }, 0);
      tl.to(shadow, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 0.2);
      tl.addLabel('calendar', ENTER);

      // ---- The first scroll flips the past months over the rings, landing on this one ----
      const leaves = qa('leaf');
      leaves.forEach((leaf, k) => {
        gsap.set(leaf, { rotateX: LEAN + 2.8, z: 2 + (leaves.length - k) * 1.2, autoAlpha: 1 });
        const start = ENTER + k * 0.2;
        tl.to(leaf, { rotateX: 360 - LEAN - 6, duration: 0.55, ease: 'power2.inOut' }, start);
        // Gone once it's over the top and behind the stand
        tl.to(leaf, { autoAlpha: 0, duration: 0.06 }, start + 0.45);
      });
      tl.addLabel('this-month', ENTER + 1.1);

      // ---- One scroll each for paid, overdue and pending: their dates are circled in that
      // colour, and their cards pop out of the dates and scatter around the calendar ----
      let at = ENTER + 1.1;
      tl.to(captions[0], { autoAlpha: 0, y: -14, duration: 0.3 }, at);
      GROUPS.forEach((status, g) => {
        if (g > 0) tl.to(captions[g], { autoAlpha: 0, y: -14, duration: 0.3 }, at);
        tl.to(captions[g + 1], { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.2);
        const members = subs.map((s, i) => (s.status === status ? i : -1)).filter((i) => i >= 0);
        members.forEach((i, n) => {
          const t = at + n * 0.14;
          tl.to(rings[i], { strokeDashoffset: 0, duration: 0.45, ease: 'power2.inOut' }, t);
          tl.to(cells[i], { backgroundColor: STATUS[status].tint, duration: 0.3 }, t + 0.1);
          tl.fromTo(
            cards[i],
            { x: () => boxOf(i).x, y: () => boxOf(i).y, z: 0, scale: 0.1, rotateY: 0, rotateZ: 0, autoAlpha: 0 },
            {
              x: () => restOf(i).x,
              y: () => restOf(i).y,
              scale: () => restOf(i).s,
              rotateZ: 0,
              rotateY: 0,
              autoAlpha: 1,
              duration: 0.75,
              ease: 'back.out(1.5)',
              immediateRender: false,
            },
            t + 0.2
          );
        });
        tl.to(calendar, { rotateY: TURN - (g + 1) * 2, duration: 1, ease: 'power1.inOut' }, at);
        at += 1;
        tl.addLabel(`status-${status}`, at);
      });

      // ---- A last scroll pays the overdue bill: its card flips and its date turns green ----
      tl.to(captions[GROUPS.length], { autoAlpha: 0, y: -14, duration: 0.3 }, at);
      tl.to(captions[GROUPS.length + 1], { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.2);
      subs.forEach((s, i) => {
        if (s.status !== 'overdue') return;
        tl.to(cards[i], { scale: () => restOf(i).s * 1.12, duration: 0.3, ease: 'power2.out' }, at + 0.1);
        tl.to(flips[i], { rotateY: 180, duration: 0.6, ease: 'power2.inOut' }, at + 0.25);
        tl.to(rings[i], { stroke: STATUS.paid.color, duration: 0.3 }, at + 0.45);
        tl.to(cells[i], { backgroundColor: STATUS.paid.tint, duration: 0.3 }, at + 0.45);
        tl.to(cards[i], { scale: () => restOf(i).s, duration: 0.3, ease: 'power2.inOut' }, at + 0.75);
      });
      tl.to(calendar, { rotateY: TURN - 4, duration: 1 }, at);
      at += 1;
      tl.addLabel('settled', at);

      // ---- Each scroll moves exactly one step: when the scroll comes to rest inside the
      // calendar, it glides on to the next step in the direction it was going ----
      const st = tl.scrollTrigger!;
      const stops = () => Object.values(tl.labels).map((t) => t / tl.duration()).sort((a, b) => a - b);
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
        const onStop = list.some((q) => Math.abs(q - p) < eps);
        if (dir === 0 || onStop) {
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

      ScrollTrigger.sort();
      return () => {
        ScrollTrigger.removeEventListener('scrollEnd', onScrollEnd);
      };
    });

    return () => mm.revert();
  }, [subs]);

  return (
    <>
      <section
        ref={sectionRef}
        id="bills"
        data-bills
        aria-label="Bills and subscriptions"
        className="relative flex w-full h-[calc(100svh-72px)] flex-col overflow-hidden bg-black text-[#F5F5F5] select-none motion-reduce:hidden"
      >
        {/* A soft light on the desk */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_45%_at_50%_60%,rgba(255,255,255,0.07),transparent_70%)]" />

        {/* Captions */}
        <div className="relative z-30 shrink-0 px-4 pt-6 text-center sm:pt-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">Bills &amp; Subscriptions</p>
          <div className="relative mx-auto mt-2 min-h-[64px] max-w-2xl sm:min-h-[96px]">
            {CAPTIONS.map((c) => (
              <div key={c.title} data-b="caption" className="absolute inset-x-0 top-0">
                <h2 className="text-xl xs:text-2xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{c.title}</h2>
                <p className="mt-1 sm:mt-2 text-xs sm:text-base text-neutral-400">{c.body}</p>
              </div>
            ))}
          </div>
          {/* What the colours mean */}
          <div className="mt-1 flex items-center justify-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-neutral-400">
            {GROUPS.map((status) => (
              <span key={status} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS[status].color }} />
                {status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Pending'}
              </span>
            ))}
          </div>
        </div>

        {/* The desk calendar */}
        <div ref={stageRef} className="relative min-h-0 flex-1 [perspective:1600px]">
          <div
            className="absolute left-1/2 top-[5%] md:top-[9%] [transform-style:preserve-3d]"
            style={
              {
                '--w': 'min(390px, 80vw, 48svh)',
                '--h': 'calc(var(--w) * 0.92)',
                '--depth': `calc(var(--h) * ${Math.sin((LEAN * Math.PI) / 180).toFixed(4)})`,
                '--rise': `calc(var(--h) * ${Math.cos((LEAN * Math.PI) / 180).toFixed(4)})`,
              } as React.CSSProperties
            }
          >
            <div data-b="entrance" className="relative [transform-style:preserve-3d]">
            <div data-b="calendar" className="relative [transform-style:preserve-3d]">
              {/* Shadow on the desk */}
              <div data-b="shadow" className="pointer-events-none absolute left-1/2 top-[calc(var(--rise)-1.5rem)] h-20 w-[calc(var(--w)*1.3)] -translate-x-1/2 rounded-[50%] bg-black/80 blur-2xl" />

              {/* The stand: front and back boards meeting at the top */}
              <Board style={{ transform: `translateX(-50%) rotateX(${LEAN}deg) translateZ(-6px)` }} />
              <Board style={{ transform: `translateX(-50%) rotateX(${360 - LEAN}deg)` }} back />
              {/* Its triangular sides */}
              {[-1, 1].map((side) => (
                <div
                  key={side}
                  className="absolute left-0 top-0 h-[var(--rise)] w-[calc(var(--depth)*2)] [transform-origin:50%_0%]"
                  style={{
                    transform: `translateX(calc(${side} * var(--w) / 2 * 1.04 - var(--depth))) rotateY(90deg)`,
                    clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
                    background: STAND_SIDE,
                  }}
                />
              ))}

              {/* The stack of pages under this month's, fanned a little at the bottom */}
              {Array.from({ length: SHEETS }, (_, k) => (
                <div
                  key={k}
                  className="absolute left-0 top-0 h-[calc(var(--h)*0.94)] w-[calc(var(--w)*0.94)] rounded-[1.4rem] border border-black/10 bg-[#dfe1ea] [transform-origin:50%_0%]"
                  style={{
                    transform: `translateX(-50%) translateY(calc(var(--w) * 0.05)) rotateX(${LEAN + 2.2 - k * 0.35}deg) translateZ(${-(k + 1) * 1.5}px)`,
                    filter: `brightness(${1 - k * 0.06})`,
                  }}
                />
              ))}

              {/* The months flipped past on the first scroll, on top; this month's page beneath */}
              {[...past, month].map((m, k) => {
                const isCurrent = k === past.length;
                return (
                  <div
                    key={`${m.year}-${m.name}`}
                    className="absolute left-0 top-0 h-[calc(var(--h)*0.94)] w-[calc(var(--w)*0.94)] [transform-style:preserve-3d]"
                    style={{ transform: 'translateX(-50%) translateY(calc(var(--w) * 0.05))' }}
                  >
                    <div
                      data-b={isCurrent ? 'current-leaf' : 'leaf'}
                      className="absolute inset-0 [transform-origin:50%_0%] [transform-style:preserve-3d]"
                      style={{ transform: `rotateX(${LEAN + 2.8}deg) translateZ(${2 + (past.length - k) * 1.2}px)` }}
                    >
                      <PageFront month={m} subs={isCurrent ? subs : []} today={isCurrent ? today : -1} />
                      {/* The back of the sheet, seen as it goes over the rings */}
                      <div className="absolute inset-0 rounded-[1.4rem] bg-[#d4d6dd] [backface-visibility:hidden] [transform:rotateX(180deg)]" />
                    </div>
                  </div>
                );
              })}

              {/* The two binder rings, through the holes and over the top of the stand */}
              {[0.27, 0.73].map((x) => (
                <div
                  key={x}
                  className="absolute top-0 h-[calc(var(--w)*0.17)] w-[calc(var(--w)*0.17)] rounded-full border-[calc(var(--w)*0.022)] border-[#c4c6cc] shadow-[inset_0_0_6px_rgba(0,0,0,0.5),0_2px_6px_rgba(0,0,0,0.5)]"
                  style={{
                    left: `calc(var(--w) * ${(x - 0.5).toFixed(2)})`,
                    transform: 'translate(-50%, -38%) rotateY(90deg)',
                    borderTopColor: '#f2f3f5',
                    borderLeftColor: '#7d7f86',
                  }}
                />
              ))}
            </div>
            </div>
          </div>

          {/* The subscription cards, popping out of their dates */}
          <div className="pointer-events-none absolute inset-0 z-40 [perspective:1200px]">
            {subs.map((sub) => (
              <div key={sub.name} data-b="card" className="absolute left-0 top-0 [transform-style:preserve-3d]" style={{ visibility: 'hidden' }}>
                <div data-b="flip" className="relative h-[92px] w-[290px] [transform-style:preserve-3d]">
                  <CardFace sub={sub} status={sub.status} />
                  <CardFace sub={sub} status="paid" back />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Without motion: this month's payments, listed */}
      <div className="hidden motion-reduce:block w-full bg-black px-4 py-16 text-[#F5F5F5]">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Bills &amp; Subscriptions</h2>
        <ul className="mx-auto mt-8 grid max-w-md gap-3">
          {subs.map((sub) => (
            <li key={sub.name} className="relative h-[92px]">
              <CardFace sub={sub} status={sub.status} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// One board of the stand, hinged at the top
function Board({ style, back = false }: { style: React.CSSProperties; back?: boolean }) {
  return (
    <div
      className="absolute left-0 top-0 h-[var(--h)] w-[calc(var(--w)*1.04)] rounded-b-2xl rounded-t-md [transform-origin:50%_0%]"
      style={{ ...style, background: STAND, filter: back ? 'brightness(0.75)' : undefined }}
    >
      {/* A glossy streak */}
      <span className="pointer-events-none absolute inset-0 rounded-b-2xl rounded-t-md bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.14)_45%,transparent_58%)]" />
    </div>
  );
}

type Sub = { name: string; plan: string; mark: string; amount: number; color: string; ink: string; day: number; status: Status };
type MonthSheet = ReturnType<typeof buildMonth>;

// One sheet of the calendar: the month, the weekdays and the dates
function PageFront({ month, subs, today }: { month: MonthSheet; subs: Sub[]; today: number }) {
  const subOnDay = new Map(subs.map((s, i) => [s.day, i]));
  return (
<div className="absolute inset-0 flex flex-col overflow-hidden [backface-visibility:hidden] rounded-[1.4rem] bg-gradient-to-b from-[#f7f8fc] to-[#e9ebf3] px-[7%] pt-[13%] pb-[7%] text-[#1d1f2e] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
                  {/* The punched holes the rings go through */}
                  {[0.27, 0.73].map((x) => (
                    <span key={x} className="absolute top-[3.5%] h-[5%] w-[3.2%] -translate-x-1/2 rounded-full bg-[#2c2c3a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" style={{ left: `${x * 100}%` }} />
                  ))}
                  <div className="flex items-baseline justify-between">
                    <p className="text-[calc(var(--w)*0.075)] font-bold leading-none tracking-tight">{month.name}</p>
                    <p className="text-[calc(var(--w)*0.04)] font-medium text-[#8b8fa8] tabular-nums">{month.year}</p>
                  </div>
                  <div className="mt-[4%] grid grid-cols-7 text-center text-[calc(var(--w)*0.03)] font-semibold text-[#9a9db3]">
                    {WEEKDAYS.map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                  <div
                    className="mt-[2%] grid flex-1 grid-cols-7 text-center text-[calc(var(--w)*0.052)] font-medium tabular-nums"
                    style={{ gridTemplateRows: `repeat(${month.rows}, minmax(0, 1fr))` }}
                  >
                    {month.cells.map((cell, i) => {
                      const subIndex = cell.inMonth ? subOnDay.get(cell.day) : undefined;
                      const isToday = cell.inMonth && cell.day === today;
                      const weekend = i % 7 >= 5;
                      return (
                        <div
                          key={i}
                          data-b={subIndex !== undefined ? 'sub-cell' : undefined}
                          data-day={subIndex !== undefined ? cell.day : undefined}
                          className="relative flex items-center justify-center rounded-lg"
                        >
                          {cell.inMonth && (
                            <span
                              className={`relative z-10 ${weekend ? 'text-[#8b8fa8]' : ''} ${
                                isToday ? 'flex h-[1.7em] w-[1.7em] items-center justify-center rounded-full bg-[#1d1f2e] text-white' : ''
                              }`}
                            >
                              {cell.day}
                            </span>
                          )}
                          {subIndex !== undefined && (
                            /* A pen circle around the date */
                            <svg viewBox="0 0 40 40" className="pointer-events-none absolute left-1/2 top-1/2 h-[2.2em] w-[2.2em] -translate-x-1/2 -translate-y-1/2 overflow-visible" aria-hidden="true">
                              <path
                                data-b="ring"
                                d="M21 4.5c9.5.4 15.5 7 15 15.6-.5 9.2-7.6 15.6-16.6 15.4C10.6 35.3 4 28.7 4.3 19.7 4.6 11 11.8 4.6 22.5 5.3c3 .2 5.2 1 7 2.2"
                                fill="none"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                pathLength={1}
                                strokeDasharray="1"
                              />
                            </svg>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
  );
}

function CardFace({ sub, status, back = false }: { sub: Sub; status: Status; back?: boolean }) {
  const { color, word } = STATUS[status];
  return (
    <div
      className={`absolute inset-0 flex items-center gap-3.5 rounded-2xl border bg-[#141414] px-4 shadow-[0_28px_56px_rgba(0,0,0,0.75)] [backface-visibility:hidden] ${back ? '[transform:rotateY(180deg)]' : ''}`}
      style={{ borderColor: `${color}80` }}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-base font-extrabold tracking-tight" style={{ background: sub.color, color: sub.ink }}>
        {sub.mark}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{sub.name}</p>
        <p className="truncate text-xs text-neutral-500">{sub.plan}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
          {status === 'paid' ? (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m2.5 6.3 2.2 2.2 4.8-5" />
            </svg>
          ) : status === 'overdue' ? (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 2.5v4.2M6 9.3v.2" />
            </svg>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          )}
          {word} {sub.day}
        </p>
      </div>
      <p className="text-base font-semibold tabular-nums">{inr(sub.amount)}</p>
    </div>
  );
}
