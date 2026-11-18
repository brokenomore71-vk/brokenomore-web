'use client';

import { useState } from 'react';

// The BrokeNoMore mark for the About page, drawn flat as an SVG traced from the logo, in soft
// silver. It builds itself: the infinity loop draws on, the bars rise one after another, the lock
// appears and its shackle drops shut, and the sparkles pop in. After that the sparkles twinkle, the
// lock clicks open and shut now and then, a band of light passes over the metal, and the whole mark
// floats gently. A click plays it again. The animations live in globals.css under "lm-".

// Geometry, in the logo's 512 × 512 drawing: two loops of radius r centred R either side of the
// crossing, joined by the tangent lines that cross in the middle
const CX = 255;
const CY = 274;
const R = 110;
const r = 92;
const theta = Math.asin(r / R);
const tx = R - r * Math.sin(theta);
const ty = r * Math.cos(theta);
const GAP = 27; // where the under strand stops short of the crossing, each side

const f = (n: number) => n.toFixed(1);
const T1 = [CX + tx, CY - ty];
const T2 = [CX + tx, CY + ty];
const T3 = [CX - tx, CY - ty];
const T4 = [CX - tx, CY + ty];
const len = Math.hypot(tx, ty);
const G1 = [CX - (tx / len) * GAP, CY - (ty / len) * GAP];
const G2 = [CX + (tx / len) * GAP, CY + (ty / len) * GAP];

// One stroke: from the gap up to the left loop, round it, straight over the crossing, round the
// right loop, and back towards the gap
const LOOP = [
  `M${f(G1[0])} ${f(G1[1])}`,
  `L${f(T3[0])} ${f(T3[1])}`,
  `A${r} ${r} 0 1 0 ${f(T4[0])} ${f(T4[1])}`,
  `L${f(T1[0])} ${f(T1[1])}`,
  `A${r} ${r} 0 1 1 ${f(T2[0])} ${f(T2[1])}`,
  `L${f(G2[0])} ${f(G2[1])}`,
].join(' ');

// A four-pointed sparkle with curved sides
const sparkle = (cx: number, cy: number, w: number, h: number) => {
  const k = 0.16;
  return `M${cx} ${cy - h} Q${cx + w * k} ${cy - h * k} ${cx + w} ${cy} Q${cx + w * k} ${cy + h * k} ${cx} ${cy + h} Q${cx - w * k} ${cy + h * k} ${cx - w} ${cy} Q${cx - w * k} ${cy - h * k} ${cx} ${cy - h}Z`;
};

const BARS = [
  { x: 100, h: 48 },
  { x: 132, h: 70 },
  { x: 164, h: 97 },
];
const BAR_BOTTOM = 330;
const SPARKLES = [
  { d: sparkle(384, 118, 38, 47), delay: 1.9 },
  { d: sparkle(193, 405, 29, 36), delay: 2.05 },
  { d: sparkle(257, 437, 23, 29), delay: 2.2 },
];

function Shapes({ silver }: { silver: string }) {
  return (
    <>
      <path className="lm-draw" d={LOOP} pathLength={1} fill="none" stroke={silver} strokeWidth={22} strokeLinecap="round" />
      {BARS.map((b, i) => (
        <rect
          key={b.x}
          className="lm-bar"
          style={{ animationDelay: `${0.95 + i * 0.13}s` }}
          x={b.x}
          y={BAR_BOTTOM - b.h}
          width={21}
          height={b.h}
          rx={5}
          fill={silver}
        />
      ))}
      <g className="lm-lock">
        <path className="lm-shackle" d="M346 262 V246 a23 23 0 0 1 46 0 V262" fill="none" stroke={silver} strokeWidth={12} strokeLinecap="round" />
        <path
          fillRule="evenodd"
          fill={silver}
          d="M338 258 h62 a9 9 0 0 1 9 9 v52 a9 9 0 0 1 -9 9 h-62 a9 9 0 0 1 -9 -9 v-52 a9 9 0 0 1 9 -9Z M369 279 a8 8 0 0 0 -3.5 15.2 V306 a3.5 3.5 0 0 0 7 0 V294.2 A8 8 0 0 0 369 279Z"
        />
      </g>
      {SPARKLES.map((s, i) => (
        <path key={i} className="lm-spark" style={{ animationDelay: `${s.delay}s, ${s.delay + 0.7}s` }} d={s.d} fill={silver} />
      ))}
    </>
  );
}

export default function LogoMark({ className = '' }: { className?: string }) {
  // Changing the key mounts the drawing afresh, which restarts every animation
  const [run, setRun] = useState(0);
  return (
    <div className={`lm-float ${className}`}>
      <svg
        key={run}
        viewBox="30 55 452 425"
        className="h-auto w-full cursor-pointer select-none"
        role="img"
        aria-label="The BrokeNoMore logo"
        onClick={() => setRun((n) => n + 1)}
      >
        <defs>
          {/* Brushed silver: light and dark bands running diagonally across the whole mark */}
          <linearGradient id="lm-silver" gradientUnits="userSpaceOnUse" x1="60" y1="90" x2="460" y2="470">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.22" stopColor="#C3C7CF" />
            <stop offset="0.45" stopColor="#F2F3F6" />
            <stop offset="0.68" stopColor="#9DA2AC" />
            <stop offset="0.86" stopColor="#E4E6EA" />
            <stop offset="1" stopColor="#B4B9C2" />
          </linearGradient>
          {/* The passing band of light, kept inside the mark's own outline */}
          <linearGradient id="lm-sheen-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="lm-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
            <Shapes silver="#fff" />
          </mask>
        </defs>

        <Shapes silver="url(#lm-silver)" />

        <g mask="url(#lm-mask)" aria-hidden="true">
          <rect className="lm-sheen" x="-160" y="0" width="120" height="512" fill="url(#lm-sheen-band)" transform="skewX(-20)" />
        </g>
      </svg>
    </div>
  );
}
