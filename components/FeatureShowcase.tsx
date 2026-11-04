'use client';

import React, { useState } from 'react';
import Phone3D from './Phone3D';
import FeatureOrbit from './FeatureOrbit';
import { BROKENOMORE_FEATURES } from './featureScreens';

export default function FeatureShowcase() {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const selectedFeature = selectedFeatureId
    ? BROKENOMORE_FEATURES.find((f) => f.id === selectedFeatureId) || null
    : null;

  return (
    <section className="relative w-full min-h-[760px] lg:min-h-[820px] flex flex-col items-center justify-start overflow-hidden py-6 sm:py-8 px-4 sm:px-6 select-none">
      {/* Dynamic Feature Header matching main title typography */}
      <div className="relative z-30 flex flex-col items-center text-center max-w-2xl mx-auto mb-2 sm:mb-4 pointer-events-auto">
        <h2 className="text-3xl sm:text-5xl font-semibold text-white text-center tracking-tight leading-[1.2] drop-shadow-sm mt-1 transition-all duration-300">
          {selectedFeature ? selectedFeature.name : 'Wealth Operating System'}
        </h2>

        <p className="text-sm sm:text-base text-neutral-400 text-center tracking-tight max-w-lg mt-2 transition-all duration-300">
          {selectedFeature
            ? selectedFeature.tagline
            : 'Click any feature floating around the phone to preview its screen.'}
        </p>
      </div>

      {/* Main 3D Stage: Smartphone Centered + Revolving Feature Orbit */}
      <div className="relative w-full max-w-7xl h-[620px] sm:h-[680px] lg:h-[720px] flex items-center justify-center my-auto">
        {/* Orbiting Feature Cards (smooth scroll & drag responsive) */}
        <FeatureOrbit
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={(id) => setSelectedFeatureId(id)}
          isOrbitPaused={true}
        />

        {/* Central Floating Smartphone (z-index 20) */}
        <div
          className="relative z-[20] w-[320px] sm:w-[380px] md:w-[420px] lg:w-[460px] h-[520px] sm:h-[600px] lg:h-[650px] flex items-center justify-center pointer-events-auto"
          style={{ zIndex: 20 }}
          title={selectedFeatureId ? 'Click phone to return to BrokeNoMore logo' : undefined}
          onClick={() => {
            if (selectedFeatureId) setSelectedFeatureId(null);
          }}
        >
          <Phone3D
            selectedFeatureId={selectedFeatureId}
            className="w-full h-full"
          />

          {/* Subtle phone shadow reflection on floor */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-8 -rotate-6 bg-black/40 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
