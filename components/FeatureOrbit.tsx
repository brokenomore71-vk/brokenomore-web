'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import FeatureCard from './FeatureCard';
import { BROKENOMORE_FEATURES } from './featureScreens';

// Orbit size per viewport width. On phones it keeps the desktop's wide, flat shape: the back
// cards peek out from behind the phone, the side cards sit beside it, the front card crosses it.
function getOrbitRadii(viewportWidth: number) {
  if (viewportWidth < 640) return { rx: 140, rz: 85, ryTilt: 100 };
  if (viewportWidth < 1024) return { rx: 340, rz: 180, ryTilt: 180 };
  if (viewportWidth < 1440) return { rx: 480, rz: 230, ryTilt: 200 };
  return { rx: 530, rz: 250, ryTilt: 220 };
}

// Card widths, matching FeatureCard's sm / md / lg classes
function getCardWidth(viewportWidth: number) {
  if (viewportWidth < 640) return 136;
  if (viewportWidth < 768) return 200;
  if (viewportWidth < 1024) return 230;
  return 260;
}

/** Width (unscaled px) the orbit and its side cards cover, so the stage can shrink to fit it. */
export function getOrbitStageWidth(viewportWidth: number) {
  const { rx } = getOrbitRadii(viewportWidth);
  // The widest cards sit at about 0.95 rx and are drawn at about 1.05x
  return Math.round(2 * (0.95 * rx + 0.55 * getCardWidth(viewportWidth)));
}

// Deterministic baseline radii matching the original desktop design for server rendering
const BASELINE_RADII = { rx: 480, rz: 230, ryTilt: 200 };

interface FeatureOrbitProps {
  selectedFeatureId: string | null;
  onSelectFeature?: (id: string) => void;
  isOrbitPaused?: boolean;
  isIntroComplete?: boolean;
  /** While true the angle keeps updating but the cards are not re-rendered, since they are hidden. */
  renderPausedRef?: React.RefObject<boolean>;
}

export default function FeatureOrbit({
  selectedFeatureId,
  onSelectFeature,
  isIntroComplete = true,
  renderPausedRef,
}: FeatureOrbitProps) {
  // Starts at Math.PI / 2 so the first feature is front and center
  const orbitAngleRef = useRef<number>(Math.PI / 2);
  const targetAngleRef = useRef<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // State initialized with identical baseline on server and client to eliminate hydration errors
  const [radii, setRadii] = useState(BASELINE_RADII);
  const radiiRef = useRef(BASELINE_RADII);

  const totalFeatures = BROKENOMORE_FEATURES.length;

  // Direct DOM updates for 60/120fps hardware-accelerated transforms without React state thrashing
  const updateCardPositions = useCallback((angle: number) => {
    const currentRadii = radiiRef.current;
    const total = BROKENOMORE_FEATURES.length;

    for (let i = 0; i < total; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;

      const itemAngle = angle + (i * 2 * Math.PI) / total;
      const x = Math.cos(itemAngle) * currentRadii.rx;
      const z = Math.sin(itemAngle) * currentRadii.rz;
      const y = Math.sin(itemAngle) * currentRadii.ryTilt;

      // Depth perspective (z in [-rz, rz])
      const depth = (z + currentRadii.rz) / (2 * currentRadii.rz); // 0 (back) to 1 (front)
      const scale = 0.82 + depth * 0.36; // 0.82x to 1.18x
      const opacity = Math.max(0.35, 0.4 + depth * 0.6); // 0.4 to 1.0

      // Stacking relative to phone at zIndex: 20
      // In front of phone (z > 0): 22-40; Behind phone (z <= 0): 5-18
      const zIndex = z > 0 ? 22 + Math.round(depth * 18) : 5 + Math.round(depth * 13);

      el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0px) scale(${scale.toFixed(3)})`;
      el.style.opacity = `${opacity.toFixed(3)}`;
      el.style.zIndex = `${zIndex}`;
    }
  }, []);

  // Update responsive radii on client mount and window resize
  useEffect(() => {
    const updateRadii = () => {
      const newRadii = getOrbitRadii(window.innerWidth);
      radiiRef.current = newRadii;
      setRadii(newRadii);
      updateCardPositions(orbitAngleRef.current);
    };

    updateRadii();
    window.addEventListener('resize', updateRadii);
    return () => window.removeEventListener('resize', updateRadii);
  }, [updateCardPositions]);

  // When selected feature changes, set target angle
  useEffect(() => {
    const idx = BROKENOMORE_FEATURES.findIndex((f) => f.id === selectedFeatureId);
    if (idx !== -1) {
      targetAngleRef.current = Math.PI / 2 - (idx * 2 * Math.PI) / totalFeatures;
    }
  }, [selectedFeatureId, totalFeatures]);

  // Eases round to the selected feature smoothly via RAF
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const target = targetAngleRef.current;
      if (target !== null) {
        let diff = (target - orbitAngleRef.current) % (2 * Math.PI);
        if (diff < -Math.PI) diff += 2 * Math.PI;
        if (diff > Math.PI) diff -= 2 * Math.PI;

        if (Math.abs(diff) > 0.0005) {
          orbitAngleRef.current += diff * 0.1;
        } else {
          orbitAngleRef.current = target;
          targetAngleRef.current = null;
        }

        if (!renderPausedRef?.current) {
          updateCardPositions(orbitAngleRef.current);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderPausedRef, updateCardPositions]);

  // Initial position sync on mount
  useEffect(() => {
    updateCardPositions(orbitAngleRef.current);
  }, [updateCardPositions]);

  return (
    <div
      className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none"
      suppressHydrationWarning
    >
      {/* 3D Orbit Track: Encompassing elliptical line looping completely around the phone on both web and mobile */}
      <div
        data-orbit-fade
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 1 }}
        suppressHydrationWarning
      >
        {/* Motion only fades and scales the wrapper; the svg's size lives in plain attributes so it
            follows the radii when they change after mount (Motion keeps its first inline style) */}
        <motion.div
          initial={false}
          animate={isIntroComplete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 1 }}
        >
        <svg
          className="shrink-0 overflow-visible pointer-events-none"
          width={(radii.rx + 40) * 2}
          height={(radii.ryTilt + 40) * 2}
          viewBox={`-${radii.rx + 40} -${radii.ryTilt + 40} ${(radii.rx + 40) * 2} ${(radii.ryTilt + 40) * 2}`}
          suppressHydrationWarning
        >
          <ellipse
            cx="0"
            cy="0"
            rx={radii.rx}
            ry={radii.ryTilt}
            fill="none"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="1.3"
          />
        </svg>
        </motion.div>
      </div>

      {/* 3D Orbiting Cards - Centered at (50%, 50%) and translated via GPU translate3d */}
      {BROKENOMORE_FEATURES.map((feature, i) => {
        const itemAngle = (Math.PI / 2) + (i * 2 * Math.PI) / totalFeatures;
        const initialX = Math.cos(itemAngle) * radii.rx;
        const initialY = Math.sin(itemAngle) * radii.ryTilt;
        const initialZ = Math.sin(itemAngle) * radii.rz;
        const initialDepth = (initialZ + radii.rz) / (2 * radii.rz);
        const initialScale = 0.82 + initialDepth * 0.36;
        const initialOpacity = Math.max(0.35, 0.4 + initialDepth * 0.6);
        const initialZIndex = initialZ > 0 ? 22 + Math.round(initialDepth * 18) : 5 + Math.round(initialDepth * 13);

        return (
          <div
            key={feature.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate3d(calc(-50% + ${initialX.toFixed(1)}px), calc(-50% + ${initialY.toFixed(1)}px), 0px) scale(${initialScale.toFixed(3)})`,
              opacity: initialOpacity,
              zIndex: initialZIndex,
              willChange: 'transform, opacity',
            }}
            className="pointer-events-auto cursor-pointer"
            onClick={() => onSelectFeature?.(feature.id)}
            suppressHydrationWarning
          >
            <div data-orbit-fade>
              <motion.div
                initial={false}
                animate={isIntroComplete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.45 }}
                transition={{ duration: 0.38, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <FeatureCard
                  feature={feature}
                  isActive={feature.id === selectedFeatureId}
                />
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
