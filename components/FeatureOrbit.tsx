'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FeatureCard from './FeatureCard';
import { BROKENOMORE_FEATURES, FeatureScreenDef } from './featureScreens';

interface FeatureOrbitProps {
  selectedFeatureId: string | null;
  onSelectFeature: (id: string) => void;
  isOrbitPaused?: boolean;
  isIntroComplete?: boolean;
  onDragChange?: (isDragging: boolean) => void;
}

interface FlyingCardState {
  feature: FeatureScreenDef;
  startX: number;
  startY: number;
  id: number;
}

export default function FeatureOrbit({
  selectedFeatureId,
  onSelectFeature,
  isOrbitPaused = true,
  isIntroComplete = true,
  onDragChange,
}: FeatureOrbitProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Orbit state - start at Math.PI / 2 so initial feature (index 0) is front and center
  const orbitAngleRef = useRef<number>(Math.PI / 2);
  const targetAngleRef = useRef<number | null>(null);
  const lastSelectedRef = useRef<string | null>(selectedFeatureId);

  const [, setTick] = useState(0); // Triggers re-render at 60fps for smooth orbit
  const [isHovered, setIsHovered] = useState(false);
  const [flyingCards, setFlyingCards] = useState<FlyingCardState[]>([]);
  const flyingIdCounter = useRef(0);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const startPointerXRef = useRef(0);
  const velocityRef = useRef(0);

  // Responsive radii for spacious, non-overlapping orbit surrounding the phone
  const [radii, setRadii] = useState({ rx: 480, rz: 230, ryTilt: 200 });

  const totalFeatures = BROKENOMORE_FEATURES.length;

  useEffect(() => {
    const updateRadii = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setRadii({ rx: 240, rz: 140, ryTilt: 160 });
      } else if (w < 1024) {
        setRadii({ rx: 360, rz: 190, ryTilt: 180 });
      } else if (w < 1440) {
        setRadii({ rx: 480, rz: 230, ryTilt: 200 });
      } else {
        setRadii({ rx: 530, rz: 250, ryTilt: 220 });
      }
    };

    updateRadii();
    window.addEventListener('resize', updateRadii);
    return () => window.removeEventListener('resize', updateRadii);
  }, []);

  // Synchronize target angle when selectedFeatureId changes from external controls
  useEffect(() => {
    if (!selectedFeatureId) return;
    const idx = BROKENOMORE_FEATURES.findIndex((f) => f.id === selectedFeatureId);
    if (idx !== -1) {
      lastSelectedRef.current = selectedFeatureId;
      targetAngleRef.current = Math.PI / 2 - (idx * 2 * Math.PI) / totalFeatures;
    }
  }, [selectedFeatureId, totalFeatures]);

  // 60 FPS Orbit Animation Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isDraggingRef.current) {
        // Inertia dampening from scroll wheel or pointer flick
        if (Math.abs(velocityRef.current) > 0.00005) {
          orbitAngleRef.current += velocityRef.current;
          velocityRef.current *= 0.92;

          // Find which feature is currently front-center (maximum z)
          let maxZ = -Infinity;
          let closestIndex = 0;
          for (let i = 0; i < totalFeatures; i++) {
            const itemAngle = orbitAngleRef.current + (i * 2 * Math.PI) / totalFeatures;
            const z = Math.sin(itemAngle);
            if (z > maxZ) {
              maxZ = z;
              closestIndex = i;
            }
          }

          // If velocity has slowed down, snap smoothly to the closest front card
          if (Math.abs(velocityRef.current) < 0.002) {
            velocityRef.current = 0;
            const closestFeature = BROKENOMORE_FEATURES[closestIndex];
            if (closestFeature && closestFeature.id !== lastSelectedRef.current) {
              lastSelectedRef.current = closestFeature.id;
              onSelectFeature(closestFeature.id);
            }
            targetAngleRef.current = Math.PI / 2 - (closestIndex * 2 * Math.PI) / totalFeatures;
          }
        } else if (targetAngleRef.current !== null) {
          // Smooth ease-out lerp to target angle via shortest angular path
          let diff = (targetAngleRef.current - orbitAngleRef.current) % (2 * Math.PI);
          if (diff < -Math.PI) diff += 2 * Math.PI;
          if (diff > Math.PI) diff -= 2 * Math.PI;

          if (Math.abs(diff) > 0.0005) {
            orbitAngleRef.current += diff * 0.1;
          } else {
            orbitAngleRef.current = targetAngleRef.current;
            targetAngleRef.current = null;
          }
        } else if (!isOrbitPaused) {
          // Continuous orbit revolution if not paused (opposite direction)
          const baseSpeed = isHovered ? 0.0005 : 0.0018;
          orbitAngleRef.current -= baseSpeed;
        }
      }

      setTick((t) => (t + 1) % 100000);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isHovered, isOrbitPaused, onSelectFeature, totalFeatures]);

  // Pointer drag events for manual orbit spinning
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startPointerXRef.current = e.clientX;
    velocityRef.current = 0;
    targetAngleRef.current = null;
    setIsHovered(true);
    onDragChange?.(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startPointerXRef.current;
    const deltaAngle = deltaX * 0.004;
    orbitAngleRef.current += deltaAngle;
    velocityRef.current = deltaAngle * 0.45;
    startPointerXRef.current = e.clientX;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setIsHovered(false);
    onDragChange?.(false);
  };

  // Click on a feature card triggers the flying animation into the phone
  const handleCardClick = (e: React.MouseEvent, feature: FeatureScreenDef, cardX: number, cardY: number) => {
    e.stopPropagation();

    // Trigger flying card clone
    const newId = ++flyingIdCounter.current;
    setFlyingCards((prev) => [
      ...prev,
      {
        feature,
        startX: cardX,
        startY: cardY,
        id: newId,
      },
    ]);

    // Select feature and set target angle
    lastSelectedRef.current = feature.id;
    onSelectFeature(feature.id);

    const idx = BROKENOMORE_FEATURES.findIndex((f) => f.id === feature.id);
    if (idx !== -1) {
      targetAngleRef.current = Math.PI / 2 - (idx * 2 * Math.PI) / totalFeatures;
    }

    // Remove flying card after animation completes
    setTimeout(() => {
      setFlyingCards((prev) => prev.filter((fc) => fc.id !== newId));
    }, 450);
  };

  const currentAngle = orbitAngleRef.current;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'pan-y' }}
      className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-auto select-none"
    >
      {/* 3D Orbit Track: White-grayish line connecting the feature blocks (behind phone with center cutout) */}
      <motion.svg
        initial={false}
        animate={
          isIntroComplete
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.88 }
        }
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible"
        style={{
          width: (radii.rx + 60) * 2,
          height: (radii.ryTilt + 60) * 2,
          zIndex: 1,
        }}
        viewBox={`-${radii.rx + 60} -${radii.ryTilt + 60} ${(radii.rx + 60) * 2} ${(radii.ryTilt + 60) * 2}`}
      >
        <defs>
          <mask id="phone-orbit-cutout">
            {/* White: reveal the orbit line */}
            <rect
              x={-(radii.rx + 200)}
              y={-(radii.ryTilt + 200)}
              width={(radii.rx + 200) * 2}
              height={(radii.ryTilt + 200) * 2}
              fill="white"
            />
            {/* Black: cut out the phone silhouette matching the tilted phone pose */}
            <rect
              x="-185"
              y="-340"
              width="370"
              height="680"
              rx="64"
              ry="64"
              fill="black"
              transform="rotate(-13.8)"
            />
          </mask>
        </defs>

        <ellipse
          cx="0"
          cy="0"
          rx={radii.rx}
          ry={radii.ryTilt}
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.5"
          mask="url(#phone-orbit-cutout)"
        />
      </motion.svg>

      {/* 3D Orbiting Cards */}
      {BROKENOMORE_FEATURES.map((feature, i) => {
        const itemAngle = currentAngle + (i * (2 * Math.PI)) / totalFeatures;

        // 3D Elliptical coordinates
        const x = Math.cos(itemAngle) * radii.rx;
        const z = Math.sin(itemAngle) * radii.rz;
        const y = Math.sin(itemAngle) * radii.ryTilt; // Orbital plane tilt

        // Depth perspective (z in [-rz, rz])
        const depth = (z + radii.rz) / (2 * radii.rz); // 0 (back) to 1 (front)
        const scale = 0.82 + depth * 0.36; // 0.82x (back) to 1.18x (front)
        const opacity = 0.4 + depth * 0.6; // 0.4 (back) to 1.0 (front)
        const zIndex = Math.round(depth * 40) + 5; // 5 to 45 (phone is at 25)
        const isFront = z > 0;
        const isActive = feature.id === selectedFeatureId;

        return (
          <div
            key={feature.id}
            style={{
              transform: `translate3d(${x}px, ${y}px, 0px)`,
              zIndex,
              position: 'absolute',
              transition: isDraggingRef.current ? 'none' : 'transform 0.05s linear',
            }}
          >
            <motion.div
              initial={false}
              animate={
                isIntroComplete
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.45 }
              }
              transition={{
                duration: 0.38,
                delay: i * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <FeatureCard
                feature={feature}
                isActive={isActive}
                scale={scale}
                opacity={opacity}
                zIndex={zIndex}
                isFront={isFront}
                onClick={(e) => handleCardClick(e, feature, x, y)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              />
            </motion.div>
          </div>
        );
      })}

      {/* Cinematic Flying Feature Card that travels through 3D space into the phone screen */}
      <AnimatePresence>
        {flyingCards.map((fc) => (
          <motion.div
            key={fc.id}
            initial={{
              x: fc.startX,
              y: fc.startY,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: 0,
              y: 0,
              scale: 0.28,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.38,
              ease: [0.16, 1, 0.3, 1], // Spring-like ease out
            }}
            style={{ zIndex: 60, position: 'absolute' }}
            className="pointer-events-none p-4 rounded-2xl bg-neutral-900/95 border border-white/30 text-white shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
              ✦
            </div>
            <div className="text-sm font-bold whitespace-nowrap">
              {fc.feature.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
