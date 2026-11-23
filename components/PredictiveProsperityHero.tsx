'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Predictive Prosperity Hero, and the Features section below it
 *
 * Two sections, with the phone travelling from one to the other:
 *   The hero (pinned; each swipe plays one step, start to finish):
 *     1. Together, with the navbar sliding in: "PREDICTIVE PROSPERITY" grows from tiny to filling
 *        the screen behind the horizontal phone, and the phone tilts into a diagonal.
 *     2. The phone slowly sinks down the screen, standing up straight, uncovering the headline.
 *   Between them (one swipe glides the page on): the hero and its headline scroll away up while the
 *   phone is carried on down into the Features section.
 *   The Features section (pinned; each swipe plays one step):
 *     3. "FEATURES" comes up behind the standing phone.
 *     4. The phone drops away; then the feature cards come in and fan out from where it stood, and
 *        the heading becomes "EVERYTHING. CONNECTED."
 *
 * The phone is drawn twice, once in each section: the hero's carries it down, and once the Features
 * section pins, the Features section's own phone takes over in exactly the same place.
 */

const DISPLAY_FONT = "var(--font-bebas), 'Bebas Neue', 'Impact', sans-serif";

// The fan of feature cards, left to right (each one sits on top of the one before)
const FEATURE_CARDS = [
  { title: 'Split & Share', line: 'Split any bill, equally or Dutch.', bg: '#6F6CFF', fg: '#FFFFFF' },
  { title: 'Digital Gold', line: 'Buy, grow and sell 24K gold.', bg: '#D946EF', fg: '#FFFFFF' },
  { title: 'Stock Analysis', line: 'AI insights on 6,000+ stocks.', bg: '#22C3E6', fg: '#0B1220' },
  { title: 'ITR', line: 'File your taxes with Quicko.', bg: '#F7D26A', fg: '#1A1405' },
  { title: 'Bills', line: 'Never miss a due date again.', bg: '#EFEBE1', fg: '#16161A' },
  { title: 'Subscriptions', line: 'See and cut what you don’t use.', bg: '#1C1C22', fg: '#FFFFFF' },
];
const MID = (FEATURE_CARDS.length - 1) / 2;

// How much scroll each swipe stands for (share of the screen). Higher makes the scroll less
// sensitive: it takes more scrolling to move on a step. Phones and tablets (a touch screen, or a
// narrow one) take a lot less, so a short swipe moves a step.
const SCROLL_PER_STEP = 1.2;
const SCROLL_PER_STEP_TOUCH = 0.45;
const isTouchOrNarrow = () => window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches;
const scrollPerStep = () => (isTouchOrNarrow() ? SCROLL_PER_STEP_TOUCH : SCROLL_PER_STEP);
// The gap between "FEATURES" and the standing phone below it on small screens (px)
const FEATURES_GAP = 28;
// How fast the steps play, against the timeline's own timing (below 1 plays them slower)
const PLAY_SPEED = 0.7;
// How the page glides to rest on a step once the visitor stops scrolling
const SETTLE = { delay: 0.1, duration: { min: 0.6, max: 1.2 }, ease: 'power2.inOut' };
// The standing phone: its tilt (the phone image is landscape), and its size
const STANDING = { rotation: 90, scale: 0.72 };
// Where the standing phone sits in the Features section, below the middle (share of the screen)
const PHONE_DOWN = 0.12;

// How far down the screen the hero's phone sinks, below the middle, uncovering the headline
// (share of the screen), and how long it takes (seconds)
const HERO_DOWN = 0.6;
const SINK_SECONDS = 2;

// The phone: phone.png with the logo on its screen. `travelRef` is a wrapper around it, moved
// separately from the phone itself.
function Phone({
  travelRef,
  phoneRef,
  logoRef,
}: {
  travelRef?: React.Ref<HTMLDivElement>;
  phoneRef: React.Ref<HTMLDivElement>;
  logoRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={travelRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div ref={phoneRef} className="relative" style={{ transformOrigin: 'center center', width: 'clamp(340px, 50vw, 660px)' }}>
        <Image
          src="/assets/images/phone.png"
          alt=""
          width={1024}
          height={512}
          className="w-full h-auto object-contain select-none"
          draggable={false}
          priority
        />
        {/* Logo centred on the phone screen (offset slightly up to match the landscape screen) */}
        <div ref={logoRef} className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-3%' }}>
          <Image
            src="/assets/images/main_logo.png"
            alt="BrokeNoMore"
            width={100}
            height={100}
            className="object-contain"
            style={{ width: 'clamp(50px, 8.5vw, 100px)', height: 'auto' }}
            priority
          />
        </div>
      </div>
    </div>
  );
}

// Pins a section while its timeline plays, one step per swipe: each swipe settles the scroll on the
// next step, and the step the scroll is on plays at its own pace (labels s0 … s{steps})
function pinSteps(trigger: HTMLElement, tl: gsap.core.Timeline, steps: number, refreshPriority: number, vars: ScrollTrigger.Vars = {}) {
  let current = 0;
  let playing: gsap.core.Tween | null = null;
  const playTo = (step: number, instant = false) => {
    if (step === current && !instant) return;
    current = step;
    playing?.kill();
    if (instant) {
      tl.seek(`s${step}`);
      return;
    }
    // However far it has to go, it plays at a steady watching pace
    const distance = Math.abs((tl.labels[`s${step}`] ?? 0) - tl.time());
    playing = tl.tweenTo(`s${step}`, { ease: 'none', duration: distance / PLAY_SPEED });
  };
  const st = ScrollTrigger.create({
    trigger,
    start: 'top top',
    end: () => `+=${window.innerHeight * scrollPerStep() * steps}`,
    pin: true,
    anticipatePin: 1,
    refreshPriority,
    invalidateOnRefresh: true,
    // A step starts as soon as the scroll heads its way (not once the page has glided halfway
    // there), so it begins with the scroll itself, and with the navbar sliding in
    onUpdate: (self) => {
      const at = self.progress * steps;
      playTo(self.direction > 0 ? Math.min(steps, Math.ceil(at - 0.02)) : Math.max(0, Math.floor(at + 0.02)));
    },
    snap: { snapTo: 1 / steps, directional: true, inertia: false, ...SETTLE },
    ...vars,
  });
  // Landing part-way through (a reload, a link), it shows that step's finished frame
  playTo(Math.round(st.progress * steps), true);
  return st;
}

// Keeps the page from scrolling on past a pinned section until its last step has finished playing.
// Scrolling down is ignored at the section's end while it plays, and an overshoot (a phone swipe's
// glide, say) is brought back. Scrolling up, and long jumps (a link to a section), are left alone.
function holdUntilFinished(st: ScrollTrigger, tl: gsap.core.Timeline, steps: number) {
  const done = () => tl.time() >= (tl.labels[`s${steps}`] ?? tl.duration()) - 0.01;
  const atEnd = () => window.scrollY >= st.end - 2;
  const block = (e: Event, down: boolean) => {
    if (down && atEnd() && !done() && e.cancelable) e.preventDefault();
  };
  const onWheel = (e: WheelEvent) => block(e, e.deltaY > 0);
  let touchY = 0;
  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0]?.clientY ?? 0;
  };
  const onTouchMove = (e: TouchEvent) => block(e, touchY - (e.touches[0]?.clientY ?? touchY) > 0);
  const onKey = (e: KeyboardEvent) => block(e, !e.shiftKey && [' ', 'PageDown', 'ArrowDown', 'End'].includes(e.key));
  const onScroll = () => {
    const y = window.scrollY;
    if (y > st.end + 1 && y < st.end + window.innerHeight && !done()) window.scrollTo({ top: st.end, behavior: 'instant' });
  };
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
  };
}

export default function PredictiveProsperityHero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const featuresSectionRef = useRef<HTMLElement | null>(null);
  const heroTravelRef = useRef<HTMLDivElement | null>(null);
  const heroPhoneRef = useRef<HTMLDivElement | null>(null);
  const heroLogoRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const connectedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const section = featuresSectionRef.current;
    const heroTravel = heroTravelRef.current;
    const heroPhone = heroPhoneRef.current;
    const heroLogo = heroLogoRef.current;
    const phone = phoneRef.current;
    const logo = logoRef.current;
    const text = textRef.current;
    const features = featuresRef.current;
    const connected = connectedRef.current;
    if (!hero || !section || !heroTravel || !heroPhone || !heroLogo || !phone || !logo || !text || !features || !connected) return;
    const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-feature-card]'));
    const vh = () => window.innerHeight;
    const cardW = () => cards[0]?.offsetWidth ?? 220;
    // The fanned cards: a gentle arch, the middle ones highest, tilting from -20° to +20°. Kept
    // shallow so each card's lower edge stays tucked under the next one.
    const fan = {
      x: (i: number) => (i - MID) * cardW() * 0.36,
      y: (i: number) => vh() * 0.06 + (i - MID) ** 2 * cardW() * 0.022,
      rotation: (i: number) => (i - MID) * 8,
    };

    // Respect reduced-motion: each section shows its finished frame
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(text, { scale: 1, opacity: 1 });
      gsap.set(heroPhone, { rotation: 63.45 });
      gsap.set([phone, features], { autoAlpha: 0 });
      gsap.set(cards, { xPercent: -50, yPercent: -50, ...fan, autoAlpha: 1 });
      gsap.set(connected, { autoAlpha: 1 });
      return;
    }

    // Where the standing phone sits in the Features section, below the middle (px). On small
    // screens it sits just under "FEATURES" instead, so there's no big gap between them.
    const phoneDown = () => {
      const below = vh() * PHONE_DOWN;
      if (!isTouchOrNarrow()) return below;
      const headingBottom = features.offsetTop + features.offsetHeight;
      const halfPhone = (phone.offsetWidth * STANDING.scale) / 2;
      return Math.min(below, headingBottom + FEATURES_GAP + halfPhone - vh() / 2);
    };

    let releaseHold = () => {};
    const ctx = gsap.context(() => {
      // The Features section's own phone starts standing, where the hero's phone will arrive
      gsap.set(phone, { ...STANDING, y: phoneDown, autoAlpha: 0 });
      gsap.set(logo, { rotation: -STANDING.rotation, marginTop: '0%' });
      gsap.set(cards, { xPercent: -50, yPercent: -50, x: 0, y: phoneDown, rotation: 0, scale: 0.55, autoAlpha: 0 });
      gsap.set([features, connected], { autoAlpha: 0 });

      // ---- The hero ----
      const heroTl = gsap.timeline({ paused: true });
      heroTl.addLabel('s0', 0);
      // Step 1, all together (and the navbar slides in with them): the headline grows and the
      // phone tilts
      heroTl.fromTo(text, { scale: 0.18, opacity: 0.08 }, { scale: 1, opacity: 1, duration: 1, ease: 'power2.out' }, 's0');
      heroTl.to(heroPhone, { rotation: 63.45, duration: 1, ease: 'power2.inOut' }, 's0');
      heroTl.addLabel('s1');
      // Step 2: the phone slowly sinks down the screen, standing up straight as it goes, and the
      // headline behind it comes into full view (its logo turning back so it stays upright, and
      // losing its nudge up the landscape screen)
      heroTl.to(heroPhone, { ...STANDING, y: () => vh() * HERO_DOWN, duration: SINK_SECONDS, ease: 'power2.inOut' }, 's1');
      heroTl.to(heroLogo, { rotation: -STANDING.rotation, marginTop: '0%', duration: SINK_SECONDS, ease: 'power2.inOut' }, 's1');
      heroTl.addLabel('s2');
      pinSteps(hero, heroTl, 2, 6);

      // ---- Between the two: the hero scrolls away up, and the phone is carried on down into the
      // Features section. One swipe glides the page the whole way. ----
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top top',
            // Eased behind the scroll, so the phone glides rather than jumps
            scrub: 1.2,
            refreshPriority: 5,
            invalidateOnRefresh: true,
            snap: { snapTo: [0, 1], directional: true, inertia: false, ...SETTLE, duration: { min: 0.9, max: 1.5 } },
          },
        })
        // The hero moves up a whole screen; the phone's wrapper moves it down far enough to land
        // in the Features section, where that section's own phone stands
        .to(heroTravel, { y: () => vh() * (1 - HERO_DOWN) + phoneDown(), ease: 'power1.inOut' }, 0);

      // ---- The Features section ----
      const tl = gsap.timeline({ paused: true });
      tl.addLabel('s0', 0);
      // Step 1: "FEATURES" comes up behind the phone
      tl.fromTo(features, { autoAlpha: 0, y: 60, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, 's0');
      tl.addLabel('s1');
      // Step 2: first the phone drops away and "FEATURES" goes; only then do the cards come in,
      // fanning out from where the phone stood, and the heading becomes "EVERYTHING. CONNECTED."
      tl.fromTo(
        phone,
        { y: phoneDown, autoAlpha: 1 },
        { y: () => vh() * 0.85, autoAlpha: 0, duration: 0.7, ease: 'power2.in', immediateRender: false },
        's1'
      );
      tl.to(features, { autoAlpha: 0, y: -40, duration: 0.4, ease: 'power1.in' }, 's1');
      tl.addLabel('cards', 's1+=0.7');
      tl.to(cards, { autoAlpha: 1, duration: 0.25, ease: 'none', stagger: 0.07 }, 'cards');
      tl.to(cards, { ...fan, scale: 1, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 'cards');
      tl.fromTo(connected, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 'cards+=0.2');
      tl.addLabel('s2');

      // Once the Features section pins, its own phone takes over from the hero's, in the same place
      const handOver = (toFeatures: boolean) => {
        gsap.set(heroPhone, { autoAlpha: toFeatures ? 0 : 1 });
        if (tl.time() === 0) gsap.set(phone, { autoAlpha: toFeatures ? 1 : 0 });
      };
      const featuresPin = pinSteps(section, tl, 2, 5, {
        onEnter: () => handOver(true),
        onLeaveBack: () => handOver(false),
      });
      handOver(window.scrollY >= featuresPin.start - 1);
      // The page only moves on to the offers once the cards have finished fanning out
      releaseHold = holdUntilFinished(featuresPin, tl, 2);

      ScrollTrigger.sort();
    });

    return () => {
      releaseHold();
      ctx.revert();
    };
  }, []);

  return (
    <>
      {/* ── The hero: the headline, and the phone (which travels down into the next section) ── */}
      <section ref={heroRef} className="relative z-20 w-full h-screen bg-black">
        {/* Headline behind the phone */}
        <div
          ref={textRef}
          className="absolute inset-0 z-[1] flex items-center justify-center overflow-hidden pointer-events-none select-none"
          style={{ scale: 0.18, opacity: 0.08 }}
        >
          <h2
            className="text-center font-black uppercase leading-[0.88] tracking-tight"
            style={{
              fontFamily: DISPLAY_FONT,
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
        <div className="absolute inset-0 z-[3]">
          <Phone travelRef={heroTravelRef} phoneRef={heroPhoneRef} logoRef={heroLogoRef} />
        </div>
      </section>

      {/* ── The Features section: "FEATURES" behind the phone, then the fan of cards ─────────── */}
      <section ref={featuresSectionRef} className="relative z-10 w-full h-screen bg-black overflow-hidden" aria-label="Features">
        {/* "FEATURES", behind the standing phone */}
        <div
          ref={featuresRef}
          className="invisible absolute inset-x-0 top-[10vh] z-[1] flex justify-center pointer-events-none select-none"
        >
          <h2
            className="uppercase whitespace-nowrap"
            style={{ fontFamily: DISPLAY_FONT, fontSize: 'clamp(4.5rem, 17vw, 15rem)', color: '#5B5CFF', lineHeight: 0.9, letterSpacing: '0.04em' }}
          >
            Features
          </h2>
        </div>

        {/* "EVERYTHING. CONNECTED.", above the fan of cards */}
        <div
          ref={connectedRef}
          className="invisible absolute inset-x-0 top-[calc(96px+5vh)] z-[1] flex justify-center pointer-events-none select-none"
        >
          <h2
            className="uppercase whitespace-nowrap"
            style={{ fontFamily: DISPLAY_FONT, fontSize: 'clamp(2rem, 5vw, 4rem)', color: '#7B7BFF', letterSpacing: '0.04em' }}
          >
            Everything. Connected.
          </h2>
        </div>

        {/* The feature cards, hidden until the phone has gone */}
        <ul className="absolute inset-0 z-[2] pointer-events-none select-none">
          {FEATURE_CARDS.map((card, i) => (
            <li
              key={card.title}
              data-feature-card
              className="invisible absolute left-1/2 top-1/2 overflow-hidden rounded-[16px]"
              style={{
                // Landscape, like a bank card
                width: 'clamp(96px, 27vw, 390px)',
                height: 'clamp(64px, 18vw, 260px)',
                padding: 'clamp(9px, 1.6vw, 24px)',
                background: card.bg,
                color: card.fg,
                boxShadow: '0 24px 50px -18px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.08)',
                zIndex: i,
              }}
            >
              <span className="block font-semibold opacity-60" style={{ fontSize: 'clamp(7px, 0.85vw, 12px)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                className="mt-[7%] uppercase whitespace-nowrap"
                style={{ fontFamily: DISPLAY_FONT, fontSize: 'clamp(1rem, 3.1vw, 2.9rem)', lineHeight: 1 }}
              >
                {card.title}
              </p>
              <p className="mt-1 max-w-[80%] leading-snug opacity-75" style={{ fontSize: 'clamp(6px, 0.95vw, 14px)' }}>
                {card.line}
              </p>
            </li>
          ))}
        </ul>

        {/* The Features section's own phone, which takes over from the hero's once this section pins */}
        <div className="absolute inset-0 z-[3]">
          <Phone phoneRef={phoneRef} logoRef={logoRef} />
        </div>
      </section>
    </>
  );
}
