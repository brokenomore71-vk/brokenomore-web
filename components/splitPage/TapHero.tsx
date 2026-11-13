'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Gradient } from '../IntroHero';
import { typeText, type Typing } from '../typewriter';
import { BILL, PEOPLE, inr } from '../splitStory/splitData';
import { Avatar, PERSON_COLORS } from './screens';

// The Split & Share hero: everyone at the table pays their own share at once. A card terminal
// rises in the middle, tipped back in 3D, showing the Saffron Table bill split four ways. Four
// arms reach in from the edges, three holding cards in each friend's colour and one a phone, and
// tap the terminal in turn: a contactless ripple goes out, that friend's row turns to Paid, and the
// amount collected counts up to the total. Then the headline types itself in above, and the arms
// keep swaying a little while the pointer tilts the whole scene.

// Each arm: where it reaches in from (degrees; 0 is from the left, pointing right), which side of
// the screen it's on, its skin and sleeve, and what it holds
const ARMS = [
  { id: 'you', side: 'left', angle: 8, y: -175, skin: '#f2c6a0', sleeve: '#6E5BFF', holds: 'card' },
  { id: 'atharva', side: 'right', angle: 6, y: -150, skin: '#8d5a3b', sleeve: '#E86AB4', holds: 'card' },
  { id: 'parva', side: 'left', angle: -9, y: 150, skin: '#c98f62', sleeve: '#38BDF8', holds: 'card' },
  { id: 'ruchi', side: 'right', angle: -10, y: 170, skin: '#5c3a24', sleeve: '#F5A524', holds: 'phone' },
] as const;
const share = (id: string) => PEOPLE.find((p) => p.id === id)!.dutch;
const STAGE_W = 1100;
const STAGE_H = 560;

function Contactless({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
    </svg>
  );
}

// A bank card in a friend's colour (the face is never mirrored, whichever side it's held from)
function Card({ color }: { color: string }) {
  return (
    <div
      className="relative h-[96px] w-[152px] overflow-hidden rounded-[14px] shadow-[0_18px_30px_-8px_rgba(0,0,0,0.6)]"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 55%, #0b0b0d 160%)` }}
    >
      <span className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15" />
      <span className="absolute left-3 top-8 h-[18px] w-[24px] rounded-[4px] bg-gradient-to-br from-[#fff1b8] to-[#c48a17]" />
      <Contactless className="absolute left-10 top-8 h-[18px] w-[18px] text-white/80" />
      <span className="absolute bottom-2.5 left-3 text-[9px] font-semibold tracking-[0.2em] text-white/85">•••• 4821</span>
      <span className="absolute bottom-2 right-3 flex">
        <span className="h-4 w-4 rounded-full bg-white/70" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-white/40" />
      </span>
    </div>
  );
}

// A phone with the app's UPI screen
function Phone() {
  return (
    <div className="relative h-[150px] w-[84px] rounded-[16px] border-[3px] border-[#1d1d22] bg-[#131418] p-1.5 shadow-[0_18px_30px_-8px_rgba(0,0,0,0.6)]">
      <span className="mx-auto block h-1 w-6 rounded-full bg-[#2a2a30]" />
      <div className="mt-2 rounded-lg p-1.5" style={{ background: 'linear-gradient(140deg,#6E5BFF,#E86AB4)' }}>
        <p className="text-[6px] font-semibold tracking-wider text-white/80">PAY VIA UPI</p>
        <p className="text-[12px] font-bold text-white">{inr(share('ruchi'), 0)}</p>
      </div>
      <div className="mt-1.5 space-y-1">
        <span className="block h-1.5 w-full rounded-full bg-white/10" />
        <span className="block h-1.5 w-2/3 rounded-full bg-white/10" />
      </div>
      <span className="absolute inset-x-1.5 bottom-2 rounded-md bg-[#6E5BFF] py-1 text-center text-[7px] font-bold text-white">Pay</span>
    </div>
  );
}

// An arm reaching in from the left (mirrored for the right): a sleeve, a hand, and in it a card or
// a phone. Drawn flat, with soft shading, in the app's colours.
function Arm({ skin, sleeve, holds, mirrored }: { skin: string; sleeve: string; holds: 'card' | 'phone'; mirrored: boolean }) {
  const shade = 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.18))';
  return (
    <div className="relative h-[170px] w-[520px]">
      {/* Sleeve, with a cuff */}
      <div className="absolute left-0 top-[52px] h-[78px] w-[330px] rounded-r-[30px]" style={{ background: sleeve, backgroundImage: shade }} />
      <div className="absolute left-[300px] top-[48px] h-[86px] w-[34px] rounded-[16px]" style={{ background: sleeve, filter: 'brightness(0.82)' }} />
      {/* The back of the hand */}
      <div className="absolute left-[318px] top-[54px] h-[70px] w-[96px] rounded-[34px]" style={{ background: skin, backgroundImage: shade }} />
      {/* What it holds, between the palm and the fingers */}
      <div className="absolute left-[352px] top-0" style={{ transform: `rotate(-12deg) ${mirrored ? 'scaleX(-1)' : ''}` }}>
        {holds === 'card' ? <Card color={sleeve} /> : <Phone />}
      </div>
      {/* Fingers wrapped over its edge, and the thumb */}
      {[0, 1, 2].map((k) => (
        <div key={k} className="absolute h-[19px] w-[52px] rounded-full" style={{ left: 370 + k * 3, top: 70 + k * 18, background: skin, backgroundImage: shade, transform: 'rotate(-12deg)' }} />
      ))}
      <div className="absolute left-[372px] top-[44px] h-[22px] w-[58px] rounded-full" style={{ background: skin, backgroundImage: shade, transform: 'rotate(-30deg)' }} />
    </div>
  );
}

export default function TapHero() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-t="${k}"]`));
    const [stage] = q('stage');
    const [fit] = q('fit');
    const [tilt] = q('tilt');
    const [terminal] = q('terminal');
    const reaches = q('reach');
    const rows = q('row');
    const paids = q('paid');
    const ripples = q('ripple');
    const [collectedEl] = q('collected');
    const [bar] = q('bar');
    const [text] = q('text');
    const pills = q('pill');
    // Fitted to the height, and on narrow screens to the terminal and hands (the arms run off the sides)
    const scaleFit = () => Math.min(1, stage.clientHeight / STAGE_H, Math.max(stage.clientWidth / STAGE_W, stage.clientWidth / 560));

    // The pointer tilts the scene
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      gsap.to(tilt, { rotationY: (((e.clientX - r.left) / r.width) * 2 - 1) * 7, rotationX: 14 - (((e.clientY - r.top) / r.height) * 2 - 1) * 5, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
    };

    const ctx = gsap.context(() => {
      gsap.set(fit, { xPercent: -50, yPercent: -50, scale: scaleFit });
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        gsap.set(tilt, { rotationX: 14 });
        gsap.set(paids, { autoAlpha: 1 });
        gsap.set(bar, { scaleX: 1 });
        collectedEl.textContent = inr(BILL.total, 0);
        return;
      }
      gsap.set(text, { autoAlpha: 0 });
      gsap.set(pills, { autoAlpha: 0, y: 8 });
      gsap.set(tilt, { rotationX: 58, y: 160, scale: 0.8, autoAlpha: 0 });
      gsap.set(reaches, { x: -620 });
      gsap.set(paids, { autoAlpha: 0, scale: 0.6 });
      gsap.set(ripples, { scale: 0.4, autoAlpha: 0 });
      gsap.set(bar, { scaleX: 0, transformOrigin: 'left' });

      const money = { v: 0 };
      const typings: Typing[] = [];
      const tl = gsap.timeline({ delay: 0.25, onUpdate: () => {
        collectedEl.textContent = inr(money.v, 0);
      } });
      // The terminal rises and tips back
      tl.to(tilt, { rotationX: 14, y: 0, scale: 1, autoAlpha: 1, duration: 1.1, ease: 'power3.out' }, 0);
      // Everyone reaches in
      tl.to(reaches, { x: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 }, 0.45);
      // And taps, one after another
      ARMS.forEach((arm, i) => {
        const at = 1.55 + i * 0.55;
        tl.to(reaches[i], { x: 70, duration: 0.2, ease: 'power2.in' }, at);
        tl.to(terminal, { y: 4, duration: 0.07, yoyo: true, repeat: 1 }, at + 0.2);
        tl.fromTo(ripples, { scale: 0.4, autoAlpha: 0.9 }, { scale: 2.2, autoAlpha: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08, immediateRender: false }, at + 0.2);
        tl.to(paids[i], { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, at + 0.25);
        tl.to(rows[i], { backgroundColor: `${PERSON_COLORS[arm.id]}22`, borderColor: `${PERSON_COLORS[arm.id]}88`, duration: 0.2 }, at + 0.25);
        tl.to(money, { v: `+=${share(arm.id)}`, duration: 0.35, ease: 'power2.out' }, at + 0.25);
        tl.to(bar, { scaleX: (i + 1) / ARMS.length, duration: 0.35, ease: 'power2.out' }, at + 0.25);
        tl.to(reaches[i], { x: 0, duration: 0.45, ease: 'power2.out' }, at + 0.25);
      });
      tl.set(money, { v: BILL.total }, '>');
      // Then the words
      tl.add(() => {
        gsap.set(text, { autoAlpha: 1 });
        let delay = 0;
        (['eyebrow', 'title', 'body'] as const).forEach((k, i) => {
          const el = q(k)[0];
          const ms = [22, 46, 13][i];
          typings.push(typeText(el, { msPerChar: ms, delay, keepCaret: k === 'body' }));
          delay += (el.textContent?.length ?? 0) * ms + 180;
        });
        typings[typings.length - 1].done.then(() => gsap.to(pills, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08 }));
      }, 1.6);
      // The arms keep swaying a little, and the pointer can tilt the scene once it's settled
      tl.add(() => {
        reaches.forEach((r, i) => gsap.to(r, { x: 8 + i * 2, rotation: i % 2 ? 1.5 : -1.5, duration: 2 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
        if (window.matchMedia('(pointer: fine)').matches) section.addEventListener('pointermove', onMove);
      });
      return () => typings.forEach((t) => t.cancel());
    }, section);

    const onResize = () => gsap.set(fit, { scale: scaleFit() });
    window.addEventListener('resize', onResize);
    return () => {
      ctx.revert();
      window.removeEventListener('resize', onResize);
      section.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <section ref={sectionRef} aria-label="Split and Share" className="relative flex min-h-[calc(100svh-72px)] flex-col items-center overflow-hidden px-4 pt-10 sm:pt-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_70%,rgba(110,91,255,0.22),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_50%_75%,rgba(232,106,180,0.14),transparent_70%)]" />

      {/* The words, typed in once the taps begin */}
      <div data-t="text" className="relative z-20 mx-auto max-w-3xl text-center" style={{ visibility: 'hidden' }}>
        <p data-t="eyebrow" className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Split &amp; Share
        </p>
        <h1 data-t="title" className="mt-3 text-[38px] font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-[64px]">
          Split any bill. <Gradient>Settle</Gradient> it in seconds.
        </h1>
        <p data-t="body" className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-400 sm:text-lg">
          Split equally or go Dutch. Snap the bill, tag who had what, and everyone pays just their share, right down to the paisa.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[
            ['Equal', 'or Dutch'],
            ['OCR', 'reads the bill'],
            ['UPI', 'settles it'],
          ].map(([a, b]) => (
            <span key={a} data-t="pill" className="flex items-baseline gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px]">
              <b className="font-semibold text-white">{a}</b>
              <span className="text-neutral-400">{b}</span>
            </span>
          ))}
        </div>
      </div>

      {/* The table: the terminal, and everyone reaching in */}
      <div data-t="stage" className="relative min-h-[420px] w-full flex-1">
        <div data-t="fit" className="absolute left-1/2 top-1/2 [perspective:1400px]" style={{ width: STAGE_W, height: STAGE_H }}>
          <div data-t="tilt" className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: 'rotateX(14deg)' }}>
            {/* Its shadow on the table */}
            <div className="absolute left-1/2 top-[86%] h-14 w-[340px] -translate-x-1/2 rounded-[50%] bg-black/70 blur-2xl" />

            {/* The terminal */}
            <div data-t="terminal" className="absolute left-1/2 top-1/2 h-[440px] w-[270px] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
              {/* Its thickness */}
              <div className="absolute inset-0 translate-y-[10px] rounded-[34px] bg-[#09090b]" style={{ transform: 'translateZ(-14px)' }} />
              <div className="absolute inset-0 overflow-hidden rounded-[34px] border border-white/10 p-4 shadow-[0_40px_80px_-20px_rgba(110,91,255,0.45)]" style={{ background: 'linear-gradient(160deg,#1f2026 0%,#131418 55%,#0e0e11 100%)' }}>
                {/* The contactless reader, with its ripples */}
                <div className="relative mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#6E5BFF]/15 text-[#a99dff]">
                  {[0, 1, 2].map((k) => (
                    <span key={k} data-t="ripple" className="absolute inset-0 rounded-full border-2 border-[#8f80ff]" />
                  ))}
                  <Contactless className="h-8 w-8" />
                </div>
                {/* The screen */}
                <div className="mt-3 rounded-[20px] bg-[#16171b] p-3.5 ring-1 ring-white/[0.06]">
                  <p className="flex items-center gap-1.5 text-[15px] font-semibold">
                    <span className="text-[#8f80ff]">‹</span> Split Bill
                  </p>
                  <div className="mt-2.5 rounded-xl px-3 py-2.5" style={{ background: 'linear-gradient(140deg,#6E5BFF 0%,#8B5CF6 60%,#E86AB4 130%)' }}>
                    <p className="text-[10px] font-semibold tracking-[0.15em] text-white/80">{BILL.splitName.toUpperCase()} · TOTAL</p>
                    <p className="text-[22px] font-bold leading-tight">{inr(BILL.total, 0)}</p>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {ARMS.map((arm) => {
                      const p = PEOPLE.find((x) => x.id === arm.id)!;
                      return (
                        <div key={arm.id} data-t="row" className="flex items-center gap-2 rounded-lg border border-transparent bg-[#1f2025] px-2 py-1.5">
                          <Avatar id={arm.id} size={22} />
                          <span className="flex-1 text-[11.5px] font-medium">{p.name}</span>
                          <span className="text-[11.5px] font-semibold tabular-nums">{inr(p.dutch, 0)}</span>
                          <span data-t="paid" className="rounded-full bg-[#34d399] px-1.5 text-[9px] font-bold text-[#062a1c]">
                            ✓
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between text-[11px] text-[#85868c]">
                    <span>Collected</span>
                    <span data-t="collected" className="text-[14px] font-bold tabular-nums text-white">
                      ₹0
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div data-t="bar" className="h-full w-full rounded-full bg-[linear-gradient(90deg,#6E5BFF,#E86AB4,#34d399)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Everyone reaching in */}
            {ARMS.map((arm) => {
              const mirrored = arm.side === 'right';
              return (
                <div
                  key={arm.id}
                  className="absolute top-1/2"
                  style={{
                    // Both sides are drawn reaching right; the right side's are flipped about their
                    // own left edge, which sits just off the stage's right
                    left: mirrored ? STAGE_W + 70 : -70,
                    transform: `translateY(calc(-50% + ${arm.y}px)) ${mirrored ? 'scaleX(-1)' : ''} rotate(${arm.angle}deg)`,
                    transformOrigin: '0% 50%',
                    zIndex: arm.y > 0 ? 3 : 2,
                  }}
                >
                  <div data-t="reach" style={{ transformOrigin: '0% 50%' }}>
                    <Arm skin={arm.skin} sleeve={arm.sleeve} holds={arm.holds} mirrored={mirrored} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
