'use client';

import React from 'react';
import { FeatureScreenDef } from './featureScreens';

interface FeatureCardProps {
  feature: FeatureScreenDef;
  isActive: boolean;
  scale: number;
  opacity: number;
  zIndex: number;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isFront: boolean;
}

export default function FeatureCard({
  feature,
  isActive,
  scale,
  opacity,
  zIndex,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isFront,
}: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        transform: `scale(${scale})`,
        opacity: Math.max(0.25, opacity),
        zIndex: zIndex,
        filter: isFront ? 'none' : 'blur(0.8px)',
      }}
      className={`group relative flex flex-col items-start gap-3 p-4 sm:p-5 rounded-2xl cursor-pointer select-none transition-all duration-300 w-[230px] sm:w-[260px] ${
        isActive
          ? 'bg-neutral-900/95 border border-white/30 shadow-[0_12px_35px_rgba(0,0,0,0.7)]'
          : 'bg-[#121218]/85 border border-white/10 hover:border-white/20 hover:bg-[#181824]/95 hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]'
      } backdrop-blur-xl`}
    >
      {/* Feature Title & Description */}
      <div className="w-full">
        <h4 className="text-[15px] sm:text-[17px] font-semibold text-white tracking-tight transition-colors">
          {feature.name}
        </h4>
        <p className="text-xs sm:text-[13px] text-neutral-400 font-normal leading-snug tracking-tight mt-1 line-clamp-2">
          {feature.tagline}
        </p>
      </div>

      {/* Interactive hover hint */}
      <div className="w-full pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-medium text-neutral-400 opacity-80 group-hover:opacity-100 transition-opacity">
        <span>{isActive ? 'Active Feature' : 'Click to preview →'}</span>
      </div>
    </div>
  );
}
