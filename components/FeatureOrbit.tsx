'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import FeatureCard from './FeatureCard';
import { BROKENOMORE_FEATURES } from './featureScreens';

// Responsive radii for a spacious, non-overlapping orbit surrounding the phone
function getOrbitRadii(viewportWidth: number) {
  if (viewportWidth < 640) return { rx: 240, rz: 140, ryTilt: 160 };
  if (viewportWidth < 1024) return { rx: 360, rz: 190, ryTilt: 180 };
  if (viewportWidth < 1440) return { rx: 480, rz: 230, ryTilt: 200 };
  return { rx: 530, rz: 250, ryTilt: 220 };
}

interface FeatureOrbitProps {
  selectedFeatureId: string | null;
  isIntroComplete?: boolean;
  /** While true the angle keeps updating but the cards are not re-rendered, since they are hidden. */
  renderPausedRef?: React.RefObject<boolean>;
}

// A slideshow of the features: the selected one glides round to the front. Purely for watching,
// since the website itself decides the order of the journey.
export default function FeatureOrbit({ selectedFeatureId, isIntroComplete = true, renderPausedRef }: FeatureOrbitProps) {
  // Starts at Math.PI / 2 so the first feature is front and center
  const orbitAngleRef = useRef<number>(Math.PI / 2);
  const targetAngleRef = useRef<number | null>(null);

  const [currentAngle, setCurrentAngle] = useState(Math.PI / 2);
  const [radii, setRadii] = useState({ rx: 480, rz: 230, ryTilt: 200 });

  const totalFeatures = BROKENOMORE_FEATURES.length;

  useEffect(() => {
    const updateRadii = () => setRadii(getOrbitRadii(window.innerWidth));

    updateRadii();
    window.addEventListener('resize', updateRadii);
    return () => window.removeEventListener('resize', updateRadii);
  }, []);

  useEffect(() => {
    const idx = BROKENOMORE_FEATURES.findIndex((f) => f.id === selectedFeatureId);
    if (idx !== -1) targetAngleRef.current = Math.PI / 2 - (idx * 2 * Math.PI) / totalFeatures;
  }, [selectedFeatureId, totalFeatures]);

  // Eases round to the selected feature by the shortest path
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
        if (!renderPausedRef?.current) setCurrentAngle(orbitAngleRef.current);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderPausedRef]);

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none">
      {/* 3D Orbit Track: White-grayish line connecting the feature blocks (behind phone with center cutout) */}
      <div data-orbit-fade className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
        <motion.svg
          initial={false}
          animate={isIntroComplete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
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
              <rect x="-185" y="-340" width="370" height="680" rx="64" ry="64" fill="black" transform="rotate(-13.8)" />
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
      </div>

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

        return (
          <div
            key={feature.id}
            style={{
              transform: `translate3d(${x}px, ${y}px, 0px)`,
              zIndex,
              position: 'absolute',
              transition: 'transform 0.05s linear',
            }}
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
                  scale={scale}
                  opacity={opacity}
                  zIndex={zIndex}
                  isFront={z > 0}
                />
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
