'use client';

import React from 'react';
import { FeatureScreenDef } from './featureScreens';

interface FeatureCardProps {
  feature: FeatureScreenDef;
  isActive: boolean;
}

export default function FeatureCard({ feature, isActive }: FeatureCardProps) {
  return (
    <div
      className={`relative flex flex-col items-start gap-2 sm:gap-3 px-3 py-2.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl select-none transition-colors duration-300 w-[136px] sm:w-[200px] md:w-[230px] lg:w-[260px] ${
        isActive
          ? 'bg-neutral-900/95 border border-white/35 shadow-[0_12px_35px_rgba(0,0,0,0.8)] ring-1 ring-white/20'
          : 'bg-[#121218]/90 border border-white/10 hover:border-white/20'
      } backdrop-blur-xl`}
    >
      <div className="w-full">
        <h4 className="text-[13px] sm:text-[15px] md:text-[17px] font-semibold text-white tracking-tight leading-tight transition-colors">
          {feature.name}
        </h4>
        <p className="text-[10.5px] sm:text-xs md:text-[13px] text-neutral-400 font-normal leading-snug tracking-tight mt-0.5 sm:mt-1 line-clamp-2">
          {feature.tagline}
        </p>
      </div>
    </div>
  );
}
