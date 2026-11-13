'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { Gradient } from '../IntroHero';
import { glideBetweenLabels, pinned } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';
import { Mark, STATUS_COLOR, SUBS, TOTAL, rupees } from './BillsCity';

// THE TUNNEL VERSION, kept for later (switched off in app/features/bills/page.tsx).
// Bills & Subscriptions, as a flight through the month. Every day is a glowing ring, and the
// rings make a tunnel stretching off into the dark; every bill hangs in the tunnel on its due
// date. Scrolling flies you forward through time:
//   1. What's paid: you fly past Netflix and Prime, they flash green, and they land in the mirror
//   2. What's overdue: the tunnel flashes red as Electricity looms up ahead, and an alert comes in
//   3. What's coming up: you reach today's white ring; the bills ahead glow amber, counting down
//   4. Sorted in a tap: pay it from the alert, and in the mirror it turns green
//   5. Your month, in one number: the camera pulls out and swings round, and the whole month
//      hangs there as one coil of rings, with the summary beside it
// The month is this real month; all figures are illustrative.

const SP = 320; // distance between two days
const R = 360; // a ring's radius
const PERSPECTIVE = 700;
const PAID_TOTAL = SUBS.filter((s) => s.status === 'paid').reduce((t, s) => t + s.amount, 0);
const OVERDUE = SUBS.find((s) => s.status === 'overdue')!;
const NEXT = SUBS.find((s) => s.status === 'pending')!;

const CAPTIONS = [
  { eyebrow: 'Bills & Subscriptions', title: 'Fly through your month.', body: 'Every day a ring, every bill waiting on its date. Scroll to travel through time.' },
  { eyebrow: '01 · Paid', title: 'What’s paid.', body: 'Ticked off in green the moment you pay, and left behind you.' },
  { eyebrow: '02 · Overdue', title: 'What’s overdue.', body: 'Flagged in red the moment a date slips by. Nothing sneaks past.' },
  { eyebrow: '03 · Coming up', title: 'What’s coming up.', body: 'Everything ahead of today, counting down, with a nudge before each one.' },
  { eyebrow: '04 · Pay', title: 'Overdue? Sorted in a tap.', body: 'Pay it right from the alert over UPI, and it turns green behind you.' },
  { eyebrow: '05 · Your month', title: 'Your month, in one number.', body: 'What’s gone out, what’s still to come, and never a late fee again.' },
];
const STEPS = CAPTIONS.length - 1;

function useMonth() {
  return useMemo(() => {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = Math.min(days - 13, Math.max(9, now.getDate()));
    const mon = now.toLocaleString('en-IN', { month: 'short' });
    return {
      days,
      today,
      name: now.toLocaleString('en-IN', { month: 'long' }),
      year: now.getFullYear(),
      date: (d: number) => `${d} ${mon}`,
      subs: SUBS.map((s, i) => ({ ...s, day: today + s.offset, x: (i % 2 ? 1 : -1) * R * 0.6, y: ((i % 3) - 1) * R * 0.32 })),
    };
  }, []);
}

function BillCard({ s, date, today }: { s: ReturnType<typeof useMonth>['subs'][number]; date: string; today: number }) {
  return (
    <div
      data-t="card"
      data-key={s.key}
      className="absolute left-0 top-0 w-[236px] rounded-2xl border bg-[#0d0d14]/85 p-3.5 backdrop-blur-md"
      style={{ ['--c' as string]: STATUS_COLOR.none, borderColor: 'color-mix(in srgb, var(--c) 70%, transparent)', boxShadow: '0 0 40px -6px var(--c), inset 0 0 24px -12px var(--c)' }}
    >
      <div className="flex items-center gap-2.5">
        <Mark s={s} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-white">{s.name}</span>
          <span className="block truncate text-[11px] text-neutral-400">{s.plan}</span>
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span>
          <span className="block text-[24px] font-bold leading-none tabular-nums text-white">{rupees(s.amount)}</span>
          <span className="mt-1 block text-[11px] text-neutral-400">Due {date}</span>
        </span>
        <span className="relative h-6 w-[92px] text-right text-[11px] font-bold">
          {[
            ['none', 'Upcoming', '#a99dff'],
            ['paid', s.status === 'paid' ? '✓ Paid' : '✓ Paid today', '#22C55E'],
            ['overdue', `! ${today - s.day} days late`, '#EF4444'],
            ['pending', `in ${s.day - today} days`, '#EAB308'],
          ].map(([k, label, color]) => (
            <span key={k} data-t="state" data-s={k} className="absolute right-0 top-0 rounded-full px-2 py-1" style={{ color, background: `${color}22`, opacity: k === 'none' ? 1 : 0 }}>
              {label}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

export default function BillsTunnel() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const capsRef = useRef<HTMLDivElement | null>(null);
  const m = useMonth();
  useTypeOnShow(capsRef, '[data-t="cap"]', 36);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-t="${k}"]`));
    const one = (k: string) => q(k)[0];
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [scaler] = q('scaler');
      const [world] = q('world');
      const rings = q('ring');
      const cards = q('card');
      const caps = q('cap');
      const [streaks] = q('streaks');
      const [flash] = q('flash');
      const [dayEl] = q('day');
      const [dayBar] = q('day-bar');
      const [paidEl] = q('paid');
      const card = (key: string) => cards.find((c) => c.dataset.key === key)!;
      const fitScale = () => Math.min(1, section.clientWidth / 1000, section.clientHeight / 760);

      // Where the camera is (in days), and how the view's turned for the last step
      const cam = { v: 0.2 };
      const view = { side: 0, ry: 0, z: 0, x: 0 };
      const intro = { reveal: 0 };
      const money = { paid: 0 };
      let lastCam = cam.v;
      let speed = 0;

      const fog = (d: number) => {
        const dist = d - cam.v;
        const f = dist < -0.35 ? 0 : dist < 0 ? (dist + 0.35) / 0.35 : Math.max(0, 1 - dist / 11);
        const built = Math.min(1, Math.max(0, (intro.reveal * (m.days + 4) - (m.days - d)) / 4));
        return (f + (1 - f) * view.side) * built;
      };
      const render = () => {
        gsap.set(scaler, { scale: fitScale() });
        world.style.transform = `translate3d(${view.x}px, 0, ${view.z}px) rotateY(${view.ry}deg) translateZ(${cam.v * SP}px)`;
        rings.forEach((r, i) => (r.style.opacity = String(fog(i + 1))));
        m.subs.forEach((s, i) => {
          const o = fog(s.day);
          cards[i].style.opacity = String(o);
          cards[i].style.visibility = o < 0.01 ? 'hidden' : 'visible';
          // In the pulled-out view, each card turns back to face you, and grows to be read
          gsap.set(cards[i], { rotationY: -view.ry, scale: 1 + view.side * 1.6 });
        });
        speed = speed * 0.8 + Math.abs(cam.v - lastCam) * 4;
        lastCam = cam.v;
        streaks.style.opacity = String(Math.min(0.9, speed * (1 - view.side)));
        const d = Math.max(1, Math.min(m.days, Math.round(cam.v + 0.5)));
        dayEl.textContent = String(d).padStart(2, '0');
        dayBar.style.transform = `scaleX(${d / m.days})`;
        paidEl.textContent = rupees(money.paid);
      };

      // Each bill hangs on its day, facing you
      m.subs.forEach((s, i) => gsap.set(cards[i], { x: s.x - 118, y: s.y - 60, z: -s.day * SP }));
      rings.forEach((r, i) => gsap.set(r, { z: -(i + 1) * SP, rotationZ: i * 6 }));
      gsap.set(caps, { autoAlpha: 0 });
      gsap.set([one('toast-alert'), one('toast-nudge')], { autoAlpha: 0, y: -30 });
      gsap.set(one('sheet'), { autoAlpha: 0, y: 40 });
      gsap.set(one('summary'), { autoAlpha: 0, x: 60 });
      gsap.set(q('chip'), { autoAlpha: 0, scale: 0.6 });
      gsap.set(q('hud'), { autoAlpha: 0, y: 20 });
      render();
      gsap.ticker.add(render);

      // ---- The tunnel lights up, far end first ----
      const introTl = gsap.timeline({ delay: 0.2 });
      introTl.to(intro, { reveal: 1, duration: 2, ease: 'power2.out' }, 0);
      introTl.to(cam, { v: 0.6, duration: 2.4, ease: 'power2.out' }, 0);
      introTl.to(caps[0], { autoAlpha: 1, duration: 0.3 }, 0.9);
      introTl.to(q('hud'), { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, 1.6);

      // ---- One step per scroll ----
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { ...pinned(section, STEPS, 9), end: () => `+=${window.innerHeight * 0.7 * STEPS}` } });
      for (let c = 0; c <= STEPS; c++) tl.addLabel(`s${c}`, c);
      for (let c = 1; c <= STEPS; c++) {
        tl.fromTo(caps[c - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.15, immediateRender: false }, c - 1 + 0.03);
        tl.fromTo(caps[c], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, c - 1 + 0.15);
      }
      const setState = (key: string, st: 'paid' | 'overdue' | 'pending', at: number) => {
        const c = card(key);
        tl.fromTo(c, { '--c': gsap.getProperty(c, '--c') as string }, { '--c': STATUS_COLOR[st], duration: 0.12, immediateRender: false }, at);
        tl.to(c.querySelectorAll('[data-t="state"]'), { opacity: 0, duration: 0.08 }, at);
        tl.to(c.querySelector(`[data-t="state"][data-s="${st}"]`), { opacity: 1, duration: 0.1 }, at + 0.06);
        tl.fromTo(c, { scale: 1 }, { scale: 1.15, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, at);
      };
      const flashAt = (color: string, at: number, strength = 0.35) => {
        tl.fromTo(flash, { background: color, opacity: 0 }, { opacity: strength, duration: 0.06, immediateRender: false }, at);
        tl.to(flash, { opacity: 0, duration: 0.3 }, at + 0.06);
      };
      const chip = (key: string) => q('chip').find((c) => c.dataset.key === key)!;

      // 1. Fly past what's paid
      const paidStop = m.today - 4;
      tl.to(cam, { v: paidStop, duration: 0.85, ease: 'power2.inOut' }, 0.05);
      m.subs.filter((s) => s.status === 'paid').forEach((s) => {
        const at = 0.05 + Math.min(0.8, ((s.day - 0.9 - 0.6) / (paidStop - 0.6)) * 0.85);
        setState(s.key, 'paid', at);
        flashAt('#22C55E', at, 0.15);
        tl.to(money, { paid: `+=${s.amount}`, duration: 0.12 }, at);
        tl.to(chip(s.key), { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'back.out(2)' }, at + 0.1);
      });

      // 2. Electricity looms, and it's late
      tl.to(cam, { v: OVERDUE.offset + m.today - 1.4, duration: 0.6, ease: 'power2.inOut' }, 1.05);
      setState(OVERDUE.key, 'overdue', 1.55);
      flashAt('#EF4444', 1.55, 0.4);
      tl.fromTo(card(OVERDUE.key), { rotationZ: 0 }, { rotationZ: 3, duration: 0.03, yoyo: true, repeat: 7, immediateRender: false }, 1.6);
      tl.to(one('toast-alert'), { autoAlpha: 1, y: 0, duration: 0.2, ease: 'back.out(2)' }, 1.65);

      // 3. Past it, up to today; what's ahead turns amber
      tl.to(one('toast-alert'), { autoAlpha: 0, y: -30, duration: 0.15 }, 2.05);
      tl.to(cam, { v: m.today - 0.55, duration: 0.6, ease: 'power2.inOut' }, 2.05);
      tl.to(chip(OVERDUE.key), { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'back.out(2)' }, 2.35);
      flashAt('#ffffff', 2.6, 0.18);
      m.subs.filter((s) => s.status === 'pending').forEach((s, i) => setState(s.key, 'pending', 2.65 + i * 0.07));
      tl.to(one('toast-nudge'), { autoAlpha: 1, y: 0, duration: 0.2, ease: 'back.out(2)' }, 2.75);

      // 4. Pay it: the sheet comes up, and behind you it turns green
      tl.to(one('toast-nudge'), { autoAlpha: 0, y: -30, duration: 0.15 }, 3.05);
      tl.to(one('sheet'), { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out' }, 3.1);
      tl.to(one('pay-btn'), { scale: 0.93, duration: 0.05 }, 3.45);
      tl.to(one('pay-btn'), { scale: 1, opacity: 0, duration: 0.08 }, 3.5);
      tl.to(one('pay-done'), { opacity: 1, duration: 0.08 }, 3.52);
      tl.to(chip(OVERDUE.key), { '--c': STATUS_COLOR.paid, duration: 0.1 }, 3.55);
      tl.to(chip(OVERDUE.key).querySelector('[data-t="chip-mark"]'), { opacity: 0, duration: 0.05 }, 3.55);
      tl.to(chip(OVERDUE.key).querySelector('[data-t="chip-done"]'), { opacity: 1, duration: 0.05 }, 3.57);
      tl.fromTo(chip(OVERDUE.key), { scale: 1 }, { scale: 1.3, duration: 0.07, yoyo: true, repeat: 1, immediateRender: false }, 3.55);
      setState(OVERDUE.key, 'paid', 3.55);
      flashAt('#22C55E', 3.55, 0.3);
      tl.to(money, { paid: `+=${OVERDUE.amount}`, duration: 0.15 }, 3.55);
      tl.to(one('sheet'), { autoAlpha: 0, y: 40, duration: 0.2 }, 3.85);

      // 5. Pull out, swing round: the whole month as one coil
      tl.to(view, { side: 1, ry: 50, z: -(m.days * SP) * 0.55, x: () => (section.clientWidth < 768 ? 0 : (-section.clientWidth * 0.14 * (PERSPECTIVE + m.days * SP * 0.55)) / PERSPECTIVE / Math.min(1, section.clientWidth / 1000, section.clientHeight / 760)), duration: 0.75, ease: 'power3.inOut' }, 4.05);
      tl.to(cam, { v: m.days / 2, duration: 0.75, ease: 'power3.inOut' }, 4.05);
      tl.to(q('hud'), { autoAlpha: 0, duration: 0.2 }, 4.05);
      tl.to(one('summary'), { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out' }, 4.5);
      tl.to(one('ring-paid'), { strokeDasharray: `${(PAID_TOTAL + OVERDUE.amount) / TOTAL} 1`, duration: 0.35, ease: 'power2.out' }, 4.6);
      tl.set({}, {}, STEPS);

      const unglide = glideBetweenLabels(tl);
      return () => {
        unglide();
        introTl.kill();
        gsap.ticker.remove(render);
      };
    });
    return () => mm.revert();
  }, [m]);

  const toast = 'absolute left-1/2 top-24 z-40 w-[min(420px,92vw)] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur';
  const passed = m.subs.filter((s) => s.status !== 'pending');

  return (
    <section ref={sectionRef} aria-label="Bills and Subscriptions" className="relative h-[calc(100svh-72px)] min-h-[600px] w-full overflow-hidden bg-black text-white select-none">
      {/* The tunnel */}
      <div className="absolute inset-0 overflow-hidden" style={{ perspective: PERSPECTIVE }}>
        <div data-t="scaler" className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]">
          <div data-t="world" className="absolute left-0 top-0 h-0 w-0 [transform-style:preserve-3d]">
            {Array.from({ length: m.days }, (_, i) => {
              const day = i + 1;
              const isToday = day === m.today;
              return (
                <div
                  key={day}
                  data-t="ring"
                  className="absolute rounded-full"
                  style={{
                    left: -R,
                    top: -R,
                    width: R * 2,
                    height: R * 2,
                    border: `${isToday ? 4 : 2}px solid ${isToday ? '#ffffff' : day % 7 === 1 ? 'rgba(232,106,180,0.55)' : 'rgba(110,91,255,0.4)'}`,
                    boxShadow: isToday ? '0 0 50px rgba(255,255,255,0.7), inset 0 0 50px rgba(255,255,255,0.35)' : '0 0 24px rgba(110,91,255,0.35), inset 0 0 24px rgba(110,91,255,0.2)',
                    opacity: 0,
                  }}
                >
                  <span className={`absolute left-1/2 top-[-14px] -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[13px] font-bold ${isToday ? 'bg-white text-black' : 'bg-black text-[#a99dff]'}`}>
                    {isToday ? 'TODAY' : m.date(day)}
                  </span>
                </div>
              );
            })}
            {m.subs.map((s) => (
              <BillCard key={s.key} s={s} date={m.date(s.day)} today={m.today} />
            ))}
          </div>
        </div>
      </div>

      {/* Speed, vignette, flashes */}
      <div data-t="streaks" className="pointer-events-none absolute inset-0 opacity-0" style={{ background: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(169,157,255,0.0) 0deg 4deg, rgba(169,157,255,0.22) 4deg 4.4deg, rgba(169,157,255,0) 4.4deg 9deg)', maskImage: 'radial-gradient(circle at 50% 50%, transparent 18%, #000 60%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 40%, rgba(0,0,0,0.9) 100%)' }} />
      <div data-t="flash" className="pointer-events-none absolute inset-0 z-30 opacity-0 mix-blend-screen" />

      {/* The words */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[40%] bg-gradient-to-b from-black/90 to-transparent" />
      <div ref={capsRef} className="absolute left-4 top-6 z-30 max-w-[560px] sm:left-10 sm:top-10">
        {CAPTIONS.map((c, i) => (
          <div key={c.title} data-t="cap" className="absolute left-0 top-0 w-[min(560px,calc(100vw-2rem))]">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">{c.eyebrow}</p>
            {i === 0 ? (
              <h1 className="mt-2 text-[34px] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[60px]">
                Fly through <Gradient>your month.</Gradient>
              </h1>
            ) : (
              <h2 className="mt-2 text-[28px] font-semibold leading-[1.06] tracking-tight sm:text-4xl lg:text-[48px]">{c.title}</h2>
            )}
            <p className="mt-2 hidden max-w-md text-[15px] leading-relaxed text-neutral-400 sm:block sm:text-lg">{c.body}</p>
          </div>
        ))}
      </div>

      {/* The rear-view mirror: what's behind you */}
      <div data-t="hud" className="absolute right-4 top-6 z-30 w-[220px] rounded-2xl border border-white/10 bg-[#0b0b10]/80 p-3 backdrop-blur sm:right-10 sm:top-10 max-md:bottom-[120px] max-md:top-auto max-md:w-[190px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Behind you</p>
        <div className="mt-2 space-y-1.5">
          {passed.map((s) => (
            <div key={s.key} data-t="chip" data-key={s.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ ['--c' as string]: s.status === 'overdue' ? STATUS_COLOR.overdue : STATUS_COLOR.paid, background: 'color-mix(in srgb, var(--c) 14%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--c) 50%, transparent)' }}>
              <Mark s={s} size={20} />
              <span className="flex-1 truncate text-[12px] font-medium">{s.name}</span>
              <span className="relative h-4 w-4 text-[12px] font-bold" style={{ color: 'var(--c)' }}>
                <span data-t="chip-mark" className="absolute inset-0 text-center">{s.status === 'overdue' ? '!' : '✓'}</span>
                <span data-t="chip-done" className="absolute inset-0 text-center opacity-0">✓</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The dashboard: what day it is, and what's paid */}
      <div data-t="hud" className="absolute bottom-5 left-1/2 z-30 w-[min(560px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0b0b10]/80 px-5 py-3 backdrop-blur">
        <div className="flex items-end justify-between">
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {m.name} {m.year}
            </span>
            <span className="text-[26px] font-bold leading-none tabular-nums">
              Day <span data-t="day">01</span>
              <span className="text-[14px] font-medium text-neutral-500"> / {m.days}</span>
            </span>
          </span>
          <span className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Paid so far</span>
            <span data-t="paid" className="text-[22px] font-bold tabular-nums text-[#22C55E]">
              ₹0
            </span>
            <span className="text-[13px] text-neutral-500"> of {rupees(TOTAL)}</span>
          </span>
        </div>
        <div className="relative mt-2.5 h-1.5 rounded-full bg-white/10">
          <div data-t="day-bar" className="h-full w-full origin-left rounded-full bg-[linear-gradient(90deg,#6E5BFF,#E86AB4)]" style={{ transform: 'scaleX(0)' }} />
          {m.subs.map((s) => (
            <span key={s.key} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black" style={{ left: `${(s.day / m.days) * 100}%`, background: s.color }} />
          ))}
          <span className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 bg-white" style={{ left: `${(m.today / m.days) * 100}%` }} />
        </div>
      </div>

      {/* Alerts */}
      <div data-t="toast-alert" className={`${toast} flex items-center gap-3 border-[#EF4444]/60 bg-[#2a0f12]/95`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-lg font-bold">!</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">{OVERDUE.name} is overdue</span>
          <span className="block text-[12px] text-[#fca5a5]">
            {rupees(OVERDUE.amount)} was due on {m.date(m.today + OVERDUE.offset)}
          </span>
        </span>
        <span className="rounded-full bg-[#EF4444] px-3 py-1 text-[12px] font-semibold">Pay</span>
      </div>
      <div data-t="toast-nudge" className={`${toast} flex items-center gap-3 border-white/10 bg-[#1f2026]/95`}>
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
      <div data-t="sheet" className="absolute bottom-28 left-1/2 z-40 w-[min(380px,90%)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1b1c21]/95 p-4 shadow-[0_30px_60px_rgba(0,0,0,0.7)] backdrop-blur">
        <div className="flex items-center gap-3">
          <Mark s={OVERDUE} size={38} />
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">{OVERDUE.name}</span>
            <span className="block text-[12px] text-[#85868c]">UPI · you@bank</span>
          </span>
          <span className="text-[20px] font-bold">{rupees(OVERDUE.amount)}</span>
        </div>
        <div className="relative mt-3 h-11">
          <div data-t="pay-btn" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#6E5BFF] text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(110,91,255,0.9)]">
            Pay {rupees(OVERDUE.amount)}
          </div>
          <div data-t="pay-done" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#22C55E] text-[15px] font-semibold text-[#052e16] opacity-0">
            ✓ Paid · look behind you
          </div>
        </div>
      </div>

      {/* The month at a glance */}
      <div data-t="summary" className="absolute right-4 top-1/2 z-40 w-[min(340px,92%)] -translate-y-1/2 rounded-[26px] border border-white/10 bg-[#131418]/95 p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur sm:right-10 max-md:bottom-4 max-md:top-auto max-md:translate-y-0">
        <p className="text-[11px] font-semibold tracking-[0.15em] text-white/50">{m.name.toUpperCase()} AT A GLANCE</p>
        <div className="mt-4 flex items-center gap-4">
          <svg viewBox="0 0 120 120" className="h-[96px] w-[96px] shrink-0 -rotate-90">
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            <circle data-t="ring-paid" cx="60" cy="60" r="48" fill="none" stroke="#22C55E" strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray="0 1" />
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
    </section>
  );
}
