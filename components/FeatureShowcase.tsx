'use client';

import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Phone3D from './Phone3D';
import FeatureOrbit from './FeatureOrbit';
import { BROKENOMORE_FEATURES } from './featureScreens';
import SplitStoryLayer, { SplitStoryCaptions } from './splitStory/SplitStoryLayer';
import { CAPTIONS } from './splitStory/splitData';
import { createSplitStoryRuntime } from './splitStory/timeline';
// The stock and gold phone chapters are switched off for now (SafeGold has its own section).
// import { type PhoneScreenController } from './splitStory/timeline';
// import StockStoryLayer, { StockStoryCaptions } from './stockStory/StockStoryLayer';
// import { STOCK_CAPTIONS } from './stockStory/stockData';
// import { createStockStoryRuntime } from './stockStory/timeline';
// import GoldStoryLayer, { GoldStoryCaptions } from './goldStory/GoldStoryLayer';
// import { GOLD_CAPTIONS } from './goldStory/goldData';
// import { createGoldStoryRuntime } from './goldStory/timeline';
import { buildJourney, createPlayhead, SCROLL_PER_UNIT } from './journey';

gsap.registerPlugin(ScrollTrigger);

// Height (px) the phone and orbit cards need at full size; shorter screens scale them down.
const STAGE_DESIGN_HEIGHT = 635;

// Once the journey is this far in (timeline units), the slideshow's cards have faded out.
const ORBIT_HIDDEN_AFTER = 1.1;

// The phone with its feature cards orbiting it ('orbit'), the phone on its own playing the split
// story as the page scrolls ('split'), or both in one section: the orbit first, then scrolling
// plays the split story inside the phone ('features').
export default function FeatureShowcase({ part = 'features' }: { part?: 'orbit' | 'split' | 'features' }) {
  const hasOrbit = part !== 'split';
  const hasStory = part !== 'orbit';
  const storyOnly = part === 'split';
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(storyOnly ? 'split' : BROKENOMORE_FEATURES[0].id);
  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(false);
  const [startPhoneIntro, setStartPhoneIntro] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const scrollMotionRef = useRef({ rotY: 0, face: 0 });
  const [storyRuntime] = useState(createSplitStoryRuntime);
  //   const [stockRuntime] = useState(createStockStoryRuntime);
  //   const [goldRuntime] = useState(createGoldStoryRuntime);
  //   // The phone's screen belongs to whichever story has taken it over most recently
  //   const [journeyScreen] = useState<PhoneScreenController>(() => ({
  //     get active() {
  //       return storyRuntime.screen.active || stockRuntime.screen.active || goldRuntime.screen.active;
  //     },
  //     set active(value: boolean) {
  //       storyRuntime.screen.active = value;
  //       stockRuntime.screen.active = value;
  //       goldRuntime.screen.active = value;
  //     },
  //     get dirty() {
  //       return storyRuntime.screen.dirty || stockRuntime.screen.dirty || goldRuntime.screen.dirty;
  //     },
  //     set dirty(value: boolean) {
  //       storyRuntime.screen.dirty = value;
  //       stockRuntime.screen.dirty = value;
  //       goldRuntime.screen.dirty = value;
  //     },
  //     draw: (ctx, width, height) => {
  //       if (goldRuntime.screen.active) return goldRuntime.screen.draw(ctx, width, height);
  //       if (stockRuntime.screen.active) return stockRuntime.screen.draw(ctx, width, height);
  //       return storyRuntime.screen.draw(ctx, width, height);
  //     },
  //   }));
  const [journeyScreen] = useState(() => storyRuntime.screen);
  const screenOverrideRef = useRef(journeyScreen);
  const orbitRenderPausedRef = useRef<boolean>(false);
  // The orbiting cards stop redrawing when the section is off screen, or once the story has
  // faded them out
  const orbitHiddenRef = useRef({ offscreen: false, byStory: false });
  const pinRef = useRef<ScrollTrigger | null>(null);
  const journeyStartedRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // Load sequence: the title's words rise into place one by one, then the buttons appear.
  // Also builds the journey that scrolling plays once the showcase is reached.
  useLayoutEffect(() => {
    const scrollMotion = scrollMotionRef.current;
    const mm = gsap.matchMedia();
    const previousRestoration = history.scrollRestoration;

    // The section is exactly one screen tall, so shrink its contents to fit shorter or narrower screens.
    const fitStage = () => {
      const stage = stageRef.current;
      if (stage) {
        const stageH = stage.offsetHeight || STAGE_DESIGN_HEIGHT;
        const heightScale = Math.min(1, Math.max(0.72, stageH / STAGE_DESIGN_HEIGHT));
        const availW = Math.max(300, window.innerWidth - 32);
        const targetW = window.innerWidth < 640 ? 440 : 760;
        const widthScale = Math.min(1, Math.max(0.72, availW / targetW));
        const scale = Math.min(heightScale, widthScale);
        gsap.set(stage, { scale });
      }
    };
    mm.add('(min-width: 1px)', () => {
      fitStage();
      window.addEventListener('resize', fitStage);
      return () => window.removeEventListener('resize', fitStage);
    });

    // ---- The orbit part: the hero's entrance, and the phone flying in below it ----
    const title = document.querySelector<HTMLElement>('[data-hero-title]');
    const actions = document.querySelector<HTMLElement>('[data-hero-actions]');
    if (hasOrbit && title && actions) {
      const btnAndroid = actions.querySelector<HTMLElement>('[data-hero-btn-android]');
      const btnIos = actions.querySelector<HTMLElement>('[data-hero-btn-ios]');
      const sub = document.querySelector<HTMLElement>('[data-hero-sub]');

      history.scrollRestoration = 'manual';
      window.scrollTo({ top: 0, behavior: 'instant' });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([title, actions, sub], { autoAlpha: 1 });
        if (btnAndroid) gsap.set(btnAndroid, { autoAlpha: 1, y: 0, scale: 1 });
        if (btnIos) gsap.set(btnIos, { autoAlpha: 1, y: 0, scale: 1 });
        setStartPhoneIntro(true);
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 72px',
          onEnter: () => gsap.set('[data-bg-fade]', { opacity: 1 }),
          onLeaveBack: () => gsap.set('[data-bg-fade]', { opacity: 0 }),
        });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const words = title.querySelectorAll<HTMLElement>('[data-hero-word]');
        const panel = document.querySelector<HTMLElement>('[data-hero-panel]');

        gsap.set(title, { autoAlpha: 1 });
        gsap.set(words, { yPercent: 115, rotate: 4, transformOrigin: '0% 100%' });
        gsap.set(actions, { autoAlpha: 1, y: 0 });
        if (sub) gsap.set(sub, { y: 14, autoAlpha: 0 });
        if (btnAndroid) gsap.set(btnAndroid, { y: 18, autoAlpha: 0, force3D: true });
        if (btnIos) gsap.set(btnIos, { y: 18, autoAlpha: 0, force3D: true });

        // Flow: 1. Text appears -> 2. Android button glides in -> 3. iOS button glides in (silky smooth)
        const tl = gsap.timeline({ delay: 0.2 });

        tl.to(words, {
          yPercent: 0,
          rotate: 0,
          duration: 0.95,
          ease: 'power4.out',
          stagger: 0.08,
        });

        // The subtext fades up as the last words land
        if (sub) tl.to(sub, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, '-=0.45');

        if (btnAndroid) {
          tl.to(
            btnAndroid,
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: 'expo.out',
              force3D: true,
              onComplete: () => {
                gsap.set(btnAndroid, { clearProps: 'transform' });
              },
            },
            '-=0.15'
          );
        }

        if (btnIos) {
          tl.to(
            btnIos,
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.9,
              ease: 'expo.out',
              force3D: true,
              onComplete: () => {
                gsap.set(btnIos, { clearProps: 'transform' });
              },
            },
            '-=0.72'
          );
        }

        // Scrolling away lifts and fades the first page out as the showcase arrives
        gsap.to(panel, {
          y: -120,
          scale: 0.96,
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'top 35%',
            scrub: 0.6,
          },
        });

        // The reactive background melts into plain black as the showcase arrives
        const scanner = document.querySelector<HTMLElement>('[data-bg-scanner]');
        gsap.fromTo(
          '[data-bg-fade]',
          { opacity: 0 },
          {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'top 35%',
              scrub: 0.6,
              onUpdate: (self) => {
                if (scanner) scanner.style.visibility = self.progress === 1 ? 'hidden' : '';
              },
            },
          }
        );

        // The phone's flight is timed, not scrubbed, so hold it until the phone's spot is coming on
        // screen.
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 60%',
          once: true,
          onEnter: () => setStartPhoneIntro(true),
          onRefresh: (self) => {
            if (self.progress > 0) setStartPhoneIntro(true);
          },
        });
      });

      // Desktop: between the first page and the showcase, any scroll amount carries through: once
      // the user stops, the page glides on in the direction they were going. Even a small nudge
      // brings the showcase up in time to see the phone's complete flight in.
      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
        ScrollTrigger.create({
          start: 0,
          endTrigger: sectionRef.current,
          end: 'top 72px',
          invalidateOnRefresh: true,
          snap: {
            snapTo: 1,
            directional: true,
            inertia: false,
            delay: 0.08,
            duration: { min: 0.5, max: 0.9 },
            ease: 'power2.inOut',
          },
        });
      });

      // The orbiting cards stop redrawing while the section is off screen
      mm.add('(min-width: 1px)', () => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            orbitHiddenRef.current.offscreen = !self.isActive;
            orbitRenderPausedRef.current = orbitHiddenRef.current.offscreen || orbitHiddenRef.current.byStory;
          },
        });
      });
    }

    // ---- The split part: pinned, scrolling plays the split story, and stops or reverses with
    // the user ----
    if (hasStory) mm.add('(prefers-reduced-motion: no-preference)', () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const header = headerRef.current;
      const phone = phoneRef.current;
      if (!section || !stage || !header || !phone) return;

      let context: gsap.Context | null = null;
      let playhead: ReturnType<typeof createPlayhead> | null = null;

      const build = () => {
        // Removing the pin shortens the page, so remember the user's place first
        const place = pinRef.current?.progress ?? 0;
        const wasPinned = !!pinRef.current && window.scrollY >= pinRef.current.start;
        playhead?.kill();
        context?.revert();
        fitStage(); // only now is the section free of the pin's frozen height
        Object.assign(scrollMotion, { rotY: 0, face: 0 });
        context = gsap.context(() => {
          const journey = buildJourney({ stage, section, header, phone, motion: scrollMotion, splitRuntime: storyRuntime });
          const onUpdate = () => {
            const time = journey.timeline.time();
            journeyStartedRef.current = time > 0.01;
            orbitHiddenRef.current.byStory = time > ORBIT_HIDDEN_AFTER;
            orbitRenderPausedRef.current = orbitHiddenRef.current.offscreen || orbitHiddenRef.current.byStory;
            journey.update();
          };
          journey.timeline.eventCallback('onUpdate', onUpdate);
          onUpdate();
          playhead = createPlayhead(journey.timeline);
          pinRef.current = ScrollTrigger.create({
            trigger: section,
            start: 'top 72px',
            end: `+=${journey.timeline.duration() * SCROLL_PER_UNIT}`,
            pin: true,
            // Highest on the page of the pinned sections, so it is measured first
            refreshPriority: 4,
            onUpdate: (self) => playhead?.follow(self.progress),
          });
          // (The split story is now the last section on the page, so nothing follows it to snap to.)
          // // Once the story's last frame is up, any scroll on carries the page down to the credit
          // // cards, and any scroll back up returns to that last frame
          // const creditCards = document.querySelector<HTMLElement>('[data-credit-cards]');
          // if (creditCards) {
          //   ScrollTrigger.create({
          //     start: () => pinRef.current?.end ?? 0,
          //     endTrigger: creditCards,
          //     end: 'top 72px',
          //     snap: {
          //       snapTo: 1,
          //       directional: true,
          //       inertia: false,
          //       delay: 0.08,
          //       duration: { min: 0.5, max: 0.9 },
          //       ease: 'power2.inOut',
          //     },
          //   });
          // }
        });
        ScrollTrigger.refresh();
        const pin = pinRef.current;
        if (pin && wasPinned) {
          window.scrollTo({ top: pin.start + (pin.end - pin.start) * place, behavior: 'instant' });
          playhead?.jump(place);
        }
      };
      build();

      // The pin keeps the section at its old height, so a real resize has to recreate it.
      // Ignores the small height changes from a phone's address bar showing and hiding.
      let lastWidth = window.innerWidth;
      let lastHeight = window.innerHeight;
      let resizeTimer: ReturnType<typeof setTimeout> | undefined;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 120) return;
          lastWidth = window.innerWidth;
          lastHeight = window.innerHeight;
          build();
        }, 250);
      };
      window.addEventListener('resize', onResize);

      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        playhead?.kill();
        context?.revert();
        pinRef.current = null;
        journeyScreen.active = false;
        journeyStartedRef.current = false;
      };
    });

    return () => {
      mm.revert();
      Object.assign(scrollMotion, { rotY: 0, face: 0 });
      if (hasOrbit) history.scrollRestoration = previousRestoration;
      const scanner = document.querySelector<HTMLElement>('[data-bg-scanner]');
      if (scanner) scanner.style.visibility = '';
    };
  }, [storyRuntime, journeyScreen, hasOrbit, hasStory]);

  // The slideshow: steps through the features every 3 seconds, until the journey takes over
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (journeyStartedRef.current || storyOnly) return;
      setSelectedFeatureId((current) => {
        const currentIndex = BROKENOMORE_FEATURES.findIndex((f) => f.id === current);
        const nextIndex =
          (currentIndex - 1 + BROKENOMORE_FEATURES.length) % BROKENOMORE_FEATURES.length;
        return BROKENOMORE_FEATURES[nextIndex].id;
      });
    }, 3000);
  }, [storyOnly]);

  // When intro animation finishes and feature blocks appear, start 3s timer immediately
  const handleIntroComplete = useCallback(() => {
    setIsIntroComplete(true);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectedFeature =
    BROKENOMORE_FEATURES.find((f) => f.id === selectedFeatureId) || BROKENOMORE_FEATURES[0];

  return (
    <>
    <section ref={sectionRef} data-showcase={part} id={storyOnly ? undefined : 'features'} className="scroll-mt-[72px] relative w-full min-h-[580px] sm:min-h-[640px] h-[calc(100svh-72px)] flex flex-col items-center justify-start overflow-hidden pt-16 xs:pt-20 sm:pt-6 md:pt-4 pb-4 sm:pb-8 px-4 sm:px-6 select-none" suppressHydrationWarning>
      {/* Dynamic Feature Header matching main title typography */}
      <div ref={headerRef} className="relative z-30 w-full">
      {/* In the split part it is invisible but still takes up its space, so the phone sits below
          the story's captions exactly as it does under this heading */}
      <motion.div
        aria-hidden={storyOnly || undefined}
        initial={false}
        animate={isIntroComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-30 flex flex-col items-center text-center max-w-2xl mx-auto mb-2 sm:mb-4 ${storyOnly ? 'invisible pointer-events-none' : 'pointer-events-auto'}`}
      >
        <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-semibold text-white text-center tracking-tight leading-[1.2] drop-shadow-sm mt-1 transition-all duration-300">
          {selectedFeature.name}
        </h2>

        <p className="text-xs xs:text-sm sm:text-base text-neutral-400 text-center tracking-tight max-w-lg mt-1.5 sm:mt-2 transition-all duration-300 px-2">
          {selectedFeature.tagline}
        </p>
      </motion.div>
      </div>

      {hasStory && <SplitStoryCaptions />}
      {/* <StockStoryCaptions /> */}
      {/* <GoldStoryCaptions /> */}

      {/* Main 3D Stage: Smartphone Centered + Revolving Feature Orbit */}
      <div ref={stageRef} className="relative w-full max-w-7xl flex-1 min-h-0 flex items-center justify-center">
        {/* The slideshow of feature cards orbiting the phone */}
        {hasOrbit && (
          <FeatureOrbit
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={setSelectedFeatureId}
            isOrbitPaused={true}
            isIntroComplete={isIntroComplete}
            renderPausedRef={orbitRenderPausedRef}
          />
        )}

        {/* Billing machine, bill and everything else the phone moves among in the split story */}
        {hasStory && <SplitStoryLayer runtime={storyRuntime} />}

        {/* Tickers, fundamentals, answers and the report around the phone in the stock story */}
        {/* <StockStoryLayer runtime={stockRuntime} /> */}

        {/* The vault bar, the gold poured into it, and the coin shipped out of it in the gold story */}
        {/* <GoldStoryLayer runtime={goldRuntime} /> */}

        {/* Central Floating Smartphone (z-index 20) */}
        <div
          ref={phoneRef}
          className="relative z-[20] w-[260px] xs:w-[300px] sm:w-[360px] md:w-[420px] lg:w-[460px] h-[430px] xs:h-[490px] sm:h-[580px] lg:h-[650px] flex items-center justify-center pointer-events-auto"
          style={{ zIndex: 20 }}
          title={storyOnly ? undefined : 'Click to advance to next feature'}
          onPointerDown={(e) => {
            pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={(e) => {
            if (storyOnly) return;
            // Prevent accidental feature changes when scrolling over the phone on touch devices
            if (pointerDownPosRef.current) {
              const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
              const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
              if (dx > 8 || dy > 8) {
                return;
              }
            }
            setSelectedFeatureId((current) => {
              const currentIndex = BROKENOMORE_FEATURES.findIndex((f) => f.id === current);
              const nextIndex =
                (currentIndex - 1 + BROKENOMORE_FEATURES.length) % BROKENOMORE_FEATURES.length;
              return BROKENOMORE_FEATURES[nextIndex].id;
            });
          }}
        >
          <Phone3D
            selectedFeatureId={selectedFeatureId}
            className="w-full h-full"
            playIntro={!storyOnly}
            startIntro={storyOnly || startPhoneIntro}
            scrollMotionRef={scrollMotionRef}
            screenOverrideRef={screenOverrideRef}
            onIntroComplete={handleIntroComplete}
          />

          {/* Subtle phone shadow reflection on floor */}
          <motion.div
            initial={false}
            animate={isIntroComplete || storyOnly ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-8 -rotate-6 bg-black/40 rounded-full blur-xl pointer-events-none"
          />
        </div>
      </div>
    </section>

    {/* Without motion, the story's steps are simply listed */}
    {hasStory && <ol className="hidden motion-reduce:grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto mt-16 px-4">
      {[...CAPTIONS /* , ...STOCK_CAPTIONS, ...GOLD_CAPTIONS */].map((caption) => (
        <li key={caption.title}>
          <h3 className="text-xl font-semibold text-white tracking-tight">{caption.title}</h3>
          <p className="text-sm text-neutral-400 tracking-tight mt-1">{caption.body}</p>
        </li>
      ))}
    </ol>}
    </>
  );
}
