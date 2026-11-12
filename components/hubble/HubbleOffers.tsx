'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { holdPinUntilPlayed } from '../journey';

gsap.registerPlugin(ScrollTrigger);


// Hubble's gift card offers, on a black stage. Hubble's logo sits in the middle and draws itself in
// as the section arrives. Scrolling then sends the partner brands' cards bursting out from behind
// it into a tilted ring that circles the logo: the cards in front pass over it, the ones behind
// dim and slip behind. The more you scroll, the faster the ring turns.

// Partner brands, each as a gift card: an image tile in the brand's colour with its name set as a
// wordmark and a flat illustration of what it sells, then the name, category and discount below.
// Names are set in type: swap in the brands' official logo files (with their permission) for the
// real marks.
type Art = 'bowl' | 'pizza' | 'shirt' | 'box' | 'bag' | 'popcorn' | 'ticket' | 'basket' | 'plane' | 'car';
interface Brand {
  name: string;
  category: string;
  off?: string;
  bg: string;
  art: Art;
  mark: React.ReactNode;
}
const BRANDS: Brand[] = [
  {
    name: 'Swiggy', category: 'Food', off: '3% off', bg: '#FC8019', art: 'bowl',
    mark: <span className="text-[16px] font-extrabold tracking-[0.2em] text-white">SWIGGY</span>,
  },
  {
    name: 'Zomato', category: 'Food', off: '2% off', bg: '#E23744', art: 'pizza',
    mark: <span className="text-[23px] font-extrabold italic tracking-tight text-white">zomato</span>,
  },
  {
    name: 'Myntra', category: 'Fashion', off: '2% off', bg: 'linear-gradient(135deg,#FF3F6C,#C2128B)', art: 'shirt',
    mark: <span className="text-[21px] font-bold tracking-tight text-white">Myntra</span>,
  },
  {
    name: 'Amazon', category: 'Shopping', bg: '#232F3E', art: 'box',
    mark: (
      <span className="flex flex-col items-center leading-none">
        <span className="text-[22px] font-bold tracking-tight text-white">amazon</span>
        <svg viewBox="0 0 60 12" className="-mt-0.5 h-3 w-14" aria-hidden="true">
          <path d="M3 3c14 8 36 8 52 0" fill="none" stroke="#FF9900" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M50 1.5 56 3l-3 5" fill="none" stroke="#FF9900" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    ),
  },
  {
    name: 'Flipkart', category: 'Shopping', bg: '#2874F0', art: 'bag',
    mark: <span className="text-[21px] font-bold italic tracking-tight text-white">Flip<span className="text-[#FFE11B]">kart</span></span>,
  },
  {
    name: 'BookMyShow', category: 'Entertainment', off: '2% off', bg: '#2A2A3A', art: 'popcorn',
    mark: (
      <span className="flex items-center text-[16px] font-bold tracking-tight text-white">
        book<span className="mx-0.5 rounded bg-[#F84464] px-1 italic">my</span>show
      </span>
    ),
  },
  {
    name: 'PVR', category: 'Entertainment', off: '18% off', bg: '#1C1C1C', art: 'ticket',
    mark: <span className="text-[19px] font-extrabold tracking-wide text-[#E9C46A]">PVR·INOX</span>,
  },
  {
    name: "Domino's", category: 'Food', off: '16% off', bg: 'linear-gradient(160deg,#0B7BC0,#00578A)', art: 'pizza',
    mark: <span className="text-[21px] font-extrabold tracking-tight text-white">Domino&apos;s</span>,
  },
  {
    name: 'Blinkit', category: 'Grocery', bg: '#F8CB46', art: 'basket',
    mark: <span className="text-[24px] font-extrabold tracking-tight text-[#1A1A1A]">blink<span className="text-[#0C831F]">it</span></span>,
  },
  {
    name: 'Zepto', category: 'Grocery', bg: 'linear-gradient(160deg,#5B1A9B,#2E0857)', art: 'basket',
    mark: <span className="text-[25px] font-extrabold tracking-tight text-[#FF4F7B]">zepto</span>,
  },
  {
    name: 'MakeMyTrip', category: 'Travel', bg: 'linear-gradient(160deg,#1B5FB4,#0B3C7A)', art: 'plane',
    mark: (
      <span className="flex items-center text-[16px] font-bold tracking-tight text-white">
        make<span className="mx-0.5 rounded bg-[#E7262B] px-1 italic">my</span>trip
      </span>
    ),
  },
  {
    name: 'Uber', category: 'Travel', bg: '#151515', art: 'car',
    mark: <span className="text-[26px] font-medium tracking-tight text-white">Uber</span>,
  },
];
// One of each around the ring
const RING = BRANDS;

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
      const letters = qa('letter');
      const shine = q('shine');
      const text = q('text');
      const cards = cardsRef.current.filter((c): c is HTMLDivElement => !!c);

      // ---- The title rises in, letter by letter, once, as the section arrives ----
      gsap.set(letters, { yPercent: 110, autoAlpha: 0 });
      gsap.set(shine, { xPercent: -120 });
      gsap.set(text, { autoAlpha: 0, y: 24 });
      gsap.set(cards, { autoAlpha: 0 });
      const intro = gsap.timeline({ paused: true });
      intro
        .to(letters, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power4.out', stagger: 0.06 })
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
      // The ring settles before the page moves on to the next section
      const releaseHold = holdPinUntilPlayed(
        () => pin,
        () => progress,
        (toEnd) => {
          progress = toEnd ? 1 : 0;
        }
      );

      return () => {
        releaseHold();
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
        className={`relative w-full h-[calc(100svh-72px)] overflow-hidden bg-black text-white select-none motion-reduce:hidden`}
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
            <span className="flex text-[34px] sm:text-[64px] lg:text-[84px] font-semibold leading-none tracking-[0.02em] text-white whitespace-nowrap" aria-label="Offers">
              {'Offers'.split('').map((letter, i) => (
                <span key={i} className="inline-block overflow-hidden pb-[0.1em]">
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
      <div className={`hidden motion-reduce:block w-full bg-black px-4 py-16 text-center text-white`}>
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl font-semibold tracking-[0.02em]">Offers</span>
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

function BrandTile({ brand }: { brand: Brand }) {
  return (
    <div className="relative flex h-[200px] w-[156px] shrink-0 flex-col overflow-hidden rounded-2xl bg-[#141414] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
      {/* The image: the brand's colour, its wordmark, and what it sells */}
      <div className="relative flex h-[118px] w-full shrink-0 flex-col items-center overflow-hidden rounded-xl" style={{ background: brand.bg }}>
        <div className="mt-3 flex h-7 items-center justify-center leading-none">{brand.mark}</div>
        <BrandArt kind={brand.art} />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />
      </div>
      {/* Name, category and the offer */}
      <div className="flex flex-1 flex-col justify-center px-1.5 leading-tight">
        <span className="truncate text-[13px] font-semibold text-white">{brand.name}</span>
        <span className="mt-0.5 truncate text-[10.5px] text-neutral-400">{brand.category}</span>
        <span className={`mt-1 text-[11px] font-semibold ${brand.off ? 'text-[#4ADE80]' : 'text-neutral-500'}`}>{brand.off ?? 'Gift card'}</span>
      </div>
    </div>
  );
}

// Flat illustrations for each kind of brand, drawn to sit along the bottom of the image tile
function BrandArt({ kind }: { kind: Art }) {
  const shadow = <ellipse cx="50" cy="66" rx="30" ry="4" fill="rgba(0,0,0,0.22)" />;
  const art: Record<Art, React.ReactNode> = {
    // A bowl of biryani
    bowl: (
      <>
        {shadow}
        <ellipse cx="50" cy="38" rx="28" ry="12" fill="#F4C46A" />
        {[[38, 34], [46, 30], [56, 33], [62, 38], [44, 40], [52, 41], [34, 39]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.2" fill={i % 3 === 0 ? '#C0521F' : i % 3 === 1 ? '#FFF1C9' : '#7A9B2E'} />
        ))}
        <path d="M20 40h60c0 14-13 24-30 24S20 54 20 40Z" fill="#5A3417" />
        <path d="M20 40h60" stroke="#3E220E" strokeWidth="2" />
        <path d="M26 46c6 8 14 12 24 12" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
    // A pizza
    pizza: (
      <>
        {shadow}
        <ellipse cx="50" cy="48" rx="34" ry="17" fill="#E2A04A" />
        <ellipse cx="50" cy="47" rx="29" ry="14" fill="#D2412A" />
        {[[38, 44], [50, 40], [62, 45], [44, 52], [57, 53], [32, 49], [67, 50]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="5" ry="3" fill="#FFD966" />
        ))}
        {[[44, 45], [56, 47], [50, 53], [38, 51], [63, 42]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.7" fill="#8E1F14" />
        ))}
        {[[48, 46], [60, 51], [41, 41]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y}q2-3 4 0q-2 2-4 0Z`} fill="#2F7D32" />
        ))}
      </>
    ),
    // A T-shirt on a hanger
    shirt: (
      <>
        {shadow}
        <path d="M50 14v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 18 34 26h32Z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <path d="M36 26l-12 8 6 10 6-4v24h28V40l6 4 6-10-12-8c-2 4-6 6-14 6s-12-2-14-6Z" fill="#fff" />
        <path d="M43 26c2 3 4 4 7 4s5-1 7-4" fill="none" stroke="#E5157A" strokeWidth="1.6" />
        <rect x="42" y="44" width="16" height="3" rx="1.5" fill="#FFB1CF" />
      </>
    ),
    // A parcel
    box: (
      <>
        {shadow}
        <path d="M28 30 50 22l22 8v26l-22 9-22-9Z" fill="#C8955C" />
        <path d="M28 30l22 9 22-9" fill="none" stroke="#9C6B37" strokeWidth="1.5" />
        <path d="M50 39v26" stroke="#9C6B37" strokeWidth="1.5" />
        <path d="M28 30 50 22l22 8-22 9Z" fill="#DDAE75" />
        <path d="M37 26.5 59 35v8l-6-2v-6L31 28.7Z" fill="#F1D3A5" opacity="0.9" />
        <path d="M54 55c5 3 10 3 15-1" fill="none" stroke="#232F3E" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    // A shopping bag
    bag: (
      <>
        {shadow}
        <path d="M40 30c0-8 4-12 10-12s10 4 10 12" fill="none" stroke="#FFE11B" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 30h40l3 34H27Z" fill="#FFE11B" />
        <path d="M30 30h40l1 8H29Z" fill="#F5C400" />
        <circle cx="40" cy="36" r="2" fill="#2874F0" />
        <circle cx="60" cy="36" r="2" fill="#2874F0" />
        <path d="M44 48h12l-2 10H46Z" fill="#2874F0" opacity="0.85" />
      </>
    ),
    // A bucket of popcorn
    popcorn: (
      <>
        {shadow}
        {[[38, 26], [46, 22], [54, 23], [62, 27], [42, 30], [58, 30], [50, 28], [34, 31], [66, 32]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill={i % 2 ? '#FFF6DA' : '#FFE9A8'} />
        ))}
        <path d="M30 32h40l-5 32H35Z" fill="#fff" />
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${36 + k * 10} 32h5l-1.6 32h-4.2Z`} fill="#F84464" />
        ))}
      </>
    ),
    // A cinema ticket and a film reel
    ticket: (
      <>
        {shadow}
        <circle cx="64" cy="40" r="17" fill="#3A3A3A" />
        <circle cx="64" cy="40" r="4" fill="#1C1C1C" />
        {[0, 1, 2, 3, 4].map((k) => {
          const a = (k / 5) * Math.PI * 2;
          return <circle key={k} cx={64 + Math.cos(a) * 10} cy={40 + Math.sin(a) * 10} r="3.6" fill="#1C1C1C" />;
        })}
        <g transform="rotate(-12 40 46)">
          <path d="M22 36h36v6a4 4 0 0 0 0 8v6H22v-6a4 4 0 0 0 0-8Z" fill="#E9C46A" />
          <path d="M48 37v18" stroke="#1C1C1C" strokeWidth="1.2" strokeDasharray="2 2" />
          <rect x="27" y="42" width="15" height="2.4" rx="1.2" fill="#1C1C1C" opacity="0.7" />
          <rect x="27" y="47" width="10" height="2.4" rx="1.2" fill="#1C1C1C" opacity="0.5" />
        </g>
      </>
    ),
    // A basket of groceries
    basket: (
      <>
        {shadow}
        <path d="M40 30c2-8 6-12 10-14" stroke="#2F7D32" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="54" cy="18" rx="6" ry="3" fill="#43A047" transform="rotate(-25 54 18)" />
        <circle cx="38" cy="38" r="8" fill="#E53935" />
        <circle cx="52" cy="35" r="9" fill="#FB8C00" />
        <circle cx="64" cy="39" r="7" fill="#8E24AA" />
        <path d="M44 30c4-6 10-6 12-2" stroke="#7CB342" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M26 42h48l-5 22H31Z" fill="#B07A3B" />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${33 + k * 11} 44l-1 18`} stroke="#8A5A26" strokeWidth="1.5" />
        ))}
        <path d="M26 42h48" stroke="#8A5A26" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    // A plane above the clouds
    plane: (
      <>
        <ellipse cx="34" cy="56" rx="14" ry="6" fill="rgba(255,255,255,0.85)" />
        <ellipse cx="46" cy="58" rx="12" ry="5" fill="rgba(255,255,255,0.7)" />
        <ellipse cx="70" cy="60" rx="12" ry="5" fill="rgba(255,255,255,0.6)" />
        <g transform="rotate(-14 50 36)">
          <path d="M22 38c0-3 3-4 8-4h34c5 0 10 2 12 4-2 2-7 4-12 4H30c-5 0-8-1-8-4Z" fill="#fff" />
          <path d="M44 34 36 20h6l14 14Z" fill="#E7262B" />
          <path d="M46 42 40 54h6l12-12Z" fill="#E0E7F1" />
          <path d="M26 34l-4-8h5l7 8Z" fill="#E7262B" />
          {[0, 1, 2, 3, 4].map((k) => (
            <circle key={k} cx={48 + k * 4} cy="37" r="1" fill="#1B5FB4" />
          ))}
        </g>
      </>
    ),
    // A car
    car: (
      <>
        {shadow}
        <path d="M20 54v-8c0-3 2-5 5-6l8-2 7-8c2-2 4-3 7-3h12c3 0 5 1 7 3l7 8 4 1c2 1 3 3 3 5v10Z" fill="#F5F5F5" />
        <path d="M42 30h7v9H35Zm11 0h6c2 0 3 1 4 2l5 7H53Z" fill="#2B2B2B" />
        <circle cx="34" cy="55" r="7" fill="#222" />
        <circle cx="34" cy="55" r="3" fill="#888" />
        <circle cx="68" cy="55" r="7" fill="#222" />
        <circle cx="68" cy="55" r="3" fill="#888" />
        <rect x="74" y="44" width="5" height="3" rx="1.5" fill="#FFD54F" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 100 70" className="absolute bottom-0 h-[78px] w-full" aria-hidden="true">
      {art[kind]}
    </svg>
  );
}
