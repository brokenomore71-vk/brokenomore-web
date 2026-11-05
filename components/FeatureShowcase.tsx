'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Phone3D from './Phone3D';
import FeatureOrbit from './FeatureOrbit';
import { BROKENOMORE_FEATURES } from './featureScreens';

export default function FeatureShowcase() {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(BROKENOMORE_FEATURES[0].id);
  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate: steps through features every 3 seconds
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isDraggingRef.current) return;
      setSelectedFeatureId((current) => {
        const currentIndex = BROKENOMORE_FEATURES.findIndex((f) => f.id === current);
        const nextIndex =
          (currentIndex - 1 + BROKENOMORE_FEATURES.length) % BROKENOMORE_FEATURES.length;
        return BROKENOMORE_FEATURES[nextIndex].id;
      });
    }, 3000);
  }, []);

  // When intro animation finishes and feature blocks appear, start 3s timer immediately
  const handleIntroComplete = useCallback(() => {
    setIsIntroComplete(true);
    startTimer();
  }, [startTimer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSelectFeature = useCallback((id: string) => {
    setSelectedFeatureId(id);
    startTimer();
  }, [startTimer]);

  const handleDragChange = useCallback((isDragging: boolean) => {
    isDraggingRef.current = isDragging;
    if (!isDragging) {
      startTimer();
    }
  }, [startTimer]);

  const selectedFeature =
    BROKENOMORE_FEATURES.find((f) => f.id === selectedFeatureId) || BROKENOMORE_FEATURES[0];

  return (
    <section className="relative w-full min-h-[760px] lg:min-h-[820px] flex flex-col items-center justify-start overflow-hidden py-6 sm:py-8 px-4 sm:px-6 select-none">
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
      <div className="relative w-full max-w-7xl h-[620px] sm:h-[680px] lg:h-[720px] flex items-center justify-center my-auto">
        {/* Orbiting Feature Cards (smooth scroll & drag responsive) */}
        <FeatureOrbit
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={handleSelectFeature}
          onDragChange={handleDragChange}
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
            startTimer();
          }}
        >
          <Phone3D
            selectedFeatureId={selectedFeatureId}
            className="w-full h-full"
            playIntro={true}
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
