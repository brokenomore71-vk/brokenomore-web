'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { Gradient } from '../IntroHero';
import { glideBetweenLabels, pinned, usePointerVars } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';
import { Mark, STATUS_COLOR, SUBS, TOTAL, rupees } from './BillsCity';

// THE POST VERSION, kept for later (switched off in app/features/bills/page.tsx).
// Bills & Subscriptions, as the month's post. Six envelopes fly in out of the dark and land in a
// grid, each one a bill. Then, one step per scroll:
//   1. Every bill, in one place: the flaps open, each bill slides out, and the month adds up
//   2. What's paid: green PAID stamps slam down on the ones already paid
//   3. What's overdue: one envelope shakes, a red OVERDUE stamp, and an alert drops in
//   4. What's coming up: amber sticky notes land on the rest, and a reminder comes in
//   5. Overdue? Sorted in a tap: it comes forward, it's paid over UPI, and PAID slams over OVERDUE
//   6. Your month, in one number: every envelope closes and flies onto a pile, and the summary
//      comes up beside it
// The month is this real month; all figures are illustrative.

const ENV_W = 232;
const ENV_H = 150;
const LETTER_RISE = 92;
const COL_GAP = 30;
const ROW_PITCH = ENV_H + LETTER_RISE + 26;
const SCENE_W = 3 * ENV_W + 2 * COL_GAP;
const SCENE_H = LETTER_RISE + ENV_H + ROW_PITCH + 10;

const PAID_TOTAL = SUBS.filter((s) => s.status === 'paid').reduce((t, s) => t + s.amount, 0);
const OVERDUE = SUBS.find((s) => s.status === 'overdue')!;
const NEXT = SUBS.find((s) => s.status === 'pending')!;

const CAPTIONS = [
  { eyebrow: 'Bills & Subscriptions', title: 'Every bill, delivered.', body: 'Subscriptions, utilities and that annual plan you forgot about, all landing in one place.' },
  { eyebrow: '01 · In one place', title: 'Open the month.', body: 'Every bill and its due date, side by side. This month adds up as they open.' },
  { eyebrow: '02 · Paid', title: 'What’s paid.', body: 'Stamped in green, on the day you paid it.' },
  { eyebrow: '03 · Overdue', title: 'What’s overdue.', body: 'Flagged in red the moment a date slips by.' },
  { eyebrow: '04 · Coming up', title: 'What’s coming up.', body: 'A nudge before each one is due, so nothing sneaks up on you.' },
  { eyebrow: '05 · Pay', title: 'Overdue? Sorted in a tap.', body: 'Pay it straight from the alert over UPI, and it’s stamped paid.' },
  { eyebrow: '06 · Your month', title: 'Your month, in one number.', body: 'What’s gone out, what’s still to come, and never a late fee again.' },
];
const STEPS = CAPTIONS.length - 1;

function useMonth() {
  return useMemo(() => {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = Math.min(days - 13, Math.max(9, now.getDate()));
    const mon = now.toLocaleString('en-IN', { month: 'short' });
    return { name: now.toLocaleString('en-IN', { month: 'long' }), year: now.getFullYear(), today, date: (d: number) => `${d} ${mon}` };
  }, []);
}
type Month = ReturnType<typeof useMonth>;

function Stamp({ k, text, color }: { k: string; text: string; color: string }) {
  return (
    <span
      data-m={k}
      className="pointer-events-none absolute right-3 top-8 rounded-[6px] border-[3px] px-2 py-0.5 text-[17px] font-extrabold tracking-[0.12em] opacity-0"
      style={{ color, borderColor: color, transform: 'rotate(-14deg)', textShadow: `0 0 12px ${color}55`, mixBlendMode: 'multiply', background: `${color}10` }}
    >
      {text}
    </span>
  );
}

// An envelope, with its bill inside
function Envelope({ s, m }: { s: (typeof SUBS)[number]; m: Month }) {
  const due = m.today + s.offset;
  return (
    <div data-m="env" data-key={s.key} className="absolute [transform-style:preserve-3d]" style={{ width: ENV_W, height: ENV_H }}>
      {/* Its glow on the dark */}
      <div data-m="glow" className="absolute -inset-6 rounded-[30px] opacity-0 blur-2xl" style={{ background: STATUS_COLOR.none }} />
      {/* The back of the envelope */}
      <div className="absolute inset-0 rounded-[10px]" style={{ background: 'linear-gradient(180deg,#26232f,#18161f)', boxShadow: '0 30px 50px -12px rgba(0,0,0,0.8)' }} />
      {/* The flap, open behind once it's opened */}
      <div
        data-m="flap"
        className="absolute inset-x-0 top-0 z-[4] h-[62%] [backface-visibility:visible]"
        style={{ transformOrigin: '50% 0%', clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: 'linear-gradient(180deg,#3a3450,#2a2539)' }}
      />
      {/* The bill */}
      <div data-m="letter" className="absolute inset-x-3 top-2 z-[2] h-[136px] rounded-[6px] px-3 pt-2.5 text-[#1d1b17]" style={{ background: 'linear-gradient(180deg,#fbfaf5,#efece3)', boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}>
        <div className="flex items-center gap-2">
          <Mark s={s} size={26} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-bold leading-tight">{s.name}</span>
            <span className="block truncate text-[9.5px] text-[#6b675e]">{s.plan}</span>
          </span>
        </div>
        <div className="mt-2 border-t border-dashed border-[#1d1b17]/25 pt-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#6b675e]">Amount due</p>
          <p className="text-[22px] font-bold leading-none tabular-nums">{rupees(s.amount)}</p>
          <p className="mt-1 text-[10px] text-[#6b675e]">Due {m.date(due)}</p>
        </div>
        <Stamp k="stamp-paid" text="PAID" color="#16a34a" />
        {s.status === 'overdue' && <Stamp k="stamp-overdue" text="OVERDUE" color="#dc2626" />}
        {s.status === 'pending' && (
          <span data-m="note" className="absolute -right-3 -top-3 rotate-[8deg] rounded-[3px] px-2 py-1.5 text-[10px] font-bold leading-tight text-[#3b2a00] opacity-0 shadow-[0_8px_14px_rgba(0,0,0,0.35)]" style={{ background: 'linear-gradient(180deg,#fde68a,#facc15)' }}>
            in {s.offset} days
          </span>
        )}
      </div>
      {/* The front pocket */}
      <div
        className="absolute inset-0 z-[3] rounded-[10px]"
        style={{ clipPath: 'polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)', background: 'linear-gradient(160deg,#322d44 0%,#221f2e 60%,#1b1924 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
      >
        <span className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{s.cat}</span>
        <span className="absolute bottom-2.5 right-3 flex h-7 w-6 items-center justify-center rounded-[3px] border border-dashed border-white/25 text-[8px] text-white/50">₹</span>
      </div>
    </div>
  );
}

export default function BillsMail() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const capsRef = useRef<HTMLDivElement | null>(null);
  const m = useMonth();
  usePointerVars(sectionRef);
  useTypeOnShow(capsRef, '[data-m="cap"]', 36);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string, root: ParentNode = section) => Array.from(root.querySelectorAll<HTMLElement>(`[data-m="${k}"]`));
    const one = (k: string) => q(k)[0];
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [stage] = q('stage');
      const [fit] = q('fit');
      const envs = q('env');
      const caps = q('cap');
      const byKey = (key: string) => envs.find((e) => e.dataset.key === key)!;
      const part = (key: string, k: string) => q(k, byKey(key))[0];
      const fitScale = () => Math.min(1, (stage.clientWidth * 0.96) / SCENE_W, (stage.clientHeight * 0.92) / SCENE_H);
      const slot = (i: number) => ({ x: (i % 3) * (ENV_W + COL_GAP), y: LETTER_RISE + Math.floor(i / 3) * ROW_PITCH });

      gsap.set(fit, { xPercent: -50, yPercent: -50, scale: fitScale });
      envs.forEach((e, i) => gsap.set(e, { left: slot(i).x, top: slot(i).y, transformPerspective: 1400 }));
      gsap.set(caps, { autoAlpha: 0 });
      gsap.set(q('flap'), { rotationX: 0, zIndex: 4 });
      gsap.set(q('stamp-paid'), { scale: 2.6, autoAlpha: 0 });
      gsap.set(q('stamp-overdue'), { scale: 2.6, autoAlpha: 0 });
      gsap.set(q('note'), { scale: 0, autoAlpha: 0, rotation: 40 });

      // ---- The post arrives ----
      const intro = gsap.timeline({ delay: 0.25 });
      envs.forEach((e, i) => {
        intro.fromTo(
          e,
          { z: -1600, y: -200 + ((i * 97) % 300), x: ((i % 3) - 1) * 300, rotationX: 70, rotationY: (i % 2 ? 1 : -1) * 60, rotationZ: (i % 2 ? -1 : 1) * 40, autoAlpha: 0 },
          { z: 0, y: 0, x: 0, rotationX: 12, rotationY: 0, rotationZ: ((i * 37) % 7) - 3, autoAlpha: 1, duration: 1.1, ease: 'power3.out' },
          i * 0.12
        );
      });
      intro.to(envs, { rotationX: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.2');
      intro.to(caps[0], { autoAlpha: 1, duration: 0.3 }, 1.2);
      intro.add(() => {
        envs.forEach((e, i) => gsap.to(e, { yPercent: -3 - (i % 3), duration: 2 + i * 0.25, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      });

      // ---- One step per scroll ----
      const sum = { total: 0, paid: 0 };
      const totalEl = one('total');
      const paidEl = one('paid');
      const render = () => {
        totalEl.textContent = rupees(sum.total);
        paidEl.textContent = sum.paid < 1 ? 'Nothing paid yet' : `${rupees(sum.paid)} paid`;
      };
      const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: { ...pinned(section, STEPS, 9), end: () => `+=${window.innerHeight * 0.6 * STEPS}` } });
      for (let c = 0; c <= STEPS; c++) tl.addLabel(`s${c}`, c);
      for (let c = 1; c <= STEPS; c++) {
        tl.fromTo(caps[c - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.2, immediateRender: false }, c - 1 + 0.05);
        tl.fromTo(caps[c], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, c - 1 + 0.2);
      }
      const slam = (el: Element, at: number) => {
        tl.fromTo(el, { scale: 2.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.14, ease: 'power4.in', immediateRender: false }, at);
        tl.fromTo(el.closest('[data-m="env"]')!, { y: 0 }, { y: 7, duration: 0.05, yoyo: true, repeat: 1, immediateRender: false }, at + 0.14);
      };
      const glow = (key: string, color: string, at: number, a = 0.55) => tl.to(part(key, 'glow'), { background: color, opacity: a, duration: 0.2 }, at);

      // 1. Open the month: flaps fold back, bills slide out, the total adds up
      tl.to(one('bar'), { autoAlpha: 1, y: 0, duration: 0.25 }, 0.1);
      envs.forEach((e, i) => {
        const at = 0.2 + i * 0.07;
        tl.to(q('flap', e), { rotationX: -180, duration: 0.25, ease: 'power2.inOut' }, at);
        tl.set(q('flap', e), { zIndex: 1 }, at + 0.13);
        tl.to(q('letter', e), { y: -LETTER_RISE, duration: 0.3, ease: 'power2.out' }, at + 0.15);
      });
      tl.to(sum, { total: TOTAL, duration: 0.5, ease: 'power2.out' }, 0.3);

      // 2. Paid: green stamps slam down
      SUBS.filter((s) => s.status === 'paid').forEach((s, i) => {
        const at = 1.25 + i * 0.22;
        slam(part(s.key, 'stamp-paid'), at);
        glow(s.key, STATUS_COLOR.paid, at + 0.12);
        tl.to(sum, { paid: `+=${s.amount}`, duration: 0.15 }, at + 0.12);
      });

      // 3. Overdue: it shakes, the red stamp, the alert
      const od = byKey(OVERDUE.key);
      tl.fromTo(od, { rotationZ: 0 }, { rotationZ: 4, duration: 0.04, yoyo: true, repeat: 5, immediateRender: false }, 2.2);
      slam(part(OVERDUE.key, 'stamp-overdue'), 2.45);
      glow(OVERDUE.key, STATUS_COLOR.overdue, 2.55, 0.7);
      tl.fromTo(one('alert'), { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, 2.6);

      // 4. Coming up: sticky notes, and a reminder
      tl.to(one('alert'), { autoAlpha: 0, y: -40, duration: 0.2 }, 3.1);
      SUBS.filter((s) => s.status === 'pending').forEach((s, i) => {
        const at = 3.2 + i * 0.12;
        tl.to(part(s.key, 'note'), { scale: 1, autoAlpha: 1, rotation: 8, duration: 0.2, ease: 'back.out(2.5)' }, at);
        glow(s.key, STATUS_COLOR.pending, at + 0.05, 0.35);
      });
      tl.fromTo(one('nudge'), { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, 3.6);

      // 5. Pay it: the overdue bill comes forward, UPI, PAID over OVERDUE
      tl.to(one('nudge'), { autoAlpha: 0, y: -40, duration: 0.2 }, 4.1);
      tl.to(envs.filter((e) => e !== od), { autoAlpha: 0.3, duration: 0.25 }, 4.15);
      tl.to(od, { z: 260, x: () => SCENE_W / 2 - ENV_W / 2 - Number(gsap.getProperty(od, 'left')), y: () => SCENE_H / 2 - ENV_H / 2 - Number(gsap.getProperty(od, 'top')) + 20, rotationZ: 0, duration: 0.4, ease: 'power3.inOut' }, 4.15);
      tl.fromTo(one('pay'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out', immediateRender: false }, 4.45);
      tl.to(one('pay-btn'), { scale: 0.93, duration: 0.05 }, 4.65);
      tl.to(one('pay-btn'), { scale: 1, duration: 0.08 }, 4.7);
      tl.to(one('pay-done'), { autoAlpha: 1, duration: 0.1 }, 4.72);
      tl.to(part(OVERDUE.key, 'stamp-overdue'), { opacity: 0.35, duration: 0.1 }, 4.75);
      slam(part(OVERDUE.key, 'stamp-paid'), 4.78);
      glow(OVERDUE.key, STATUS_COLOR.paid, 4.9, 0.6);
      tl.to(sum, { paid: `+=${OVERDUE.amount}`, duration: 0.15 }, 4.9);
      tl.to(one('pay'), { autoAlpha: 0, y: 30, duration: 0.2 }, 5.02);

      // 6. The month: everything closes and flies onto a pile, and the summary comes up
      const pileX = () => (stage.clientWidth < 768 ? SCENE_W / 2 - ENV_W / 2 : -40);
      envs.forEach((e, i) => {
        const at = 5.1 + i * 0.05;
        tl.to(q('letter', e), { y: 0, duration: 0.2, ease: 'power2.in' }, at);
        tl.set(q('flap', e), { zIndex: 4 }, at + 0.14);
        tl.to(q('flap', e), { rotationX: 0, duration: 0.2 }, at + 0.14);
        tl.to(e, { autoAlpha: 1, z: i * 6, x: () => pileX() - Number(gsap.getProperty(e, 'left')), y: () => SCENE_H / 2 - ENV_H / 2 - Number(gsap.getProperty(e, 'top')) - i * 6, rotationZ: (i % 2 ? 1 : -1) * (2 + i), rotationX: 0, duration: 0.4, ease: 'power3.inOut' }, at + 0.25);
      });
      tl.to(q('glow'), { opacity: 0.18, duration: 0.3 }, 5.4);
      tl.fromTo(one('summary'), { autoAlpha: 0, x: 60, rotationY: -20 }, { autoAlpha: 1, x: 0, rotationY: 0, duration: 0.35, ease: 'power3.out', immediateRender: false }, 5.6);
      tl.to(one('ring'), { strokeDasharray: `${(PAID_TOTAL + OVERDUE.amount) / TOTAL} 1`, duration: 0.35, ease: 'power2.out' }, 5.7);
      tl.set({}, {}, STEPS);

      render();
      const unglide = glideBetweenLabels(tl);
      return () => {
        unglide();
        intro.kill();
      };
    });
    return () => mm.revert();
  }, []);

  const toast = 'absolute left-1/2 top-0 z-30 w-[min(420px,92vw)] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur';

  return (
    <section ref={sectionRef} aria-label="Bills and Subscriptions" className="relative h-[calc(100svh-72px)] min-h-[600px] w-full overflow-hidden bg-black text-white select-none motion-reduce:h-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_62%_55%,rgba(110,91,255,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_25%_30%_at_75%_80%,rgba(232,106,180,0.08),transparent_70%)]" />

      <div className="relative mx-auto grid h-full max-w-7xl grid-rows-[auto_1fr] px-4 sm:px-8 md:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.6fr)] md:grid-rows-1 md:items-center md:gap-6">
        {/* The words */}
        <div ref={capsRef} className="relative z-20 min-h-[96px] pt-6 md:min-h-[260px] md:pt-0">
          {CAPTIONS.map((c, i) => (
            <div key={c.title} data-m="cap" className={`absolute inset-x-0 top-6 md:top-0 ${i ? 'motion-reduce:hidden' : ''}`}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">{c.eyebrow}</p>
              {i === 0 ? (
                <h1 className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[60px]">
                  Every bill, <Gradient>delivered.</Gradient>
                </h1>
              ) : (
                <h2 className="mt-3 text-[26px] font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[48px]">{c.title}</h2>
              )}
              <p className="mt-3 hidden max-w-md text-[15px] leading-relaxed text-neutral-400 sm:block sm:text-lg">{c.body}</p>
            </div>
          ))}
        </div>

        {/* The post */}
        <div data-m="stage" className="relative h-full min-h-0 [perspective:1600px]">
          {/* The month, adding up */}
          <div data-m="bar" className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border border-white/10 bg-[#141416]/90 px-4 py-2 text-[13px] opacity-0 backdrop-blur md:top-8">
            <span className="font-semibold">
              {m.name} {m.year}
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span data-m="total" className="font-bold tabular-nums">
              ₹0
            </span>
            <span className="text-neutral-500">this month</span>
            <span className="h-3 w-px bg-white/15" />
            <span data-m="paid" className="text-[#22C55E]">
              Nothing paid yet
            </span>
          </div>

          <div className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: 'rotateX(calc(var(--py, 0) * -4deg)) rotateY(calc(var(--px, 0) * 6deg))' }}>
            <div data-m="fit" className="absolute left-1/2 top-[54%] [transform-style:preserve-3d]" style={{ width: SCENE_W, height: SCENE_H }}>
              {SUBS.map((s) => (
                <Envelope key={s.key} s={s} m={m} />
              ))}
            </div>
          </div>

          {/* The overdue alert, and the reminder */}
          <div data-m="alert" className={`${toast} mt-16 flex items-center gap-3 border-[#EF4444]/60 bg-[#2a0f12]/95 opacity-0 md:mt-20`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-lg font-bold">!</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{OVERDUE.name} is overdue</span>
              <span className="block text-[12px] text-[#fca5a5]">
                {rupees(OVERDUE.amount)} was due on {m.date(m.today + OVERDUE.offset)}
              </span>
            </span>
            <span className="rounded-full bg-[#EF4444] px-3 py-1 text-[12px] font-semibold">Pay</span>
          </div>
          <div data-m="nudge" className={`${toast} mt-16 flex items-center gap-3 border-white/10 bg-[#1f2026]/95 opacity-0 md:mt-20`}>
            <span className="text-xl">🔔</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] text-[#85868c]">BrokeNoMore · now</span>
              <span className="block text-[14px] font-semibold">
                {NEXT.name} renews in {NEXT.offset} days
              </span>
              <span className="block text-[12px] text-[#EAB308]">
                {rupees(NEXT.amount)} on {m.date(m.today + NEXT.offset)}
              </span>
            </span>
          </div>

          {/* Paying it */}
          <div data-m="pay" className="absolute bottom-6 left-1/2 z-30 w-[min(360px,90%)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1b1c21]/95 p-4 opacity-0 shadow-[0_30px_60px_rgba(0,0,0,0.7)] backdrop-blur">
            <div className="flex items-center justify-between rounded-xl bg-[#131418] px-4 py-2.5 text-[13px]">
              <span className="text-[#85868c]">Pay with</span>
              <span className="font-semibold">UPI · you@bank</span>
            </div>
            <div className="relative mt-3 h-11">
              <div data-m="pay-btn" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#6E5BFF] text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(110,91,255,0.9)]">
                Pay {rupees(OVERDUE.amount)}
              </div>
              <div data-m="pay-done" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#22C55E] text-[15px] font-semibold text-[#052e16] opacity-0">
                ✓ Paid, stamped and sorted
              </div>
            </div>
          </div>

          {/* The month at a glance */}
          <div data-m="summary" className="absolute right-0 top-1/2 z-30 w-[min(340px,92%)] -translate-y-1/2 rounded-[26px] border border-white/10 bg-[#131418]/95 p-5 opacity-0 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur max-md:left-1/2 max-md:right-auto max-md:top-auto max-md:bottom-4 max-md:-translate-x-1/2 max-md:translate-y-0">
            <p className="text-[11px] font-semibold tracking-[0.15em] text-white/50">{m.name.toUpperCase()} AT A GLANCE</p>
            <div className="mt-4 flex items-center gap-4">
              <svg viewBox="0 0 120 120" className="h-[96px] w-[96px] shrink-0 -rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                <circle data-m="ring" cx="60" cy="60" r="48" fill="none" stroke="#22C55E" strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray="0 1" />
              </svg>
              <div>
                <p className="text-[12px] text-[#85868c]">Bills this month</p>
                <p className="text-[28px] font-bold leading-tight tabular-nums">{rupees(TOTAL)}</p>
                <p className="mt-1 text-[12px] leading-snug">
                  <span className="text-[#22C55E]">{rupees(PAID_TOTAL + OVERDUE.amount)} paid</span>
                  <br />
                  <span className="text-[#EAB308]">{rupees(TOTAL - PAID_TOTAL - OVERDUE.amount)} still to come</span>
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#22C55E]/40 bg-[#22C55E]/10 px-4 py-3 text-[13px] text-[#bbf7d0]">0 late fees this month. Every due date had a reminder.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
