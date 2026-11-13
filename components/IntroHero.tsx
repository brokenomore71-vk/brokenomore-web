'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import AiCore, { CrystalMark } from './stockAI/AiCore';
import type { Ticker } from './stockAI/aiCoreScene';
import { typeText, type Typing } from './typewriter';

// A feature page's opening: a 3D centrepiece (the AI crystal, or the split story's bill) appears
// alone in the middle of the screen, its cards fly out of it into orbit, then the whole thing
// glides over to its place on the right and the words type themselves in beside it.
export default function IntroHero({
  label,
  eyebrow,
  title,
  body,
  pills,
  tickers,
  receiptFont,
  glow = 'rgba(110,91,255,0.16)',
}: {
  label: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  pills: [string, string][];
  tickers: Ticker[];
  receiptFont?: string;
  glow?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const coreRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  // 0 waiting for the 3D, 1 the centrepiece appears, 2 the cards come out, 3 it moves aside and
  // the text types, 4 all done
  const [phase, setPhase] = useState(0);
  const readyRef = useRef(false);

  // Start in the middle of the section (measured before the first paint, so it never jumps)
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const core = coreRef.current;
    if (!section || !core) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setPhase(4));
      return () => cancelAnimationFrame(id);
    }
    // Measured from where it sits in the layout (so a second run in development doesn't measure
    // the offset it already applied), then moved to the middle of the section
    gsap.set(core, { x: 0, y: 0, scale: 1 });
    const s = section.getBoundingClientRect();
    const c = core.getBoundingClientRect();
    gsap.set(core, { x: s.left + s.width / 2 - (c.left + c.width / 2), y: s.top + s.height / 2 - (c.top + c.height / 2), scale: 1.08 });
    // The intro waits for the 3D, which can take a while the first time; only if it never comes
    // does it carry on with the drawn crystal
    const fallback = window.setTimeout(() => {
      if (!readyRef.current) setPhase((p) => Math.max(p, 1));
    }, 8000);
    return () => window.clearTimeout(fallback);
  }, []);

  const onReady = useCallback(() => {
    readyRef.current = true;
    setPhase((p) => Math.max(p, 1));
  }, []);

  useEffect(() => {
    if (phase === 1) {
      const id = window.setTimeout(() => setPhase(2), 1000);
      return () => window.clearTimeout(id);
    }
    if (phase === 2) {
      const id = window.setTimeout(() => setPhase(3), 1500);
      return () => window.clearTimeout(id);
    }
    if (phase !== 3) return;
    const core = coreRef.current!;
    const text = textRef.current!;
    const q = (k: string) => text.querySelector<HTMLElement>(`[data-type="${k}"]`)!;
    const tween = gsap.to(core, { x: 0, y: 0, scale: 1, duration: 1.1, ease: 'power3.inOut' });
    let cancelled = false;
    const typings: Typing[] = [];
    const run = async () => {
      await new Promise((r) => window.setTimeout(r, 650));
      if (cancelled) return;
      // Every line is emptied now and typed in turn, so none shows early
      const steps: [string, number][] = [
        ['eyebrow', 22],
        ['title', 48],
        ['body', 13],
      ];
      let delay = 0;
      steps.forEach(([k, ms]) => {
        const el = q(k);
        typings.push(typeText(el, { msPerChar: ms, delay, keepCaret: k === 'body' }));
        delay += (el.textContent?.length ?? 0) * ms + 180;
      });
      text.style.visibility = 'visible';
      await typings[typings.length - 1].done;
      if (!cancelled) setPhase(4);
    };
    run();
    return () => {
      cancelled = true;
      tween.kill();
      typings.forEach((t) => t.cancel());
    };
  }, [phase]);

  return (
    <section ref={sectionRef} aria-label={label} className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: phase >= 3 ? 1 : 0, background: `radial-gradient(ellipse 50% 50% at 70% 50%, ${glow}, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: phase >= 1 && phase < 3 ? 1 : 0, background: `radial-gradient(ellipse 35% 45% at 50% 50%, ${glow}, transparent 70%)` }}
      />
      <div className={`sa-scope ${phase >= 4 ? 'sa-in' : ''} relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-4 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1.15fr]`}>
        <div ref={textRef} className="relative z-10 text-center md:text-left" style={{ visibility: phase >= 4 ? 'visible' : 'hidden' }}>
          <p data-type="eyebrow" className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            {eyebrow}
          </p>
          <h1 data-type="title" className="mt-4 text-[40px] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p data-type="body" className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-neutral-400 sm:text-lg md:mx-0">
            {body}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2 md:justify-start">
            {pills.map(([a, b], i) => (
              <span key={a} className="sa-fade flex items-baseline gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px]" style={{ '--d': `${i * 0.1}s` } as React.CSSProperties}>
                <b className="font-semibold text-white">{a}</b>
                <span className="text-neutral-400">{b}</span>
              </span>
            ))}
          </div>
        </div>
        <div ref={coreRef} className="relative z-0">
          <AiCore
            tickers={tickers}
            receiptFont={receiptFont}
            appear={phase >= 1}
            emerge={phase >= 2}
            onReady={onReady}
            className="h-[380px] w-full sm:h-[480px] md:h-[min(620px,75svh)]"
            fallback={<CrystalMark className="h-40 w-40" />}
          />
        </div>
      </div>
    </section>
  );
}

// The gradient word in a hero's headline
export function Gradient({ children }: { children: React.ReactNode }) {
  return <span className="bg-[linear-gradient(120deg,#E86AB4_0%,#8B5CF6_55%,#6E5BFF_100%)] bg-clip-text text-transparent">{children}</span>;
}
