'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { Gradient } from '../IntroHero';
import { glideBetweenLabels, pinned } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';
import { Mark, SUBS, TOTAL, rupees } from './BillsCity';

// Bills & Subscriptions, one page a day. A tear-off desk calendar stands in the middle of the
// screen. Each scroll tears its pages off, a day at a time, and they flutter away; it stops on every
// day a bill falls on, a stamp slams down on that day's page, and the bill's card comes up beside
// it. The month, told day by day:
//   5th Netflix, auto-paid · 8th Amazon Prime, paid · 11th Electricity, due today · 13th today:
//   Electricity has slipped, two days late · sorted in a tap · 16th Spotify, 20th YouTube Premium,
//   25th Disney+ Hotstar, each with a reminder set · and the month, sorted.
// The month is this real month; all figures are illustrative.

const PW = 360;
const PH = 440;
const INK = '#14121c';

type Stamp = { text: string; color: string };
type Stop = { day: number; key?: string; stamp?: Stamp; eyebrow: string; title: string; body: string };

function useStory() {
  return useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const today = Math.min(days - 13, Math.max(9, now.getDate()));
    const monthName = now.toLocaleString('en-IN', { month: 'long' });
    const weekday = (d: number) => new Date(year, month, d).toLocaleString('en-IN', { weekday: 'long' });
    const subs = SUBS.map((s) => ({ ...s, day: today + s.offset }));
    const at = (key: string) => subs.find((s) => s.key === key)!;
    const nth = (d: number) => `${d}${d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'}`;
    const PAID = { text: 'PAID', color: '#16a34a' };
    const REMIND = { text: 'REMINDER SET', color: '#d97706' };
    const stops: Stop[] = [
      { day: 1, eyebrow: 'Bills & Subscriptions', title: 'One page a day.', body: 'Your month, a day at a time. Scroll, and we’ll stop wherever a bill is due.' },
      { day: at('netflix').day, key: 'netflix', stamp: PAID, eyebrow: `The ${nth(at('netflix').day)}`, title: 'Netflix renews.', body: 'Auto-paid on the day, and stamped. Nothing for you to do.' },
      { day: at('prime').day, key: 'prime', stamp: PAID, eyebrow: `The ${nth(at('prime').day)}`, title: 'Amazon Prime.', body: 'The annual one you’d have forgotten about. Paid.' },
      { day: at('power').day, key: 'power', stamp: { text: 'DUE TODAY', color: '#d97706' }, eyebrow: `The ${nth(at('power').day)}`, title: 'Electricity is due.', body: `${rupees(at('power').amount)} due today, and a reminder went out this morning.` },
      { day: today, key: 'power', stamp: { text: '2 DAYS LATE', color: '#dc2626' }, eyebrow: `The ${nth(today)} · today`, title: 'It slipped.', body: 'Electricity is two days late, flagged red the moment it slipped past.' },
      { day: today, key: 'power', stamp: PAID, eyebrow: 'Still today', title: 'Sorted in a tap.', body: 'Paid over UPI straight from the alert. No late fee.' },
      { day: at('spotify').day, key: 'spotify', stamp: REMIND, eyebrow: `The ${nth(at('spotify').day)}`, title: 'Spotify, coming up.', body: 'Three days away. You’ll get a nudge before it lands.' },
      { day: at('youtube').day, key: 'youtube', stamp: REMIND, eyebrow: `The ${nth(at('youtube').day)}`, title: 'YouTube Premium.', body: 'Reminder set. No surprises on your statement.' },
      { day: at('hotstar').day, key: 'hotstar', stamp: REMIND, eyebrow: `The ${nth(at('hotstar').day)}`, title: 'Disney+ Hotstar.', body: 'The last one this month, quarterly, and already on the calendar.' },
      { day: days, eyebrow: `${monthName}, done`, title: 'Your month, sorted.', body: `${rupees(TOTAL)} across ${SUBS.length} bills. Every one on time, and not a single late fee.` },
    ];
    const pageDays = stops.map((st) => st.day).filter((d, i, a) => a.indexOf(d) === i);
    return { days, today, monthName, year, weekday, subs, stops, pageDays };
  }, []);
}

// One day's page
function Page({ d, s }: { d: number; s: ReturnType<typeof useStory> }) {
  const bill = s.subs.find((b) => b.day === d);
  const isToday = d === s.today;
  const stamps = s.stops.filter((st) => st.day === d && st.stamp);
  return (
    <div data-f="page" data-day={d} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transformOrigin: '50% 0%' }}>
      {/* Its back, seen as it flips over: plain paper, the next day's number faintly through it */}
      <div className="absolute inset-0 rounded-b-[18px] rounded-t-[6px] [backface-visibility:hidden]" style={{ transform: 'rotateX(180deg)', background: 'linear-gradient(180deg,#e7e3d9 0%,#d9d4c7 100%)' }}>
        <p className="absolute inset-x-0 top-[96px] text-center font-semibold opacity-[0.07]" style={{ fontSize: 196, color: INK, transform: 'scaleY(-1)' }}>
          {d}
        </p>
      </div>
      <div className="absolute inset-0 overflow-hidden rounded-b-[18px] rounded-t-[6px] [backface-visibility:hidden]" style={{ background: 'linear-gradient(180deg,#fbfaf6 0%,#f1eee6 100%)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.06)' }}>
      {/* The perforation it tears along */}
      <div className="absolute inset-x-0 top-0 h-[10px]" style={{ backgroundImage: 'radial-gradient(circle at 6px 2px, #1a1724 2.2px, transparent 2.6px)', backgroundSize: '12px 10px' }} />
      {/* The month */}
      <div className="mx-4 mt-4 flex items-center justify-between rounded-[12px] px-4 py-2.5 text-white" style={{ background: 'linear-gradient(120deg,#6E5BFF 0%,#8B5CF6 55%,#E86AB4 120%)' }}>
        <span className="text-[13px] font-bold uppercase tracking-[0.22em]">{s.monthName}</span>
        <span className="text-[13px] font-semibold opacity-80">{s.year}</span>
      </div>
      {/* The day */}
      <p className="mt-3 text-center text-[13px] font-semibold uppercase tracking-[0.3em]" style={{ color: isToday ? '#6E5BFF' : '#77736a' }}>
        {s.weekday(d)}
      </p>
      <p className="text-center font-semibold leading-[0.95] tracking-tight" style={{ fontSize: 196, color: INK }}>
        {d}
      </p>
      {isToday && <span className="absolute right-[-34px] top-[78px] rotate-45 bg-[#6E5BFF] px-10 py-1 text-[11px] font-bold tracking-[0.2em] text-white">TODAY</span>}
      {/* What's due on it */}
      <div className="absolute inset-x-4 bottom-4 rounded-[12px] border border-dashed px-3 py-2.5" style={{ borderColor: 'rgba(20,18,28,0.18)' }}>
        {bill ? (
          <div className="flex items-center gap-2.5" style={{ color: INK }}>
            <Mark s={bill} size={30} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold leading-tight">{bill.name}</span>
              <span className="block truncate text-[11px] text-[#77736a]">{bill.plan}</span>
            </span>
            <span className="text-[16px] font-bold tabular-nums">{rupees(bill.amount)}</span>
          </div>
        ) : isToday ? (
          <p className="relative text-center text-[12px] font-semibold text-[#77736a]">
            <span data-f="today-late">Electricity · {rupees(1840)} · 2 days late</span>
            <span data-f="today-paid" className="absolute inset-0 text-[#16a34a] opacity-0">
              Electricity · {rupees(1840)} · paid today ✓
            </span>
          </p>
        ) : (
          <p className="text-center text-[12px] text-[#a19c91]">No bills today</p>
        )}
      </div>
      {/* Its stamps, waiting to come down */}
      {stamps.map((st, i) => (
        <span
          key={i}
          data-f="stamp"
          data-day={d}
          data-n={i}
          className="pointer-events-none absolute left-1/2 top-[71%] whitespace-nowrap rounded-[8px] border-[4px] px-3 py-1 text-[26px] font-extrabold tracking-[0.12em] opacity-0"
          style={{ color: st.stamp!.color, borderColor: st.stamp!.color, background: `${st.stamp!.color}14`, mixBlendMode: 'multiply', transform: `translate(-50%,-50%) rotate(${i ? -6 : -14}deg)` }}
        >
          {st.stamp!.text}
        </span>
      ))}
      {/* The shadow the page above casts on it as it lifts */}
      <div data-f="under" className="pointer-events-none absolute inset-0 opacity-0" style={{ background: 'linear-gradient(180deg, rgba(10,6,24,0.75) 0%, rgba(10,6,24,0.25) 45%, transparent 85%)' }} />
      {/* The light across it as it lifts and turns */}
      <div data-f="shade" className="pointer-events-none absolute inset-0 opacity-0" style={{ background: 'linear-gradient(180deg, rgba(20,14,40,0.55) 0%, rgba(20,14,40,0.15) 60%, rgba(255,255,255,0.25) 100%)' }} />
      </div>
    </div>
  );
}

// A rubber stamp, coming down onto the page: a turned wooden handle and its inked rubber
function StampTool() {
  return (
    <div data-f="tool" className="pointer-events-none absolute [transform-style:preserve-3d]" style={{ left: PW / 2, top: 34 + PH * 0.71, transform: 'translateZ(380px)', opacity: 0 }}>
      {/* Its shadow on the page */}
      <div data-f="tool-shadow" className="absolute -left-[90px] -top-[40px] h-[80px] w-[180px] rounded-[40%] bg-black/50 blur-xl" />
      <div className="absolute [transform-style:preserve-3d]" style={{ transform: 'rotateZ(-14deg)' }}>
        {/* The rubber, and the block it's mounted on */}
        <div data-f="tool-ink" className="absolute -left-[86px] -top-[30px] h-[60px] w-[172px] rounded-[8px]" style={{ background: '#16a34a', boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.25)' }} />
        {[4, 8, 12, 16, 20].map((z) => (
          <div key={z} className="absolute -left-[92px] -top-[36px] h-[72px] w-[184px] rounded-[10px]" style={{ transform: `translateZ(${z}px)`, background: z === 20 ? 'linear-gradient(135deg,#3a3550,#1d1a2a)' : '#14111f', boxShadow: z === 20 ? 'inset 0 1px 0 rgba(255,255,255,0.2)' : undefined }} />
        ))}
        {/* The handle */}
        {Array.from({ length: 12 }, (_, i) => {
          const z = 24 + i * 9;
          const r = i < 2 ? 22 : i > 9 ? 34 - (i - 10) * 6 : 16;
          return <div key={i} className="absolute rounded-full" style={{ left: -r, top: -r, width: r * 2, height: r * 2, transform: `translateZ(${z}px)`, background: i > 9 ? 'radial-gradient(circle at 35% 30%, #c08a5a, #7a4f2c 70%)' : 'radial-gradient(circle at 35% 30%, #a8764a, #5f3b20 75%)' }} />;
        })}
      </div>
    </div>
  );
}

export default function BillsFlip() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const capsRef = useRef<HTMLDivElement | null>(null);
  const s = useStory();
  useTypeOnShow(capsRef, '[data-f="cap"]', 34);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-f="${k}"]`));
    const one = (k: string) => q(k)[0];
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [stage] = q('stage');
      const [fit] = q('fit');
      const [pad] = q('pad');
      const [cam] = q('cam');
      const pages = q('page');
      const caps = q('cap');
      const cards = q('card');
      const stamp = (day: number, n: number) => q('stamp').find((el) => Number(el.dataset.day) === day && Number(el.dataset.n) === n)!;
      const card = (key: string) => cards.find((c) => c.dataset.key === key)!;
      const fitScale = () => Math.min(1.15, (stage.clientHeight * 0.86) / (PH + 120), (stage.clientWidth * 0.9) / (PW + 40));

      // Each page's own flight once it's torn: off to one side, past the camera, tumbling
      const flight = pages.map((_, k) => ({ x: (k % 2 ? 1 : -1) * 680, y: -40, z: 420, rz: (k % 2 ? 1 : -1) * 38, ry: (k % 2 ? 1 : -1) * 35 }));
      const cal = { i: 0 };
      const shades = pages.map((p) => p.querySelector<HTMLElement>('[data-f="shade"]')!);
      const unders = pages.map((p) => p.querySelector<HTMLElement>('[data-f="under"]')!);
      const stubs = q('stub');
      const [tilt] = q('tilt');
      const [mouse] = q('mouse');
      const last = pages.length - 1;
      let lastI = cal.i;
      let swing = 0;
      const smooth = (v: number) => v * v * (3 - 2 * v);
      const render = () => {
        const i = cal.i;
        const top = Math.floor(i);
        pages.forEach((p, k) => {
          unders[k].style.opacity = '0';
          if (k > top) {
            // Waiting underneath: only the next one is ever seen
            gsap.set(p, { x: 0, y: 0, z: -(k - top) * 1.2, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1, visibility: k === top + 1 ? 'visible' : 'hidden' });
            shades[k].style.opacity = '0';
            return;
          }
          const f = Math.min(1, i - k);
          if (f <= 0) {
            gsap.set(p, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1, visibility: 'visible' });
            shades[k].style.opacity = '0';
            return;
          }
          // It curls up towards you and over the binding, then tears free and sails off
          const flip = smooth(Math.min(1, f / 0.6));
          const fly = smooth(Math.max(0, (f - 0.45) / 0.55));
          const fl = flight[k];
          gsap.set(p, {
            rotationX: flip * 150 + fly * 25,
            x: fl.x * fly,
            y: fl.y * fly,
            z: 2 + Math.sin(flip * Math.PI) * 40 + fl.z * fly,
            rotationZ: fl.rz * fly + Math.sin(flip * Math.PI) * 4,
            rotationY: fl.ry * fly,
            opacity: 1 - Math.max(0, (fly - 0.55) / 0.45),
            visibility: f >= 1 ? 'hidden' : 'visible',
          });
          shades[k].style.opacity = String(Math.min(0.85, Math.sin((flip * 150 * Math.PI) / 180) * 0.85));
          // and its shadow sweeps down the page beneath, then clears
          if (unders[k + 1]) unders[k + 1].style.opacity = String(Math.sin(Math.min(1, f / 0.7) * Math.PI) * 0.9);
        });
        // A ragged stub of paper is left under the binding for every page torn off
        stubs.forEach((st, k) => (st.style.opacity = i >= k + 0.6 ? '1' : '0'));
        // The pad gets thinner, and sways as each page comes away
        tilt.style.setProperty('--t', String(8 + (22 * (last - Math.min(i, last))) / last));
        swing = swing * 0.86 + (i - lastI) * 40;
        lastI = i;
        gsap.set(tilt, { rotationY: base.ry + Math.max(-10, Math.min(10, swing)), rotationX: base.rx - Math.min(6, Math.abs(swing) * 0.4) });
      };
      const base = { rx: 16, ry: stage.clientWidth < 500 ? -10 : -20 };
      gsap.ticker.add(render);

      // The pointer tilts the scene a little
      const mx = gsap.quickTo(mouse, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      const my = gsap.quickTo(mouse, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      const onMove = (e: PointerEvent) => {
        const r = section.getBoundingClientRect();
        mx((((e.clientX - r.left) / r.width) * 2 - 1) * 8);
        my(-(((e.clientY - r.top) / r.height) * 2 - 1) * 6);
      };
      section.addEventListener('pointermove', onMove);

      gsap.set(fit, { xPercent: -50, yPercent: -50, scale: fitScale });
      gsap.set(caps, { autoAlpha: 0 });
      gsap.set(cards, { autoAlpha: 0, x: 160, z: -260, rotationY: -65, transformPerspective: 1200 });
      gsap.set(q('stamp'), { opacity: 0, scale: 2.4 });
      gsap.set(one('summary'), { autoAlpha: 0, x: 160, z: -260, rotationY: -65, transformPerspective: 1200 });
      render();

      // ---- The calendar drops onto the desk, and the first page settles ----
      const intro = gsap.timeline({ delay: 0.2 });
      intro.fromTo(pad, { y: -420, z: 500, rotationX: -50, rotationZ: -18, autoAlpha: 0 }, { y: 0, z: 0, rotationX: 0, rotationZ: 0, autoAlpha: 1, duration: 1.2, ease: 'bounce.out' }, 0);
      intro.fromTo(base, { ry: 60, rx: 40 }, { ry: base.ry, rx: 16, duration: 1.6, ease: 'power3.out' }, 0);
      intro.to(caps[0], { autoAlpha: 1, duration: 0.3 }, 0.8);

      // ---- One stop per scroll: the pages fly to the next day with a bill ----
      const steps = s.stops.length - 1;
      const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: { ...pinned(section, steps, 9), end: () => `+=${window.innerHeight * 0.75 * steps}` } });
      for (let c = 0; c <= steps; c++) tl.addLabel(`s${c}`, c);
      let shownCard: string | undefined;
      s.stops.forEach((stop, c) => {
        if (!c) return;
        const prev = s.stops[c - 1];
        const at = c - 1 + 0.03;
        tl.fromTo(caps[c - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.12, immediateRender: false }, at);
        tl.fromTo(caps[c], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.2, immediateRender: false }, at + 0.55);
        // The pages fly
        if (stop.day !== prev.day) {
          const k = s.pageDays.indexOf(prev.day);
          tl.fromTo(cal, { i: k }, { i: k + 1, duration: 0.62, ease: 'power1.inOut', immediateRender: false }, at);
          // The days in between, with nothing due, go by quietly
          const quiet = q('quiet').find((el) => Number(el.dataset.c) === c);
          if (quiet) {
            tl.fromTo(quiet, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.15, immediateRender: false }, at + 0.1);
            tl.to(quiet, { autoAlpha: 0, y: -8, duration: 0.15 }, at + 0.62);
          }
        }
        // The bill's card changes over
        if (shownCard && shownCard !== stop.key) tl.to(card(shownCard), { autoAlpha: 0, x: -60, z: -200, rotationY: 55, duration: 0.2, ease: 'power2.in' }, at);
        if (stop.key && stop.key !== shownCard)
          tl.fromTo(card(stop.key), { autoAlpha: 0, x: 160, z: -260, rotationY: -65, rotationX: 12 }, { autoAlpha: 1, x: 0, z: 0, rotationY: -14, rotationX: 4, duration: 0.38, ease: 'back.out(1.4)', immediateRender: false }, at + 0.62);
        shownCard = stop.key;
        // The stamp comes down
        if (stop.stamp) {
          const n = s.stops.filter((x, i) => i < c && x.day === stop.day && x.stamp).length;
          const st = stamp(stop.day, n);
          if (n > 0) tl.to(stamp(stop.day, n - 1), { opacity: 0.25, duration: 0.1 }, at + 0.6);
          // The stamp comes down from above, presses, and lifts away, leaving its mark
          const tool = one('tool');
          tl.set(one('tool-ink'), { backgroundColor: stop.stamp.color }, at + 0.55);
          tl.fromTo(tool, { z: 380, opacity: 0 }, { z: 380, opacity: 1, duration: 0.04, immediateRender: false }, at + 0.56);
          tl.to(tool, { z: 4, duration: 0.16, ease: 'power3.in' }, at + 0.6);
          tl.fromTo(one('tool-shadow'), { scale: 1.8, opacity: 0.2 }, { scale: 1, opacity: 0.8, duration: 0.16, ease: 'power3.in', immediateRender: false }, at + 0.6);
          tl.fromTo(st, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.06, immediateRender: false }, at + 0.76);
          tl.fromTo(pad, { z: 0 }, { z: -10, duration: 0.05, yoyo: true, repeat: 1, immediateRender: false }, at + 0.76);
          tl.fromTo(cam, { scale: 1 }, { scale: 1.05, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, at + 0.76);
          tl.to(tool, { z: 380, duration: 0.1, ease: 'power2.out' }, at + 0.83);
          tl.to(tool, { opacity: 0, duration: 0.04 }, at + 0.91);
        }
        // The overdue one: its card goes red, then green when it's paid
        if (stop.key === 'power') {
          const which = stop.stamp!.text === 'PAID' ? 'paid' : stop.day === s.today ? 'overdue' : 'due';
          const c0 = card('power');
          tl.to(c0.querySelectorAll('[data-f="state"]'), { opacity: 0, duration: 0.08 }, at + 0.6);
          tl.to(c0.querySelector(`[data-f="state"][data-s="${which}"]`), { opacity: 1, duration: 0.1 }, at + 0.64);
          tl.to(c0, { borderColor: which === 'paid' ? 'rgba(34,197,94,0.6)' : which === 'overdue' ? 'rgba(239,68,68,0.7)' : 'rgba(245,165,36,0.6)', boxShadow: `0 30px 60px -20px ${which === 'paid' ? 'rgba(34,197,94,0.5)' : which === 'overdue' ? 'rgba(239,68,68,0.55)' : 'rgba(245,165,36,0.4)'}`, duration: 0.15 }, at + 0.62);
          if (which === 'paid') {
            tl.to(one('pay-btn'), { scale: 0.94, duration: 0.05 }, at + 0.45);
            tl.to(one('pay-btn'), { scale: 1, opacity: 0, duration: 0.06 }, at + 0.5);
            tl.to(one('pay-done'), { opacity: 1, duration: 0.08 }, at + 0.52);
            tl.to(one('today-late'), { opacity: 0, duration: 0.06 }, at + 0.62);
            tl.to(one('today-paid'), { opacity: 1, duration: 0.08 }, at + 0.64);
          }
        }
      });
      // The end: the camera swings round to show the pad, nearly spent, and the summary comes up
      tl.to(base, { ry: -38, rx: 24, duration: 0.5, ease: 'power2.inOut' }, steps - 1 + 0.5);
      tl.to(cam, { scale: 0.94, duration: 0.5, ease: 'power2.inOut' }, steps - 1 + 0.5);
      tl.fromTo(one('summary'), { autoAlpha: 0, x: 160, z: -260, rotationY: -65 }, { autoAlpha: 1, x: 0, z: 0, rotationY: -14, duration: 0.4, ease: 'back.out(1.3)', immediateRender: false }, steps - 1 + 0.62);
      tl.set({}, {}, steps);

      const unglide = glideBetweenLabels(tl);
      return () => {
        unglide();
        intro.kill();
        gsap.ticker.remove(render);
        section.removeEventListener('pointermove', onMove);
      };
    });
    return () => mm.revert();
  }, [s]);

  const powerAmount = s.subs.find((b) => b.key === 'power')!.amount;

  return (
    <section ref={sectionRef} aria-label="Bills and Subscriptions" className="relative h-[calc(100svh-72px)] min-h-[620px] w-full overflow-hidden bg-black text-white select-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_55%_at_52%_50%,rgba(110,91,255,0.22),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_25%_30%_at_80%_80%,rgba(232,106,180,0.1),transparent_70%)]" />

      <div className="relative mx-auto grid h-full max-w-[1400px] grid-rows-[auto_1fr_auto] px-4 sm:px-8 md:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.1fr)_minmax(260px,0.8fr)] md:grid-rows-1 md:items-center md:gap-6">
        {/* The story */}
        <div ref={capsRef} className="relative z-30 min-h-[96px] pt-6 md:min-h-[240px] md:pt-0">
          {s.stops.map((c, i) => (
            <div key={i} data-f="cap" className="absolute inset-x-0 top-6 md:top-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">{c.eyebrow}</p>
              {i === 0 ? (
                <h1 className="mt-3 text-[36px] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[58px]">
                  One page <Gradient>a day.</Gradient>
                </h1>
              ) : (
                <h2 className="mt-3 text-[28px] font-semibold leading-[1.06] tracking-tight sm:text-4xl lg:text-[50px]">{c.title}</h2>
              )}
              <p className="mt-3 hidden max-w-sm text-[15px] leading-relaxed text-neutral-400 sm:block sm:text-[17px]">{c.body}</p>
            </div>
          ))}
        </div>

        {/* The calendar */}
        <div data-f="stage" className="relative h-full min-h-[380px] [perspective:1300px]">
          {/* Dust in the light */}
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} className="bf-mote pointer-events-none absolute rounded-full bg-white" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, opacity: 0.25, animationDelay: `${(i % 6) * 0.9}s`, animationDuration: `${7 + (i % 5)}s` }} />
          ))}
          <div data-f="fit" className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]" style={{ width: PW, height: PH + 110 }}>
            <div data-f="cam" className="absolute inset-x-0 top-0 [transform-style:preserve-3d]" style={{ height: PH + 40 }}>
            <div data-f="mouse" className="absolute inset-0 [transform-style:preserve-3d]">
            <div data-f="tilt" className="absolute inset-0 [transform-style:preserve-3d]" style={{ ['--t' as string]: 30 }}>
            <div data-f="pad" className="absolute inset-0 [transform-style:preserve-3d]">
              {/* Its shadow on the desk */}
              <div className="absolute -inset-x-10 bottom-[-50px] h-20 rounded-[50%] bg-black/85 blur-2xl" style={{ transform: 'translateZ(calc(var(--t) * -1px - 20px))' }} />
              {/* The board behind it */}
              <div className="absolute -inset-x-3 bottom-[-6px] top-0 rounded-[20px]" style={{ transform: 'translateZ(calc(var(--t) * -1px - 4px))', background: 'linear-gradient(160deg,#2a2638,#110f19)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9), 0 0 70px -10px rgba(110,91,255,0.35)' }} />
              {/* The pages still to come, as a block: its edges, every sheet a fine line */}
              <div className="absolute rounded-r-[4px]" style={{ left: PW, top: 34, height: PH, width: 'calc(var(--t) * 1px)', transformOrigin: '0 50%', transform: 'rotateY(90deg)', background: 'repeating-linear-gradient(90deg,#efebe2 0 2px,#cdc8bc 2px 3px)' }} />
              <div className="absolute rounded-l-[4px]" style={{ left: 'calc(var(--t) * -1px)', top: 34, height: PH, width: 'calc(var(--t) * 1px)', transformOrigin: '100% 50%', transform: 'rotateY(-90deg)', background: 'repeating-linear-gradient(90deg,#cdc8bc 0 1px,#e6e2d8 1px 3px)' }} />
              <div className="absolute rounded-b-[6px]" style={{ left: 0, top: 34 + PH, width: PW, height: 'calc(var(--t) * 1px)', transformOrigin: '50% 0', transform: 'rotateX(-90deg)', background: 'repeating-linear-gradient(180deg,#e8e4da 0 2px,#c4bfb2 2px 3px)' }} />
              {/* The pages */}
              <div className="absolute inset-x-0 [transform-style:preserve-3d]" style={{ top: 34, height: PH }}>
                {s.pageDays.map((d) => (
                  <Page key={d} d={d} s={s} />
                ))}
              </div>
              {/* What's left of each page torn off: a ragged stub under the binding */}
              {s.pageDays.slice(0, -1).map((d, k) => (
                <div key={d} data-f="stub" className="absolute inset-x-2 opacity-0" style={{ top: 34, height: 9 + (k % 3) * 2, transform: `translateZ(${1 + k * 0.4}px)`, background: k % 2 ? '#eeeae1' : '#f6f3ec', boxShadow: '0 2px 3px rgba(0,0,0,0.18)', clipPath: 'polygon(0 0,100% 0,100% 70%,96% 100%,91% 62%,85% 96%,79% 58%,72% 100%,66% 66%,59% 94%,52% 60%,46% 100%,39% 64%,33% 92%,26% 60%,20% 100%,13% 66%,7% 94%,0 70%)' }} />
              ))}
              {/* The binding: a bar with thickness, standing proud of the pages */}
              {[2, 6, 10].map((z) => (
                <div key={z} className="absolute -inset-x-3 top-0 h-[44px] rounded-[14px] bg-[#0b0912]" style={{ transform: `translateZ(${z - 8}px)` }} />
              ))}
              <div className="absolute -inset-x-3 top-0 z-[500] h-[44px] rounded-[14px] border border-white/10" style={{ transform: 'translateZ(6px)', background: 'linear-gradient(180deg,#3a3550 0%,#1d1a2a 55%,#0e0c16 100%)', boxShadow: '0 10px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
                <span className="bf-sheen absolute inset-0 overflow-hidden rounded-[14px]" />
                {[0.22, 0.78].map((x) => (
                  <span key={x} className="absolute top-[26px] h-[26px] w-[18px] -translate-x-1/2 rounded-full border-[4px] border-[#9a96a8]" style={{ left: `${x * 100}%`, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                ))}
                <span className="absolute inset-x-0 top-[10px] text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">BrokeNoMore</span>
              </div>
              <StampTool />
            </div>
            </div>
            </div>
            </div>

            {/* The days in between, going by with nothing due */}
            <div className="absolute inset-x-0 bottom-0 flex h-10 items-center justify-center">
              {s.stops.map((stop, c) => {
                if (!c || stop.day === s.stops[c - 1].day) return null;
                const from = s.stops[c - 1].day + 1;
                const to = stop.day - 1;
                if (to < from) return null;
                const span = to === from ? `${from}` : to - from < 3 ? Array.from({ length: to - from + 1 }, (_, i) => from + i).join(' · ') : `${from} – ${to}`;
                return (
                  <span key={c} data-f="quiet" data-c={c} className="absolute whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[12px] text-white/60 opacity-0 backdrop-blur">
                    <span className="font-semibold text-white/85">{span}</span> {s.monthName.slice(0, 3)} · no bills, nothing to do
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* The bill, beside it */}
        <div className="relative z-30 h-[150px] [perspective:1200px] [transform-style:preserve-3d] md:h-[300px]">
          {s.subs.map((b) => (
            <div key={b.key} data-f="card" data-key={b.key} className="absolute inset-x-0 top-0 rounded-[24px] border border-white/10 bg-[#131418] p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] [transform-style:preserve-3d]">
              {[4, 8, 12].map((z) => (
                <div key={z} className="pointer-events-none absolute inset-0 rounded-[24px] border border-white/[0.06] bg-[#0b0b0f]" style={{ transform: `translateZ(-${z}px)` }} />
              ))}
              <div className="flex items-center gap-3" style={{ transform: 'translateZ(18px)' }}>
                <Mark s={b} size={42} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-semibold">{b.name}</span>
                  <span className="block truncate text-[12px] text-[#85868c]">{b.plan}</span>
                </span>
                <span className="text-[22px] font-bold tabular-nums">{rupees(b.amount)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px]">
                <span className="text-[#85868c]">Due</span>
                <span className="font-semibold">
                  {s.weekday(b.day)}, {b.day} {s.monthName.slice(0, 3)}
                </span>
              </div>
              {b.key === 'power' ? (
                <>
                  <div className="relative mt-3 h-6 text-[13px] font-semibold">
                    <span data-f="state" data-s="due" className="absolute inset-0 text-[#F5A524]">● Due today · reminder sent</span>
                    <span data-f="state" data-s="overdue" className="absolute inset-0 text-[#EF4444] opacity-0">● 2 days late · late fee in 3 days</span>
                    <span data-f="state" data-s="paid" className="absolute inset-0 text-[#22C55E] opacity-0">✓ Paid via UPI · no late fee</span>
                  </div>
                  <div className="relative mt-3 h-11">
                    <div data-f="pay-btn" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#6E5BFF] text-[14px] font-semibold shadow-[0_12px_30px_-10px_rgba(110,91,255,0.9)]">
                      Pay {rupees(powerAmount)} via UPI
                    </div>
                    <div data-f="pay-done" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#22C55E] text-[14px] font-semibold text-[#052e16] opacity-0">
                      ✓ Paid · all clear
                    </div>
                  </div>
                </>
              ) : (
                <p className={`mt-3 text-[13px] font-semibold ${b.status === 'paid' ? 'text-[#22C55E]' : 'text-[#F5A524]'}`}>
                  {b.status === 'paid' ? '✓ Paid on the day · auto-pay' : `● Reminder set for ${b.day - 1} ${s.monthName.slice(0, 3)}`}
                </p>
              )}
            </div>
          ))}
          {/* The month, sorted */}
          <div data-f="summary" className="absolute inset-x-0 top-0 rounded-[24px] border border-white/10 bg-[#131418] p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] font-semibold tracking-[0.15em] text-white/50">{s.monthName.toUpperCase()} AT A GLANCE</p>
            <p className="mt-2 text-[34px] font-bold leading-tight tabular-nums">{rupees(TOTAL)}</p>
            <p className="text-[13px] text-[#85868c]">{SUBS.length} bills · all on time</p>
            <div className="mt-4 space-y-1.5">
              {s.subs.map((b) => (
                <div key={b.key} className="flex items-center gap-2 text-[12.5px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: b.key === 'power' || b.status === 'paid' ? '#22C55E' : '#F5A524' }} />
                  <span className="flex-1 text-white/80">
                    {b.day} · {b.name}
                  </span>
                  <span className="tabular-nums text-white/70">{rupees(b.amount)}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 px-3 py-2 text-[12.5px] text-[#bbf7d0]">0 late fees this month.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
