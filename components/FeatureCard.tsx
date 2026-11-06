'use client';

import React from 'react';
import { FeatureScreenDef } from './featureScreens';

interface FeatureCardProps {
  feature: FeatureScreenDef;
  isActive: boolean;
  scale: number;
  opacity: number;
  zIndex: number;
  isFront: boolean;
}

export default function FeatureCard({ feature, isActive, scale, opacity, zIndex, isFront }: FeatureCardProps) {
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity: Math.max(0.25, opacity),
        zIndex: zIndex,
        filter: isFront ? 'none' : 'blur(0.8px)',
      }}
      className={`relative flex flex-col items-start gap-3 p-4 sm:p-5 rounded-2xl select-none transition-all duration-300 w-[230px] sm:w-[260px] ${
        isActive
          ? 'bg-neutral-900/95 border border-white/30 shadow-[0_12px_35px_rgba(0,0,0,0.7)]'
          : 'bg-[#121218]/85 border border-white/10'
      } backdrop-blur-xl`}
    >
      <div className="w-full">
        <h4 className="text-[15px] sm:text-[17px] font-semibold text-white tracking-tight transition-colors">
          {feature.name}
        </h4>
        <p className="text-xs sm:text-[13px] text-neutral-400 font-normal leading-snug tracking-tight mt-1 line-clamp-2">
          {feature.tagline}
        </p>
      </div>
    </div>
  );
}
