'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Predictive Prosperity Hero
 *
 * A cinematic, scroll-triggered hero section:
 *   – Initial state: a horizontal CSS smartphone centred on a pure-black background,
 *     with the BrokeNoMore logo on its screen and the headline "PREDICTIVE PROSPERITY"
 *     hidden tiny behind it.
 *   – Scroll 0–45 %: the headline scales up dramatically, filling the screen behind the phone.
 *   – Scroll 45–85 %: the phone rotates clockwise ≈ −30 ° into a diagonal tilt.
 *   – Scroll 85–100 %: hold the final composition, then unpin.
 *
 * Uses a single GSAP timeline with `pin: true`, `scrub: 1`, and `anticipatePin: 1`.
 */
export default function PredictiveProsperityHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const phone = phoneRef.current;
    const text = textRef.current;
    if (!section || !phone || !text) return;

    // Respect reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(text, { scale: 1, opacity: 1 });
      gsap.set(phone, { rotation: 63.45 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=300%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 4,
          invalidateOnRefresh: true,
        },
      });

      // Phase 1 (0 → 35 %): headline scales up from behind the phone
      tl.fromTo(
        text,
        { scale: 0.18, opacity: 0.08 },
        { scale: 1, opacity: 1, ease: 'power2.out', duration: 0.35 },
        0,
      );

      // Phase 2 (35 % → 65 %): phone rotates to diagonal
      tl.to(
        phone,
        { rotation: 63.45, ease: 'power2.inOut', duration: 0.30 },
        0.35,
      );

      // Phase 3 (65 % → 100 %): hold the tilted phone & headline steady while scrolling
      tl.to({}, { duration: 0.35 });

      ScrollTrigger.sort();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* ── Headline behind the phone ────────────────────────────────── */}
      <div
        ref={textRef}
        className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none select-none"
        style={{ scale: 0.18, opacity: 0.08 }}
      >
        <h2
          className="text-center font-black uppercase leading-[0.88] tracking-tight"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', 'Impact', sans-serif",
            fontSize: 'clamp(3.5rem, 13vw, 16rem)',
            color: '#5B5CFF',
            lineHeight: 0.88,
            letterSpacing: '-0.02em',
          }}
        >
          PREDICTIVE
          <br />
          PROSPERITY
        </h2>
      </div>

      {/* ── Smartphone (phone.png image with logo overlay) ─────────── */}
      <div className="absolute inset-0 z-[2] flex items-center justify-center">
        <div
          ref={phoneRef}
          className="relative"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
            width: 'clamp(300px, 42vw, 520px)',
          }}
        >
          {/* Phone image */}
          <Image
            src="/assets/images/phone.png"
            alt=""
            width={1024}
            height={512}
            className="w-full h-auto object-contain select-none"
            draggable={false}
            priority
          />

          {/* Logo centred on the phone screen (offset slightly up to match the screen area) */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-3%' }}>
            <Image
              src="/assets/images/main_logo.png"
              alt="BrokeNoMore"
              width={80}
              height={80}
              className="object-contain"
              style={{ width: 'clamp(44px, 7vw, 80px)', height: 'auto' }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
