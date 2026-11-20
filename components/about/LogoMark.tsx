'use client';

import { useState } from 'react';

// The BrokeNoMore mark for the About page. What you see is the logo artwork itself
// (public/assets/images/about-logo.webp, from assets/logos/logo.png), so it matches the logo
// exactly; the animation comes from masks that reveal each part of it in turn. The infinity loop
// draws on, the bars rise one after another, the lock appears and its shackle drops shut, and the
// sparkles pop in. After that the sparkles twinkle, the lock clicks open and shut now and then, a
// band of light passes over the mark, and the whole mark floats gently. A click plays it again.
// The animations live in globals.css under "lm-".
//
// Every number below is in the artwork's own 1024 × 1024 pixels, measured from the image.

const SRC = '/assets/images/about-logo.webp';
const SIZE = 1024;

// The loop: two circles of centre-line radius r, their centres R either side of the crossing,
// joined by the tangent lines that cross in the middle
const CX = 511.5;
const CY = 478;
const R = 199.5;
const r = 155;
const theta = Math.asin(r / R);
const tx = R - r * Math.sin(theta);
const ty = r * Math.cos(theta);
const len = Math.hypot(tx, ty);
// Where the under strand stops short of the crossing, each side
const GAP_IN = 60;
const GAP_OUT = 50;

const f = (n: number) => n.toFixed(1);
const T1 = [CX + tx, CY - ty];
const T2 = [CX + tx, CY + ty];
const T3 = [CX - tx, CY - ty];
const T4 = [CX - tx, CY + ty];
const G1 = [CX - (tx / len) * GAP_IN, CY - (ty / len) * GAP_IN];
const G2 = [CX + (tx / len) * GAP_OUT, CY + (ty / len) * GAP_OUT];

// The pen's path for the loop: from the gap up to the left loop, round it, straight over the
// crossing, round the right loop, and back towards the gap
const LOOP = [
  `M${f(G1[0])} ${f(G1[1])}`,
  `L${f(T3[0])} ${f(T3[1])}`,
  `A${r} ${r} 0 1 0 ${f(T4[0])} ${f(T4[1])}`,
  `L${f(T1[0])} ${f(T1[1])}`,
  `A${r} ${r} 0 1 1 ${f(T2[0])} ${f(T2[1])}`,
  `L${f(G2[0])} ${f(G2[1])}`,
].join(' ');

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const box = (x0: number, y0: number, x1: number, y1: number, pad = 4): Box => ({
  x: x0 - pad,
  y: y0 - pad,
  w: x1 - x0 + pad * 2,
  h: y1 - y0 + pad * 2,
});

const BARS = [box(224, 485, 261, 562), box(278, 455, 317, 575), box(337, 410, 375, 567)];
const SHACKLE = box(651, 395, 772, 455, 3);
const BODY = box(651, 455, 772, 560, 3);
const LOCK = box(651, 395, 772, 560, 3);
const SPARKLES = [
  { b: box(644, 163, 776, 298, 3), delay: 1.9 },
  { b: box(336, 672, 431, 780, 3), delay: 2.05 },
  { b: box(454, 729, 526, 810, 3), delay: 2.2 },
];

// Transforms are worked out around fixed points of the artwork (its bottom edge, its centre)
const origin = (b: Box, ox: number, oy: number) => ({
  transformBox: 'view-box' as const,
  transformOrigin: `${f(b.x + b.w * ox)}px ${f(b.y + b.h * oy)}px`,
});

export default function LogoMark({ className = '' }: { className?: string }) {
  // Changing the key mounts the drawing afresh, which restarts every animation
  const [run, setRun] = useState(0);
  const id = (k: string) => `lm-${k}-${run}`;
  const art = (clip: string) => (
    <image href={SRC} x={0} y={0} width={SIZE} height={SIZE} clipPath={`url(#${id(clip)})`} />
  );

  return (
    <div className={`lm-float ${className}`}>
      <svg
        key={run}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full cursor-pointer select-none"
        role="img"
        aria-label="The BrokeNoMore logo"
        onClick={() => setRun((n) => n + 1)}
      >
        <defs>
          {/* The loop is uncovered by a pen that follows it; the bars, lock and sparkles inside
              its reach are kept out, as they come in on their own */}
          <mask id={id('loop')} maskUnits="userSpaceOnUse" x={0} y={0} width={SIZE} height={SIZE}>
            <path className="lm-draw" d={LOOP} pathLength={1} fill="none" stroke="#fff" strokeWidth={64} />
            {[...BARS, LOCK, ...SPARKLES.map((s) => s.b)].map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#000" />
            ))}
          </mask>
          {BARS.map((b, i) => (
            <clipPath key={i} id={id(`bar${i}`)}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} />
            </clipPath>
          ))}
          <clipPath id={id('shackle')}>
            <rect x={SHACKLE.x} y={SHACKLE.y} width={SHACKLE.w} height={SHACKLE.h} />
          </clipPath>
          <clipPath id={id('body')}>
            <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} />
          </clipPath>
          {SPARKLES.map((s, i) => (
            <clipPath key={i} id={id(`spark${i}`)}>
              <rect x={s.b.x} y={s.b.y} width={s.b.w} height={s.b.h} />
            </clipPath>
          ))}
          {/* The passing band of light, kept inside the mark's own outline */}
          <linearGradient id={id('sheen-band')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={id('shape')} maskUnits="userSpaceOnUse" x={0} y={0} width={SIZE} height={SIZE} style={{ maskType: 'alpha' }}>
            <image href={SRC} x={0} y={0} width={SIZE} height={SIZE} />
          </mask>
        </defs>

        {/* The loop */}
        <image href={SRC} x={0} y={0} width={SIZE} height={SIZE} mask={`url(#${id('loop')})`} />

        {/* The bars, rising from their feet */}
        {BARS.map((b, i) => (
          <g key={i} className="lm-bar" style={{ ...origin(b, 0.5, 1), animationDelay: `${0.95 + i * 0.13}s` }}>
            {art(`bar${i}`)}
          </g>
        ))}

        {/* The lock: the body pops in, the shackle drops shut */}
        <g className="lm-lock" style={origin(LOCK, 0.5, 1)}>
          {art('body')}
          <g className="lm-shackle">{art('shackle')}</g>
        </g>

        {/* The sparkles */}
        {SPARKLES.map((s, i) => (
          <g key={i} className="lm-spark" style={{ ...origin(s.b, 0.5, 0.5), animationDelay: `${s.delay}s, ${s.delay + 0.7}s` }}>
            {art(`spark${i}`)}
          </g>
        ))}

        <g mask={`url(#${id('shape')})`} aria-hidden="true">
          <g transform="scale(2)">
            <rect className="lm-sheen" x="-160" y="0" width="120" height="512" fill={`url(#${id('sheen-band')})`} transform="skewX(-20)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
