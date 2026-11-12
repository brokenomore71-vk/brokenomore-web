'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const poppins = Poppins({ weight: ['500', '600', '700', '800'], subsets: ['latin'] });

// Hubble's gift card offers, on a black stage. Hubble's logo sits in the middle and draws itself in
// as the section arrives. Scrolling then sends the partner brands' cards bursting out from behind
// it into a tilted ring that circles the logo: the cards in front pass over it, the ones behind
// dim and slip behind. The more you scroll, the faster the ring turns.

// Partner brands in their own colours. Names are set in type: swap in the brands' official logo
// files (with their permission) for the real marks.
const BRANDS = [
  { name: 'Reliance', accent: 'SMART', sub: 'Grocery', bg: '#E21B23', fg: '#FFFFFF', accentColor: '#1D3D8F', accentBg: '#FFFFFF' },
  { name: 'amazon', sub: 'shopping voucher', bg: '#131A22', fg: '#FFFFFF', accentColor: '#FF9900', smile: true },
  { name: 'PVR · INOX', sub: 'Movies', bg: '#1A1A1A', fg: '#E9C46A' },
  { name: 'cleartrip', sub: 'Travel', bg: '#F26722', fg: '#FFFFFF' },
  { name: 'IKEA', sub: 'Home', bg: '#0058A3', fg: '#FFDB00' },
  { name: 'TIMES', accent: 'PRIME', sub: 'Memberships', bg: '#5B2D8E', fg: '#FFFFFF', accentColor: '#F5B7FF' },
];
// Two of each, around the ring
const RING = [...BRANDS, ...BRANDS];

const BADGES = ['Instant e-delivery on WhatsApp', '5L+ happy users', 'Saved ₹10Cr till date', 'Safe & secure'];

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
// Overshoots a touch and settles, like something thrown into place
const backOut = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

export default function HubbleOffers() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => section.querySelector<HTMLElement>(`[data-h="${k}"]`)!;
    const qa = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-h="${k}"]`));
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const logo = q('logo');
      const stroke = q('mark-stroke');
      const dot = q('mark-dot');
      const letters = qa('letter');
      const shine = q('shine');
      const text = q('text');
      const cards = cardsRef.current.filter((c): c is HTMLDivElement => !!c);

      // ---- The logo draws itself in, once, as the section arrives ----
      gsap.set(stroke, { strokeDashoffset: 1 });
      gsap.set(dot, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(letters, { yPercent: 110, autoAlpha: 0 });
      gsap.set(shine, { xPercent: -120 });
      gsap.set(text, { autoAlpha: 0, y: 24 });
      gsap.set(cards, { autoAlpha: 0 });
      const intro = gsap.timeline({ paused: true });
      intro
        .to(stroke, { strokeDashoffset: 0, duration: 0.7, ease: 'power3.inOut' })
        .to(dot, { scale: 1, duration: 0.55, ease: 'back.out(3)' }, '-=0.15')
        .to(letters, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power4.out', stagger: 0.06 }, '-=0.35')
        .to(shine, { xPercent: 120, duration: 1.1, ease: 'power2.inOut' }, '-=0.2');
      const arrival = ScrollTrigger.create({ trigger: section, start: 'top 75%', once: true, onEnter: () => intro.play() });

      // ---- Scrolling drives the ring: pinned for a while, eased so it never jumps ----
      let target = 0;
      let progress = 0;
      const pin = ScrollTrigger.create({
        trigger: section,
        start: 'top 72px',
        end: '+=180%',
        pin: true,
        // Pinned sections must work out their positions top to bottom, whatever order they were made in
        refreshPriority: 3,
        onUpdate: (self) => {
          target = self.progress;
        },
      });

      let spin = 0;
      let lastProgress = 0;
      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs / 1000, 0.05);
        progress += (target - progress) * Math.min(1, dt * 6);
        // It turns on its own, and faster the quicker you scroll
        const scrollSpeed = Math.abs(progress - lastProgress) / Math.max(dt, 0.001);
        lastProgress = progress;
        spin += dt * (0.22 + Math.min(scrollSpeed * 2.4, 2.2));

        const w = section.clientWidth;
        const narrow = w < 768;
        const R = narrow ? (w < 400 ? Math.min(w * 0.34, 130) : Math.min(w * 0.38, 150)) : Math.min(w * 0.3, 430);
        const tilt = narrow ? 0.62 : 0.2; // how far the front of the ring dips below the logo
        const cardScale = narrow ? (w < 400 ? 0.44 : 0.52) : 1;
        const depth = 2000;
        const spread = backOut(seg(progress, 0, 0.45));
        // Towards the end the ring opens out a little and tips further, for the finish
        const open = smooth(seg(progress, 0.7, 1));

        cards.forEach((card, i) => {
          // Each card bursts out in turn
          const born = clamp01(seg(progress, i * 0.022, 0.22 + i * 0.022));
          const angle = spin + (i / cards.length) * Math.PI * 2;
          const r = R * (1 + open * 0.08) * Math.min(spread, 1.06) * backOut(born);
          const x = Math.sin(angle) * r;
          const z = Math.cos(angle) * r;
          const y = (narrow ? 130 : 70) + z * (tilt + open * 0.06);
          const s = depth / (depth - z);
          const facing = (z + R) / (2 * R); // 0 at the back, 1 at the front
          gsap.set(card, {
            x: x * s,
            y: y * s,
            scale: s * cardScale * (0.25 + 0.75 * born),
            rotationY: Math.sin(angle) * 32,
            rotationZ: Math.sin(angle) * -4,
            zIndex: z > 0 ? 60 + Math.round(z) : 10 + Math.round(z + R) / 20,
            autoAlpha: born <= 0 ? 0 : 0.28 + 0.72 * facing,
            filter: `brightness(${(0.45 + 0.55 * facing).toFixed(3)})`,
          });
        });

        // The logo eases back a little as the ring fills, and the words come in above
        gsap.set(logo, { scale: 1 - 0.12 * smooth(seg(progress, 0, 0.45)) });
        const words = smooth(seg(progress, 0.42, 0.62));
        gsap.set(text, { autoAlpha: words, y: 24 * (1 - words) });
      };
      gsap.ticker.add(tick);
      ScrollTrigger.sort();

      return () => {
        gsap.ticker.remove(tick);
        arrival.kill();
        pin.kill();
        intro.kill();
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="hubble"
        data-hubble
        aria-label="Hubble gift card offers"
        className={`relative w-full h-[calc(100svh-72px)] overflow-hidden bg-black text-white select-none motion-reduce:hidden ${poppins.className}`}
      >
        {/* A faint pool of light under the logo */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_50%_48%,rgba(255,255,255,0.06),transparent_70%)]" />

        {/* The ring of brand cards, laid out around the middle of the stage */}
        <div className="absolute left-1/2 top-[44%] [perspective:1200px]">
          {RING.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
              style={{ visibility: 'hidden' }}
            >
              <BrandTile brand={brand} />
            </div>
          ))}
        </div>

        {/* Hubble's logo, in the middle */}
        <div data-h="logo" className="absolute left-1/2 top-[44%] z-50 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center gap-2 xs:gap-3 overflow-hidden px-3 xs:px-4 py-2 sm:gap-5">
            <HubbleMark />
            <span className="flex text-[40px] xs:text-[52px] sm:text-[80px] md:text-[104px] font-bold leading-none tracking-[-0.03em]" aria-label="hubble">
              {'hubble'.split('').map((letter, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.12em]">
                  <span data-h="letter" className="inline-block" aria-hidden="true">
                    {letter}
                  </span>
                </span>
              ))}
            </span>
            {/* A light that sweeps across it once */}
            <span
              data-h="shine"
              className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/25 to-transparent mix-blend-overlay"
            />
          </div>
        </div>

        {/* The offer, above */}
        <div data-h="text" className="absolute inset-x-0 top-5 sm:top-8 z-[70] px-3 xs:px-4 text-center" style={{ visibility: 'hidden' }}>
          <h2 className="text-xl xs:text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Instant discounts on <span className="text-white">400+ brands</span>{' '}
            <span className="text-neutral-400">with gift cards</span>
          </h2>
          <ul className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 gap-y-1.5 sm:gap-y-2 text-[11px] xs:text-xs text-neutral-400 sm:text-sm">
            {BADGES.map((badge, i) => (
              <li key={badge} className="flex items-center gap-1.5 sm:gap-2">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-neutral-600" aria-hidden="true" />}
                {badge}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Without motion: the logo and the brands, laid out still */}
      <div className={`hidden motion-reduce:block w-full bg-black px-4 py-16 text-center text-white ${poppins.className}`}>
        <div className="flex items-center justify-center gap-3">
          <HubbleMark static />
          <span className="text-5xl font-bold tracking-[-0.03em]">hubble</span>
        </div>
        <p className="mt-4 text-lg text-neutral-300">Instant discounts on 400+ brands with gift cards</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {BRANDS.map((brand) => (
            <BrandTile key={brand.name} brand={brand} />
          ))}
        </div>
      </div>
    </>
  );
}

// Hubble's mark: a slanted stroke and a dot, drawn so it can animate
function HubbleMark({ static: still = false }: { static?: boolean }) {
  return (
    <svg viewBox="0 0 60 60" className="h-8 w-8 xs:h-11 xs:w-11 sm:h-[72px] sm:w-[72px] md:h-[88px] md:w-[88px] shrink-0" aria-hidden="true">
      <path
        data-h={still ? undefined : 'mark-stroke'}
        d="M12 46 L30 12"
        fill="none"
        stroke="#ffffff"
        strokeWidth="17"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
      />
      <circle data-h={still ? undefined : 'mark-dot'} cx="45" cy="45" r="8.5" fill="#ffffff" />
    </svg>
  );
}

function BrandTile({ brand }: { brand: (typeof BRANDS)[number] }) {
  return (
    <div
      className="relative flex h-[200px] w-[156px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-2xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
      style={{ background: brand.bg, color: brand.fg }}
    >
      <div className="mt-4 text-center leading-none">
        <span className="block text-[25px] font-extrabold tracking-tight">{brand.name}</span>
        {'accent' in brand && brand.accent && (
          <span
            className="mt-1 inline-block rounded px-1.5 py-0.5 text-[21px] font-black tracking-tight"
            style={{ color: brand.accentColor, background: 'accentBg' in brand ? brand.accentBg : 'transparent' }}
          >
            {brand.accent}
          </span>
        )}
        {'smile' in brand && brand.smile && (
          <svg viewBox="0 0 60 12" className="mx-auto mt-1 h-3 w-14" aria-hidden="true">
            <path d="M3 3c14 8 36 8 52 0" fill="none" stroke={brand.accentColor} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M50 1.5 56 3l-3 5" fill="none" stroke={brand.accentColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="mb-1 flex w-full items-center justify-between text-[11px] font-medium opacity-85">
        <span className="truncate">{brand.sub}</span>
        <span className="whitespace-nowrap rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold">Gift card</span>
      </div>
      {/* A soft sheen across the tile */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />
    </div>
  );
}
