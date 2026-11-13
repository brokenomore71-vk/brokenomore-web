'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { Gradient } from '../IntroHero';
import { glideBetweenLabels, pinned } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';
import { Mark, STATUS_COLOR, SUBS, TOTAL, rupees } from './BillsCity';

// THE SOLAR-SYSTEM VERSION, kept for later (switched off in app/features/bills/page.tsx).
// Bills & Subscriptions, as a solar system. The month is a circle: your money is the sun in the
// middle, every subscription a planet in orbit round it (as big as its bill, in its brand's
// colours, a ring round it for its status), and a beam out of the sun marks today. As time moves,
// the planets travel round, and each one is due as it crosses the beam:
//   1. What's paid: Netflix and Prime cross it, a coin flies out of the sun to each, rings go green
//   2. What's overdue: Electricity crosses it and nothing comes; it turns red and starts to pulse
//   3. What's coming up: the planets still ahead glow amber, counting down to their day
//   4. Sorted in a tap: pay it, the coin flies, and it bursts green
//   5. Your month, in one number: the camera tips up overhead, the orbits become a dial with the
//      month's dates round its rim, and the summary comes up
// The month is this real month; all figures are illustrative.

const PAID_TOTAL = SUBS.filter((s) => s.status === 'paid').reduce((t, s) => t + s.amount, 0);
const OVERDUE = SUBS.find((s) => s.status === 'overdue')!;
const NEXT = SUBS.find((s) => s.status === 'pending')!;
const RAY = Math.PI / 2; // today's beam points down, towards you
const sizeOf = (amount: number) => Math.round(30 + Math.sqrt(amount) * 0.8);

const CAPTIONS = [
  { eyebrow: 'Bills & Subscriptions', title: 'Your bills, in orbit.', body: 'Every subscription circling its due date. The beam is today: whatever crosses it is due.' },
  { eyebrow: '01 · Paid', title: 'What’s paid.', body: 'As each bill comes round to its day, it’s paid, and its ring turns green.' },
  { eyebrow: '02 · Overdue', title: 'What’s overdue.', body: 'Flagged in red the moment a date slips by. Nothing drifts past unnoticed.' },
  { eyebrow: '03 · Coming up', title: 'What’s coming up.', body: 'Everything still on its way round, counting down, with a nudge before it lands.' },
  { eyebrow: '04 · Pay', title: 'Overdue? Sorted in a tap.', body: 'Pay it right from the alert over UPI, and it’s back on track.' },
  { eyebrow: '05 · Your month', title: 'Your month, in one number.', body: 'Every bill, every date, at a glance. And never a late fee again.' },
];
const STEPS = CAPTIONS.length - 1;

// Stars, the same on every render
const STARS = (() => {
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 140 }, () => ({ x: rand() * 100, y: rand() * 100, r: rand() < 0.85 ? 1 : 2, o: 0.25 + rand() * 0.6, tw: rand() < 0.25 }));
})();

function useMonth() {
  return useMemo(() => {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = Math.min(days - 13, Math.max(9, now.getDate()));
    const mon = now.toLocaleString('en-IN', { month: 'short' });
    return { days, today, mon, name: now.toLocaleString('en-IN', { month: 'long' }), year: now.getFullYear(), subs: SUBS.map((s) => ({ ...s, day: today + s.offset })) };
  }, []);
}

function Planet({ s, mon, today }: { s: ReturnType<typeof useMonth>['subs'][number]; mon: string; today: number }) {
  const size = sizeOf(s.amount);
  return (
    <div data-o="planet" data-key={s.key} className="absolute left-0 top-0" style={{ ['--c' as string]: STATUS_COLOR.none }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Its glow */}
        <div className="absolute -inset-4 rounded-full blur-xl" style={{ background: 'var(--c)', opacity: 0.45 }} />
        {/* The back half of its ring */}
        <div className="absolute left-1/2 top-1/2 rounded-[50%] border-[3px]" style={{ width: size * 1.9, height: size * 1.9, transform: 'translate(-50%,-50%) rotateX(74deg)', borderColor: 'color-mix(in srgb, var(--c) 80%, transparent)', boxShadow: '0 0 14px var(--c)', clipPath: 'inset(0 0 50% 0)' }} />
        {/* The planet: the brand's colour, lit from the sun, its far side in shadow */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{
            background: `radial-gradient(circle at 34% 30%, color-mix(in srgb, ${s.color} 40%, #fff) 0%, ${s.color} 32%, color-mix(in srgb, ${s.color} 55%, #000) 72%, #05050a 100%)`,
            boxShadow: `inset -${size * 0.12}px -${size * 0.16}px ${size * 0.3}px rgba(0,0,0,0.55), inset ${size * 0.04}px ${size * 0.05}px ${size * 0.12}px rgba(255,255,255,0.25)`,
          }}
        >
          <span className="font-extrabold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" style={{ color: s.ink, fontSize: size * (s.mark.length > 2 ? 0.26 : s.mark.length > 1 ? 0.32 : 0.44) }}>
            {s.mark}
          </span>
        </div>
        {/* The front half of its ring */}
        <div className="absolute left-1/2 top-1/2 rounded-[50%] border-[3px]" style={{ width: size * 1.9, height: size * 1.9, transform: 'translate(-50%,-50%) rotateX(74deg)', borderColor: 'var(--c)', boxShadow: '0 0 14px var(--c)', clipPath: 'inset(50% 0 0 0)' }} />
        {s.status === 'overdue' && <div data-o="halo" className="bl-halo absolute -inset-3 rounded-full border-2 border-[#EF4444] opacity-0" />}
        {/* Its sparks, when it's paid */}
        {Array.from({ length: s.status === 'overdue' ? 12 : 0 }, (_, k) => (
          <span key={k} data-o="spark" className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-[#4ade80] opacity-0" style={{ boxShadow: '0 0 10px #22C55E' }} />
        ))}
        {/* Its label */}
        <div data-o="label" className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#0b0b12]/80 px-2.5 py-1.5 text-center backdrop-blur" style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent)' }}>
          <span className="block text-[12px] font-semibold leading-tight text-white">
            {s.name} · {rupees(s.amount)}
          </span>
          <span className="relative block h-4 text-[11px] font-bold leading-4">
            {[
              ['none', `Due ${s.day} ${mon}`, '#a99dff'],
              ['paid', s.status === 'paid' ? `✓ Paid ${s.day} ${mon}` : '✓ Paid today', '#22C55E'],
              ['overdue', `! ${today - s.day} days late`, '#EF4444'],
              ['pending', `in ${s.day - today} days`, '#EAB308'],
            ].map(([k, t, c]) => (
              <span key={k} data-o="state" data-s={k} className="absolute inset-x-0 top-0" style={{ color: c, opacity: k === 'none' ? 1 : 0 }}>
                {t}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BillsOrbit() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const capsRef = useRef<HTMLDivElement | null>(null);
  const m = useMonth();
  const stars = STARS;
  useTypeOnShow(capsRef, '[data-o="cap"]', 36);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-o="${k}"]`));
    const one = (k: string) => q(k)[0];
    const svgQ = (k: string) => Array.from(section.querySelectorAll<SVGElement>(`[data-o="${k}"]`));
    const mm = gsap.matchMedia();

    mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { reduce } = ctx.conditions as { reduce: boolean };
      const planets = q('planet');
      const orbits = svgQ('orbit');
      const [ray] = svgQ('ray');
      const [rayLabel] = q('ray-label');
      const [sun] = q('sun');
      const comets = q('comet');
      const ticks = q('tick');
      const caps = q('cap');
      const [paidEl] = q('paid');
      const planet = (key: string) => planets.find((p) => p.dataset.key === key)!;
      const idx = (key: string) => m.subs.findIndex((s) => s.key === key);

      // Time (in days), the camera, the intro, and the money
      const time = { t: m.today - 10 };
      const cam = { tilt: 0.36, zoom: 1, ticks: 0, drift: 0 };
      const intro = { sun: 0, spread: 2.6, planets: 0, orbits: 0 };
      const comet = m.subs.map(() => ({ p: 0, o: 0 }));
      const money = { paid: 0 };

      const frame = () => {
        const w = section.clientWidth;
        const h = section.clientHeight;
        const wide = w >= 768;
        const cx = wide ? w * 0.66 : w * 0.5;
        const cy = wide ? h * 0.56 : h * 0.6;
        const U = Math.min(wide ? w * 0.31 : w * 0.46, h * 0.8) * cam.zoom;
        const ty = cam.tilt;
        const radius = (i: number) => U * (0.36 + 0.115 * i);
        const rMax = radius(m.subs.length - 1) * 1.16;
        const pos = (i: number, spread = intro.spread) => {
          const a = RAY + ((m.subs[i].day - time.t) / m.days) * Math.PI * 2 + cam.drift;
          const R = radius(i) * spread;
          return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * ty, depth: Math.sin(a) };
        };
        gsap.set(sun, { x: cx, y: cy, xPercent: -50, yPercent: -50, scale: intro.sun * (0.75 + cam.zoom * 0.25) * Math.min(1, U / 420) });
        orbits.forEach((o, i) => {
          o.setAttribute('cx', String(cx));
          o.setAttribute('cy', String(cy));
          o.setAttribute('rx', String(radius(i)));
          o.setAttribute('ry', String(radius(i) * ty));
          o.style.opacity = String(intro.orbits);
        });
        const rayEnd = { x: cx + Math.cos(RAY) * rMax, y: cy + Math.sin(RAY) * rMax * ty };
        ray.setAttribute('x1', String(cx));
        ray.setAttribute('y1', String(cy));
        ray.setAttribute('x2', String(rayEnd.x));
        ray.setAttribute('y2', String(rayEnd.y));
        ray.style.opacity = String(intro.orbits);
        gsap.set(rayLabel, { x: rayEnd.x, y: rayEnd.y + 6, xPercent: -50, opacity: intro.orbits });
        planets.forEach((p, i) => {
          const { x, y, depth } = pos(i);
          const s = (1 + depth * 0.16 * (1 - ty * 0.5)) * (0.7 + cam.zoom * 0.3) * Math.min(1.1, U / 380);
          gsap.set(p, { x, y, xPercent: -50, yPercent: -50, scale: s, opacity: intro.planets, zIndex: Math.round(100 + depth * 50) });
        });
        comets.forEach((c, i) => {
          const target = pos(i);
          const k = comet[i].p;
          const x = cx + (target.x - cx) * k;
          const y = cy + (target.y - cy) * k;
          const ang = (Math.atan2(target.y - cy, target.x - cx) * 180) / Math.PI;
          gsap.set(c, { x, y, rotation: ang, opacity: comet[i].o, zIndex: 160 });
        });
        ticks.forEach((tk) => {
          const d = Number(tk.dataset.day);
          const a = RAY + ((d - time.t) / m.days) * Math.PI * 2 + cam.drift;
          gsap.set(tk, { x: cx + Math.cos(a) * rMax * 1.06, y: cy + Math.sin(a) * rMax * 1.06 * ty, xPercent: -50, yPercent: -50, opacity: cam.ticks * (d === m.today ? 1 : 0.7) });
        });
        paidEl.textContent = rupees(money.paid);
      };

      gsap.set(caps, { autoAlpha: 0 });
      gsap.set([one('toast-alert'), one('toast-nudge')], { autoAlpha: 0, y: -30 });
      gsap.set(one('sheet'), { autoAlpha: 0, y: 40 });
      gsap.set(one('summary'), { autoAlpha: 0, x: 60 });
      gsap.set(one('hud'), { autoAlpha: 0, y: 20 });

      if (reduce) {
        Object.assign(intro, { sun: 1, spread: 1, planets: 1, orbits: 1 });
        time.t = m.today;
        gsap.set(caps[0], { autoAlpha: 1 });
        frame();
        return;
      }
      gsap.ticker.add(frame);

      // ---- The sun ignites, the orbits draw, the planets swing in ----
      const introTl = gsap.timeline({ delay: 0.2 });
      introTl.to(intro, { sun: 1, duration: 1, ease: 'back.out(1.8)' }, 0);
      introTl.to(intro, { orbits: 1, duration: 0.9, ease: 'power2.out' }, 0.4);
      introTl.fromTo(orbits, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.08, ease: 'power2.out' }, 0.4);
      introTl.to(intro, { planets: 1, duration: 0.5 }, 0.7);
      introTl.to(intro, { spread: 1, duration: 1.6, ease: 'power3.out' }, 0.7);
      introTl.fromTo(cam, { drift: -1.4 }, { drift: 0, duration: 2, ease: 'power3.out' }, 0.7);
      introTl.to(caps[0], { autoAlpha: 1, duration: 0.3 }, 1.4);
      introTl.to(one('hud'), { autoAlpha: 1, y: 0, duration: 0.4 }, 2);

      // ---- One step per scroll: time moves ----
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { ...pinned(section, STEPS, 9), end: () => `+=${window.innerHeight * 0.7 * STEPS}` } });
      for (let c = 0; c <= STEPS; c++) tl.addLabel(`s${c}`, c);
      for (let c = 1; c <= STEPS; c++) {
        tl.fromTo(caps[c - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.15, immediateRender: false }, c - 1 + 0.03);
        tl.fromTo(caps[c], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, c - 1 + 0.15);
      }
      const setState = (key: string, st: 'paid' | 'overdue' | 'pending', at: number) => {
        const p = planet(key);
        tl.fromTo(p, { '--c': gsap.getProperty(p, '--c') as string }, { '--c': STATUS_COLOR[st], duration: 0.1, immediateRender: false }, at);
        tl.to(p.querySelectorAll('[data-o="state"]'), { opacity: 0, duration: 0.06 }, at);
        tl.to(p.querySelector(`[data-o="state"][data-s="${st}"]`), { opacity: 1, duration: 0.08 }, at + 0.05);
      };
      const fire = (key: string, at: number) => {
        const c = comet[idx(key)];
        tl.fromTo(c, { p: 0, o: 1 }, { p: 1, duration: 0.18, ease: 'power2.in', immediateRender: false }, at);
        tl.to(c, { o: 0, duration: 0.06 }, at + 0.18);
      };
      // Time moves on, linearly, so each crossing can be timed
      const move = (from: number, to: number, start: number, dur: number) => {
        tl.fromTo(time, { t: from }, { t: to, duration: dur, immediateRender: false }, start);
        return (day: number) => start + ((day - from) / (to - from)) * dur;
      };

      // 1. Time moves; Netflix and Prime cross today, and they're paid
      const at1 = move(m.today - 10, m.today - 4, 0.05, 0.85);
      m.subs.filter((s) => s.status === 'paid').forEach((s) => {
        const at = at1(s.day) - 0.1;
        fire(s.key, at);
        setState(s.key, 'paid', at + 0.18);
        tl.to(money, { paid: `+=${s.amount}`, duration: 0.12 }, at + 0.18);
      });

      // 2. Electricity crosses, and nothing comes
      move(m.today - 4, m.today - 1, 1.05, 0.6);
      setState(OVERDUE.key, 'overdue', 1.05 + (2 / 3) * 0.6);
      tl.to(one('halo'), { opacity: 1, duration: 0.12 }, 1.5);
      tl.to(one('toast-alert'), { autoAlpha: 1, y: 0, duration: 0.2, ease: 'back.out(2)' }, 1.6);

      // 3. Today: what's ahead turns amber, and a reminder
      tl.to(one('toast-alert'), { autoAlpha: 0, y: -30, duration: 0.15 }, 2.05);
      move(m.today - 1, m.today, 2.05, 0.4);
      m.subs.filter((s) => s.status === 'pending').forEach((s, i) => setState(s.key, 'pending', 2.4 + i * 0.07));
      tl.to(one('toast-nudge'), { autoAlpha: 1, y: 0, duration: 0.2, ease: 'back.out(2)' }, 2.6);

      // 4. Pay it: the coin flies, and it bursts green
      tl.to(one('toast-nudge'), { autoAlpha: 0, y: -30, duration: 0.15 }, 3.05);
      tl.to(one('sheet'), { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out' }, 3.1);
      tl.to(one('pay-btn'), { scale: 0.93, duration: 0.05 }, 3.4);
      tl.to(one('pay-btn'), { scale: 1, opacity: 0, duration: 0.08 }, 3.45);
      tl.to(one('pay-done'), { opacity: 1, duration: 0.08 }, 3.47);
      fire(OVERDUE.key, 3.45);
      tl.to(one('halo'), { opacity: 0, duration: 0.1 }, 3.63);
      setState(OVERDUE.key, 'paid', 3.63);
      tl.to(money, { paid: `+=${OVERDUE.amount}`, duration: 0.12 }, 3.63);
      q('spark').forEach((sp, k) => {
        const a = (k / 12) * Math.PI * 2;
        tl.fromTo(sp, { x: 0, y: 0, opacity: 1 }, { x: Math.cos(a) * 60, y: Math.sin(a) * 60, opacity: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, 3.64);
      });
      tl.to(one('sheet'), { autoAlpha: 0, y: 40, duration: 0.2 }, 3.85);

      // 5. Overhead: the orbits become the month's dial
      tl.to(cam, { tilt: 0.86, zoom: 0.72, ticks: 1, duration: 0.7, ease: 'power3.inOut' }, 4.05);
      tl.to(one('hud'), { autoAlpha: 0, duration: 0.2 }, 4.05);
      tl.to(one('summary'), { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power3.out' }, 4.5);
      tl.to(one('ring-paid'), { strokeDasharray: `${(PAID_TOTAL + OVERDUE.amount) / TOTAL} 1`, duration: 0.35, ease: 'power2.out' }, 4.6);
      tl.set({}, {}, STEPS);

      const unglide = glideBetweenLabels(tl);
      return () => {
        unglide();
        introTl.kill();
        gsap.ticker.remove(frame);
      };
    });
    return () => mm.revert();
  }, [m]);

  const toast = 'absolute left-1/2 top-24 z-[300] w-[min(420px,92vw)] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur md:left-[66%]';

  return (
    <section ref={sectionRef} aria-label="Bills and Subscriptions" className="relative h-[calc(100svh-72px)] min-h-[620px] w-full overflow-hidden bg-[#020206] text-white select-none">
      {/* Space */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_50%_at_62%_56%,rgba(110,91,255,0.22),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_30%_25%_at_85%_20%,rgba(232,106,180,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_20%_85%,rgba(56,189,248,0.07),transparent_70%)]" />
      {stars.map((s, i) => (
        <span key={i} className={`pointer-events-none absolute rounded-full bg-white ${s.tw ? 'or-twinkle' : ''}`} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, opacity: s.o, animationDelay: `${(i % 7) * 0.4}s` }} />
      ))}

      {/* The orbits and today's beam */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="or-ray" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#E86AB4" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {m.subs.map((s) => (
          <ellipse key={s.key} data-o="orbit" fill="none" stroke="rgba(169,157,255,0.28)" strokeWidth="1.2" pathLength={1} strokeDasharray="1" />
        ))}
        <line data-o="ray" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px #E86AB4)' }} />
      </svg>
      <span data-o="ray-label" className="pointer-events-none absolute left-0 top-0 z-[250] rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-black shadow-[0_0_24px_rgba(255,255,255,0.6)]">
        Today · {m.today} {m.mon}
      </span>

      {/* The month's dates, round the rim */}
      {Array.from({ length: m.days }, (_, i) => i + 1)
        .filter((d) => d % 3 === 1 || d === m.today)
        .map((d) => (
          <span key={d} data-o="tick" data-day={d} className={`pointer-events-none absolute left-0 top-0 text-[11px] font-semibold ${d === m.today ? 'text-white' : 'text-[#a99dff]'}`}>
            {d} {m.mon}
          </span>
        ))}

      {/* The sun: your money */}
      <div data-o="sun" className="absolute left-0 top-0 z-[100] h-[150px] w-[150px]">
        <div className="or-spin absolute -inset-16 rounded-full opacity-60" style={{ background: 'repeating-conic-gradient(from 0deg, rgba(232,106,180,0) 0deg 8deg, rgba(232,106,180,0.18) 8deg 10deg)', maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)' }} />
        <div className="absolute -inset-10 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(232,106,180,0.7), rgba(110,91,255,0.4) 50%, transparent 72%)' }} />
        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 38% 34%, #ffffff 0%, #f6c7ff 18%, #E86AB4 42%, #6E5BFF 78%, #3a2a9e 100%)', boxShadow: '0 0 60px rgba(232,106,180,0.8), 0 0 120px rgba(110,91,255,0.6), inset -14px -18px 30px rgba(40,20,120,0.6)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Image src="/assets/images/main_logo.png" alt="" width={56} height={56} className="rounded-full opacity-90 mix-blend-screen" />
        </div>
      </div>

      {/* The planets */}
      {m.subs.map((s) => (
        <Planet key={s.key} s={s} mon={m.mon} today={m.today} />
      ))}

      {/* Coins on their way out of the sun */}
      {m.subs.map((s) => (
        <span key={s.key} data-o="comet" className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0">
          <span className="absolute right-0 top-[-3px] h-[6px] w-[90px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,196,81,0.9))', filter: 'blur(1px)' }} />
          <span className="absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-extrabold text-[#8a6418]" style={{ background: 'radial-gradient(circle at 35% 30%, #fff4c9, #e9c565 45%, #b08427)', boxShadow: '0 0 18px rgba(245,196,81,0.9)' }}>
            ₹
          </span>
        </span>
      ))}

      {/* The words */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[200] w-full bg-gradient-to-b from-[#020206]/90 via-transparent to-transparent md:w-[42%] md:bg-gradient-to-r" />
      <div ref={capsRef} className="absolute left-4 top-6 z-[260] w-[min(520px,calc(100%-2rem))] sm:left-10 md:top-1/2 md:-translate-y-1/2">
        {CAPTIONS.map((c, i) => (
          <div key={c.title} data-o="cap" className="absolute left-0 top-0 w-full md:-translate-y-1/2">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">{c.eyebrow}</p>
            {i === 0 ? (
              <h1 className="mt-3 text-[36px] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[62px]">
                Your bills, <Gradient>in orbit.</Gradient>
              </h1>
            ) : (
              <h2 className="mt-3 text-[28px] font-semibold leading-[1.06] tracking-tight sm:text-4xl lg:text-[50px]">{c.title}</h2>
            )}
            <p className="mt-3 hidden max-w-md text-[15px] leading-relaxed text-neutral-400 sm:block sm:text-lg">{c.body}</p>
          </div>
        ))}
      </div>

      {/* What's paid so far */}
      <div data-o="hud" className="absolute bottom-6 left-4 z-[260] rounded-2xl border border-white/10 bg-[#0b0b12]/80 px-5 py-3 backdrop-blur sm:left-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          {m.name} {m.year}
        </p>
        <p className="mt-0.5 text-[13px] text-neutral-400">
          <span data-o="paid" className="text-[22px] font-bold tabular-nums text-[#22C55E]">
            ₹0
          </span>{' '}
          paid of {rupees(TOTAL)}
        </p>
      </div>

      {/* Alerts */}
      <div data-o="toast-alert" className={`${toast} flex items-center gap-3 border-[#EF4444]/60 bg-[#2a0f12]/95`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-lg font-bold">!</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">{OVERDUE.name} is overdue</span>
          <span className="block text-[12px] text-[#fca5a5]">
            {rupees(OVERDUE.amount)} was due on {m.today + OVERDUE.offset} {m.mon}
          </span>
        </span>
        <span className="rounded-full bg-[#EF4444] px-3 py-1 text-[12px] font-semibold">Pay</span>
      </div>
      <div data-o="toast-nudge" className={`${toast} flex items-center gap-3 border-white/10 bg-[#1f2026]/95`}>
        <span className="text-xl">🔔</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-[#85868c]">BrokeNoMore · now</span>
          <span className="block text-[14px] font-semibold">
            {NEXT.name} renews in {NEXT.offset} days
          </span>
          <span className="block text-[12px] text-[#EAB308]">
            {rupees(NEXT.amount)} on {m.today + NEXT.offset} {m.mon}
          </span>
        </span>
      </div>

      {/* Paying it */}
      <div data-o="sheet" className="absolute bottom-6 left-1/2 z-[300] w-[min(380px,90%)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1b1c21]/95 p-4 shadow-[0_30px_60px_rgba(0,0,0,0.7)] backdrop-blur md:left-[66%]">
        <div className="flex items-center gap-3">
          <Mark s={OVERDUE} size={38} />
          <span className="flex-1">
            <span className="block text-[15px] font-semibold">{OVERDUE.name}</span>
            <span className="block text-[12px] text-[#85868c]">UPI · you@bank</span>
          </span>
          <span className="text-[20px] font-bold">{rupees(OVERDUE.amount)}</span>
        </div>
        <div className="relative mt-3 h-11">
          <div data-o="pay-btn" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#6E5BFF] text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(110,91,255,0.9)]">
            Pay {rupees(OVERDUE.amount)}
          </div>
          <div data-o="pay-done" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#22C55E] text-[15px] font-semibold text-[#052e16] opacity-0">
            ✓ Paid · back in orbit
          </div>
        </div>
      </div>

      {/* The month at a glance */}
      <div data-o="summary" className="absolute bottom-6 left-4 z-[300] w-[min(330px,92%)] rounded-[24px] border border-white/10 bg-[#131418]/90 p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur sm:left-10 md:bottom-10">
        <p className="text-[11px] font-semibold tracking-[0.15em] text-white/50">{m.name.toUpperCase()} AT A GLANCE</p>
        <div className="mt-3 flex items-center gap-4">
          <svg viewBox="0 0 120 120" className="h-[84px] w-[84px] shrink-0 -rotate-90">
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            <circle data-o="ring-paid" cx="60" cy="60" r="48" fill="none" stroke="#22C55E" strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray="0 1" />
          </svg>
          <div>
            <p className="text-[12px] text-[#85868c]">Bills this month</p>
            <p className="text-[26px] font-bold leading-tight tabular-nums">{rupees(TOTAL)}</p>
            <p className="mt-1 text-[12px] leading-snug">
              <span className="text-[#22C55E]">{rupees(PAID_TOTAL + OVERDUE.amount)} paid</span>
              <br />
              <span className="text-[#EAB308]">{rupees(TOTAL - PAID_TOTAL - OVERDUE.amount)} still to come</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-[#bbf7d0]">0 late fees this month. Every due date had a reminder.</p>
      </div>
    </section>
  );
}
