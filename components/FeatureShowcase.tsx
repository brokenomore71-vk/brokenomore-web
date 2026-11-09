'use client';

import React, { useState, useCallback, useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Phone3D from './Phone3D';
import FeatureOrbit from './FeatureOrbit';
import { BROKENOMORE_FEATURES } from './featureScreens';

gsap.registerPlugin(ScrollTrigger);

// Height (px) the phone and orbit cards need at full size; shorter screens scale them down.
const STAGE_DESIGN_HEIGHT = 635;

export default function FeatureShowcase() {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(BROKENOMORE_FEATURES[0].id);
  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(false);
  const [startPhoneIntro, setStartPhoneIntro] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scrollMotionRef = useRef({ rotY: 0 });

  // Load sequence: the title's words rise into place one by one, then the buttons appear.
  // Also drives the phone from scroll once the showcase is reached.
  useLayoutEffect(() => {
    const title = document.querySelector<HTMLElement>('[data-hero-title]');
    const actions = document.querySelector<HTMLElement>('[data-hero-actions]');
    if (!title || !actions) return;

    const btnAndroid = actions.querySelector<HTMLElement>('[data-hero-btn-android]');
    const btnIos = actions.querySelector<HTMLElement>('[data-hero-btn-ios]');

    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, behavior: 'instant' });

    const scrollMotion = scrollMotionRef.current;
    const mm = gsap.matchMedia();

    // Desktop: the section is exactly one screen tall, so shrink its contents to fit shorter screens.
    mm.add('(min-width: 768px)', () => {
      const fitStage = () => {
        const stage = stageRef.current;
        if (stage) gsap.set(stage, { scale: Math.min(1, stage.offsetHeight / STAGE_DESIGN_HEIGHT) });
      };
      fitStage();
      window.addEventListener('resize', fitStage);
      return () => window.removeEventListener('resize', fitStage);
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set([title, actions], { autoAlpha: 1 });
      if (btnAndroid) gsap.set(btnAndroid, { autoAlpha: 1, y: 0, scale: 1 });
      if (btnIos) gsap.set(btnIos, { autoAlpha: 1, y: 0, scale: 1 });
      setStartPhoneIntro(true);
    });

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const words = title.querySelectorAll<HTMLElement>('[data-hero-word]');
      const panel = document.querySelector<HTMLElement>('[data-hero-panel]');

      gsap.set(title, { autoAlpha: 1 });
      gsap.set(words, { yPercent: 115, rotate: 4, transformOrigin: '0% 100%' });
      gsap.set(actions, { autoAlpha: 1, y: 0 });
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

      // The phone's flight is timed, not scrubbed, so hold it until the phone's spot is coming on
      // screen. It starts together with the turn below, so the turn is actually seen.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 60%',
        once: true,
        onEnter: () => setStartPhoneIntro(true),
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

    // The phone turns only while the section scrolls into view, and lands facing front
    // once the section is fully visible. The page itself is never held back.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.to(scrollMotion, {
        rotY: Math.PI * 2,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          end: 'top 72px',
          scrub: 0.6,
        },
      });
    });

    return () => {
      mm.revert();
      scrollMotion.rotY = 0;
      history.scrollRestoration = previousRestoration;
    };
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIsIntroComplete(true);
  }, []);

  const selectedFeature =
    BROKENOMORE_FEATURES.find((f) => f.id === selectedFeatureId) || BROKENOMORE_FEATURES[0];

  return (
    <section ref={sectionRef} className="relative w-full max-md:min-h-[760px] md:h-[calc(100svh-72px)] flex flex-col items-center justify-start overflow-hidden py-6 sm:py-8 md:pt-4 md:pb-2 px-4 sm:px-6 select-none">
      {/* Dynamic Feature Header matching main title typography */}
      <motion.div
        initial={false}
        animate={isIntroComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 flex flex-col items-center text-center max-w-2xl mx-auto mb-2 sm:mb-4 pointer-events-auto"
      >
        <h2 className="text-3xl sm:text-5xl font-semibold text-white text-center tracking-tight leading-[1.2] drop-shadow-sm mt-1 transition-all duration-300">
          {selectedFeature.name}
        </h2>

        <p className="text-sm sm:text-base text-neutral-400 text-center tracking-tight max-w-lg mt-2 transition-all duration-300">
          {selectedFeature.tagline}
        </p>
      </motion.div>

      {/* Main 3D Stage: Smartphone Centered + Revolving Feature Orbit */}
      <div ref={stageRef} className="relative w-full max-w-7xl max-sm:h-[620px] sm:max-md:h-[680px] md:flex-1 md:min-h-0 flex items-center justify-center my-auto">
        {/* Orbiting Feature Cards (smooth scroll & drag responsive) */}
        <FeatureOrbit
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={setSelectedFeatureId}
          isOrbitPaused={true}
          isIntroComplete={isIntroComplete}
        />

        {/* Central Floating Smartphone (z-index 20) */}
        <div
          className="relative z-[20] w-[320px] sm:w-[380px] md:w-[420px] lg:w-[460px] h-[520px] sm:h-[600px] lg:h-[650px] flex items-center justify-center pointer-events-auto cursor-pointer"
          style={{ zIndex: 20 }}
          title="Click to advance to next feature"
          onClick={() => {
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
            playIntro={true}
            startIntro={startPhoneIntro}
            scrollMotionRef={scrollMotionRef}
            onIntroComplete={handleIntroComplete}
          />

          {/* Subtle phone shadow reflection on floor */}
          <motion.div
            initial={false}
            animate={isIntroComplete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-8 -rotate-6 bg-black/40 rounded-full blur-xl pointer-events-none"
          />
        </div>
      </div>
    </section>
  );
}
