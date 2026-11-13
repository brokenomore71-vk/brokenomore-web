'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { Gradient } from '../IntroHero';
import { typeText, type Typing } from '../typewriter';
import { Card, Coffee, Coin, HH, HW, HandLayers, PhoneBody, SKINS, plexMono } from '../splitPage/CinemaHero';
import { rupees } from './BillsCity';

// The Bills & Subscriptions opening, shot like a film. A desk at night under a warm lamp: a mug,
// the electricity bill that came in the post, a card, some change, and a phone lying face up.
// The camera starts low across the desk, out of focus, and cranes up onto the phone, pulling
// focus. The screen wakes, and bill reminders buzz in one by one (the phone shivers on the desk
// each time): Netflix paid, Spotify in 3 days, the credit card due today, and on top, Electricity
// overdue. A hand reaches in, taps the overdue one, taps Pay, and it turns green. The words type
// themselves in beside it as the hand comes in.

const TABLE_W = 2000;
const TABLE_H = 1300;
const PHONE_X = 1000;
const PHONE_Y = 600;
const PW = 300;
const PH = 616;

const NOTES = [
  { key: 'power', tone: '#EF4444', title: 'Electricity bill is overdue', body: '₹1,840 was due on 11 Nov. Pay now to avoid a late fee.', tag: 'Overdue' },
  { key: 'card', tone: '#F5A524', title: 'Credit card due today', body: 'HDFC · minimum due ₹4,250', tag: 'Today' },
  { key: 'spotify', tone: '#A99DFF', title: 'Spotify renews in 3 days', body: '₹119 on 16 Nov', tag: '3 days' },
  { key: 'netflix', tone: '#22C55E', title: 'Netflix paid', body: '₹649 auto-paid via UPI', tag: 'Paid' },
];

// A letter in the post: the electricity bill
function PowerBill() {
  return (
    <div className="relative w-[250px] rounded-[3px] bg-[#f4f1e8] p-4 text-[#1d1b17] shadow-[inset_0_0_30px_rgba(120,100,60,0.15)]" style={{ fontFamily: plexMono.style.fontFamily }}>
      <div className="flex items-center justify-between border-b border-[#1d1b17]/30 pb-2">
        <span className="text-[15px] font-bold tracking-wide">BESCOM</span>
        <span className="text-[9px] text-[#6b675e]">ELECTRICITY BILL</span>
      </div>
      <div className="mt-2 space-y-1 text-[10px]">
        <div className="flex justify-between"><span>Account</span><span>4021 8873 12</span></div>
        <div className="flex justify-between"><span>Units</span><span>212 kWh</span></div>
        <div className="flex justify-between"><span>Due date</span><span>11 Nov</span></div>
      </div>
      <div className="mt-3 flex items-end justify-between border-t border-dashed border-[#1d1b17]/40 pt-2">
        <span className="text-[10px] font-semibold">AMOUNT DUE</span>
        <span className="text-[20px] font-bold">₹1,840.00</span>
      </div>
      <span className="absolute right-3 top-14 rotate-[-12deg] rounded border-2 border-[#c0392b] px-1.5 text-[12px] font-bold tracking-[0.15em] text-[#c0392b] opacity-75">UNPAID</span>
    </div>
  );
}

// The phone's lock screen, with its reminders and the pay sheet
function LockScreen({ date }: { date: string }) {
  return (
    <PhoneBody w={PW} h={PH} radius={48}>
      <div className="relative h-full w-full overflow-hidden" style={{ background: 'radial-gradient(120% 70% at 20% 0%, #4a2a8a 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #8a2a6a 0%, transparent 60%), #0c0a18' }}>
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white">
          <span>Jio</span>
          <span className="h-[20px] w-[78px] rounded-full bg-black" />
          <span>82%</span>
        </div>
        <p className="mt-5 text-center text-[13px] font-medium text-white/80">{date}</p>
        <p className="text-center text-[72px] font-semibold leading-none tracking-tight text-white/95">9:41</p>

        {/* The reminders: newest on top, each pushing the rest down as it lands */}
        <div className="mt-5 flex flex-col px-3">
          {NOTES.map((n) => (
            <div key={n.key} data-n="note" data-key={n.key} className="overflow-hidden">
              <div data-n="note-card" className="mb-2 rounded-[18px] border border-white/10 bg-white/[0.13] px-3 py-2.5 backdrop-blur-xl" style={{ boxShadow: `inset 3px 0 0 ${n.tone}` }}>
                <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                  <Image src="/assets/images/main_logo.png" alt="" width={16} height={16} className="rounded-[4px]" />
                  <span className="font-semibold uppercase tracking-wider">BrokeNoMore</span>
                  <span className="ml-auto">now</span>
                </div>
                <p data-n="note-title" className="mt-1 text-[13px] font-semibold leading-tight text-white">
                  {n.title}
                </p>
                <p data-n="note-body" className="text-[11.5px] leading-snug text-white/75">{n.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The pay sheet */}
        <div data-n="sheet" className="absolute inset-x-0 bottom-0 rounded-t-[26px] border-t border-white/10 bg-[#16161c] px-4 pb-6 pt-3 text-white" style={{ transform: 'translateY(105%)' }}>
          <span className="mx-auto block h-1 w-9 rounded-full bg-white/25" />
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F5B400] text-[18px]">⚡</span>
            <span className="flex-1">
              <span className="block text-[14px] font-semibold">Electricity · BESCOM</span>
              <span className="block text-[11px] text-white/55">Due 11 Nov · 2 days late</span>
            </span>
            <span className="text-[18px] font-bold">₹1,840</span>
          </div>
          <div className="mt-3 flex justify-between rounded-xl bg-white/[0.06] px-3 py-2 text-[11.5px]">
            <span className="text-white/55">Pay with</span>
            <span className="font-semibold">UPI · you@bank</span>
          </div>
          <div className="relative mt-3 h-11">
            <div data-n="pay-btn" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#6E5BFF] text-[14px] font-semibold">
              Pay ₹1,840
            </div>
            <div data-n="pay-done" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#22C55E] text-[14px] font-semibold text-[#052e16] opacity-0">
              ✓ Paid · no late fee
            </div>
          </div>
        </div>

        {/* Asleep, until it wakes */}
        <div data-n="dim" className="absolute inset-0 bg-black" />
      </div>
    </PhoneBody>
  );
}

// A hand, reaching in to tap (the grip from the Split scene, with nothing in it: the index finger
// out, the others curled)
function TapHand({ shadow }: { shadow?: boolean }) {
  return (
    <div className="relative" style={{ width: HW + 40, height: HH }}>
      <HandLayers skin={SKINS.medium} sleeve="#1c2036" shadow={shadow} part="under" />
      <HandLayers skin={SKINS.medium} sleeve="#1c2036" shadow={shadow} part="over" />
    </div>
  );
}

export default function BillsNightHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const date = useMemo(() => new Date().toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }), []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-n="${k}"]`));
    const one = (k: string) => q(k)[0];
    const [lens] = q('lens');
    const [view] = q('view');
    const [table] = q('table');
    const [lamp] = q('lamp');
    const [phone] = q('phone');
    const [handPos] = q('hand-pos');
    const [reach] = q('reach');
    const [lift] = q('lift');
    const [shadow] = q('shadow');
    const notes = q('note');
    const [text] = q('text');
    const pills = q('pill');
    const bars = q('letterbox');
    const note = (key: string) => notes.find((n) => n.dataset.key === key)!;

    const wide = () => view.clientWidth >= 768;
    const frameScale = () => Math.min(1.05, Math.max(0.55, view.clientHeight / 900)) * (wide() ? 1 : 0.85);
    const FINAL = { rotationX: 30, rotationZ: 0, x: () => (wide() ? view.clientWidth * 0.17 : 0), y: () => (wide() ? view.clientHeight * 0.06 : view.clientHeight * 0.16), z: 0, scale: frameScale };
    const START = { rotationX: 80, rotationZ: -10, x: 0, y: () => view.clientHeight * 0.34, z: 360, scale: frameScale };
    // Where the hand's fingertip goes: the overdue reminder, then the Pay button
    const TAP_NOTE = { left: PHONE_X - 40, top: PHONE_Y - PH / 2 + 248 };
    const TAP_PAY = { left: PHONE_X - 20, top: PHONE_Y + PH / 2 - 52 };

    const ctx = gsap.context(() => {
      gsap.set(table, { transformOrigin: `${PHONE_X}px ${PHONE_Y}px` });
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(table, FINAL);
        gsap.set(one('dim'), { opacity: 0 });
        gsap.set(bars, { scaleY: 0 });
        gsap.set([text, ...pills], { autoAlpha: 1 });
        return;
      }
      gsap.set(table, START);
      gsap.set(lens, { filter: 'blur(14px) brightness(0.25)' });
      gsap.set(lamp, { opacity: 0 });
      gsap.set(text, { autoAlpha: 0 });
      gsap.set(pills, { autoAlpha: 0, y: 8 });
      gsap.set(notes, { height: 0, opacity: 0 });
      gsap.set(handPos, TAP_NOTE);
      gsap.set(reach, { x: -820 });
      gsap.set(lift, { z: 70 });
      gsap.set(shadow, { x: 34, y: 46, opacity: 0.32, filter: 'blur(18px)' });

      const typings: Typing[] = [];
      const tl = gsap.timeline({ delay: 0.2 });
      // The lamp comes up; the camera cranes up and over onto the phone, pulling focus
      tl.to(lamp, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0);
      tl.to(lens, { filter: 'blur(9px) brightness(0.7)', duration: 1, ease: 'power1.out' }, 0);
      tl.to(table, { ...FINAL, duration: 3, ease: 'power3.inOut' }, 0.5);
      tl.to(lens, { filter: 'blur(0px) brightness(1)', duration: 1.5, ease: 'power2.inOut' }, 1.9);
      // The screen wakes, and the reminders buzz in, oldest first
      tl.to(one('dim'), { opacity: 0, duration: 0.5, ease: 'power2.out' }, 3.0);
      [...NOTES].reverse().forEach((n, i) => {
        const at = 3.35 + i * 0.5;
        tl.to(note(n.key), { height: 'auto', opacity: 1, duration: 0.35, ease: 'power3.out' }, at);
        tl.fromTo(note(n.key).firstElementChild, { y: -20, scale: 0.94 }, { y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.8)', immediateRender: false }, at);
        tl.fromTo(phone, { x: 0 }, { x: 3, duration: 0.035, yoyo: true, repeat: 7, ease: 'none', immediateRender: false }, at);
      });
      // The letterbox opens and the words come up, as the hand reaches in
      tl.to(bars, { scaleY: 0, duration: 1, ease: 'power3.inOut' }, 3.3);
      tl.add(() => {
        gsap.set(text, { autoAlpha: 1 });
        let delay = 0;
        (['eyebrow', 'title', 'body'] as const).forEach((k, i) => {
          const el = one(k);
          const ms = [22, 44, 12][i];
          typings.push(typeText(el, { msPerChar: ms, delay, keepCaret: k === 'body' }));
          delay += (el.textContent?.length ?? 0) * ms + 160;
        });
        typings[typings.length - 1].done.then(() => gsap.to(pills, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08 }));
      }, 3.4);
      // The hand reaches in and taps the overdue reminder
      tl.to(reach, { x: -160, duration: 1.1, ease: 'power3.out' }, 5.0);
      const tap = (at: number) => {
        tl.to(reach, { x: 0, duration: 0.22, ease: 'power2.in' }, at);
        tl.to(lift, { z: 6, duration: 0.22, ease: 'power2.in' }, at);
        tl.to(shadow, { x: 6, y: 8, opacity: 0.6, filter: 'blur(5px)', duration: 0.22, ease: 'power2.in' }, at);
        tl.to(reach, { x: -150, duration: 0.45, ease: 'power2.out' }, at + 0.3);
        tl.to(lift, { z: 70, duration: 0.45, ease: 'power2.out' }, at + 0.3);
        tl.to(shadow, { x: 34, y: 46, opacity: 0.32, filter: 'blur(18px)', duration: 0.45, ease: 'power2.out' }, at + 0.3);
      };
      tap(6.15);
      tl.to(note('power').firstElementChild, { scale: 0.96, backgroundColor: 'rgba(239,68,68,0.3)', duration: 0.1 }, 6.37);
      tl.to(one('sheet'), { y: '0%', duration: 0.45, ease: 'power3.out' }, 6.5);
      // Over to the Pay button, and tap it
      tl.to(handPos, { ...TAP_PAY, duration: 0.5, ease: 'power2.inOut' }, 6.75);
      tap(7.35);
      tl.to(one('pay-btn'), { scale: 0.94, duration: 0.06 }, 7.55);
      tl.to(one('pay-btn'), { scale: 1, opacity: 0, duration: 0.1 }, 7.62);
      tl.to(one('pay-done'), { opacity: 1, duration: 0.12 }, 7.64);
      tl.to(one('sheet'), { y: '105%', duration: 0.4, ease: 'power2.in' }, 8.3);
      tl.to(note('power').firstElementChild, { scale: 1, backgroundColor: 'rgba(34,197,94,0.22)', boxShadow: 'inset 3px 0 0 #22C55E', duration: 0.2 }, 8.5);
      tl.add(() => {
        const t = note('power').querySelector('[data-n="note-title"]');
        if (t) t.textContent = 'Electricity paid · no late fee ✓';
        const b = t?.nextElementSibling;
        if (b) b.textContent = '₹1,840 paid via UPI, just now';
      }, 8.5);
      tl.to(reach, { x: -820, duration: 1, ease: 'power2.in' }, 8.5);
      // Then it stays alive: the camera drifts, like it's handheld
      tl.add(() => {
        gsap.to(table, { rotationX: '+=1.4', rotationZ: '+=0.7', duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
      return () => typings.forEach((t) => t.cancel());
    }, section);

    const onResize = () => gsap.set(table, { scale: frameScale(), x: FINAL.x(), y: FINAL.y() });
    window.addEventListener('resize', onResize);
    return () => {
      ctx.revert();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const props: { el: React.ReactNode; x: number; y: number; r: number }[] = [
    { el: <Coffee />, x: 1330, y: 250, r: -10 },
    { el: <PowerBill />, x: 1490, y: 640, r: 12 },
    { el: <Card color="#6E5BFF" />, x: 1330, y: 990, r: -18 },
    { el: <Coin />, x: 620, y: 860, r: 0 },
    { el: <Coin size={40} />, x: 676, y: 890, r: 20 },
  ];

  return (
    <section ref={sectionRef} aria-label="Bills and Subscriptions" className="relative h-[calc(100svh-72px)] min-h-[600px] w-full overflow-hidden bg-black">
      {/* The shot */}
      <div data-n="lens" className="absolute inset-0">
        <div data-n="view" className="absolute inset-0 [perspective:1300px]" style={{ perspectiveOrigin: '50% 30%' }}>
          <div className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]">
            <div data-n="table" className="absolute [transform-style:preserve-3d]" style={{ left: -PHONE_X, top: -PHONE_Y, width: TABLE_W, height: TABLE_H }}>
              {/* The desk: dark walnut, its grain, the lamp's pool, and the phone's violet glow */}
              <div className="absolute inset-0 rounded-[40px]" style={{ background: 'linear-gradient(90deg,#17100b 0%,#21160e 22%,#1a120c 48%,#26190f 72%,#160f0a 100%)' }} />
              <svg className="absolute inset-0 h-full w-full rounded-[40px] opacity-70 mix-blend-overlay" aria-hidden="true">
                <filter id="night-grain">
                  <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.09" numOctaves="4" seed="3" />
                  <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.36  0 0 0 0 0.2  0 0 0 0.9 0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#night-grain)" />
              </svg>
              <div className="absolute inset-0 rounded-[40px]" style={{ background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 246px, rgba(0,0,0,0.55) 248px, rgba(0,0,0,0) 252px)' }} />
              <div data-n="lamp" className="absolute inset-0 rounded-[40px]" style={{ background: `radial-gradient(ellipse 820px 600px at ${PHONE_X - 120}px ${PHONE_Y - 60}px, rgba(255,190,120,0.32), rgba(255,160,80,0.07) 55%, transparent 75%)` }} />
              <div className="absolute inset-0 rounded-[40px]" style={{ background: `radial-gradient(ellipse 360px 460px at ${PHONE_X}px ${PHONE_Y}px, rgba(110,91,255,0.22), transparent 70%)` }} />
              <div className="absolute inset-0 rounded-[40px]" style={{ background: `radial-gradient(ellipse 1100px 760px at ${PHONE_X}px ${PHONE_Y}px, transparent 40%, rgba(0,0,0,0.78) 100%)` }} />

              {/* What's on the desk */}
              {props.map((p, i) => (
                <div key={i} className="absolute" style={{ left: p.x, top: p.y, transform: `translate(-50%,-50%) rotate(${p.r}deg)` }}>
                  <div style={{ filter: 'drop-shadow(10px 16px 14px rgba(0,0,0,0.6)) brightness(0.9) sepia(0.12)' }}>{p.el}</div>
                </div>
              ))}

              {/* The phone, face up */}
              <div className="absolute" style={{ left: PHONE_X, top: PHONE_Y, transform: 'translate(-50%,-50%) rotate(-3deg) translateZ(2px)' }}>
                <div className="absolute inset-0 translate-x-[16px] translate-y-[22px] rounded-[48px] bg-black/70 blur-[18px]" />
                <div data-n="phone" className="relative">
                  <LockScreen date={date} />
                </div>
              </div>

              {/* The hand, reaching in from the bottom right, with its shadow on the desk */}
              <div data-n="hand-pos" className="absolute [transform-style:preserve-3d]" style={{ left: PHONE_X, top: PHONE_Y }}>
                <div className="absolute [transform-style:preserve-3d]" style={{ transform: 'rotate(-128deg)' }}>
                  <div data-n="reach" className="absolute [transform-style:preserve-3d]" style={{ left: -398, top: -60 }}>
                    <div data-n="shadow" className="absolute left-0 top-0 opacity-30">
                      <TapHand shadow />
                    </div>
                    <div data-n="lift" className="relative" style={{ transform: 'translateZ(70px)' }}>
                      <TapHand />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The film: vignette, grain, soft letterbox, and the fade into what follows */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 75% 70% at 60% 55%, transparent 45%, rgba(0,0,0,0.85) 100%)' }} />
      <div className="cine-grain pointer-events-none absolute -inset-[50%] opacity-[0.07] mix-blend-overlay" />
      <div data-n="letterbox" className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[16%] origin-top" style={{ background: 'linear-gradient(180deg, #000 0%, #000 55%, rgba(0,0,0,0) 100%)' }} />
      <div data-n="letterbox" className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[18%] origin-bottom" style={{ background: 'linear-gradient(0deg, #000 0%, #000 50%, rgba(0,0,0,0) 100%)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[26%]" style={{ background: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0) 100%)' }} />

      {/* The words */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-full bg-gradient-to-b from-black/90 via-transparent to-transparent md:w-[48%] md:bg-gradient-to-r md:from-black md:via-black/70" />
      <div data-n="text" className="absolute left-4 right-4 top-6 z-30 max-w-[560px] sm:left-12 md:top-1/2 md:-translate-y-1/2" style={{ visibility: 'hidden' }}>
        <p data-n="eyebrow" className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Bills &amp; Subscriptions
        </p>
        <h1 data-n="title" className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-[60px]" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
          Never miss a <Gradient>due date</Gradient> again.
        </h1>
        <p data-n="body" className="mt-4 hidden max-w-md text-[15px] leading-relaxed text-neutral-300 sm:block sm:text-lg">
          Every subscription, bill and card payment, tracked to its date. A nudge before it’s due, an alert the moment it slips, and one tap to pay.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ['Reminders', 'before every due date'],
            ['Overdue', 'flagged instantly'],
            ['UPI', 'pay in a tap'],
          ].map(([a, b]) => (
            <span key={a} data-n="pill" className="flex items-baseline gap-1.5 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[13px] backdrop-blur">
              <b className="font-semibold text-white">{a}</b>
              <span className="text-neutral-300">{b}</span>
            </span>
          ))}
        </div>
      </div>
      <span className="sr-only">{rupees(1840)} electricity bill paid from a reminder.</span>
    </section>
  );
}
