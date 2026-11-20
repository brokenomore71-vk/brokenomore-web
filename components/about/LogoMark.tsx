'use client';

import { useState } from 'react';

// The BrokeNoMore mark for the About page, drawn flat as an SVG traced from the logo, in the
// logo's magenta and cyan. It builds itself: the infinity loop draws on, the bars rise one after another, the lock
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
  { d: sparkle(384, 118, 38, 47), delay: 1.9, pink: false },
  { d: sparkle(193, 405, 29, 36), delay: 2.05, pink: true },
  { d: sparkle(257, 437, 23, 29), delay: 2.2, pink: false },
];

// A bar with a rounded top and a bottom that may slant: `dl` / `dr` lift the bottom-left /
// bottom-right corner, as the outer bars in the logo are cut on the slant
const BAR_W = 21;
const barPath = (x: number, h: number, dl: number, dr: number) => {
  const top = BAR_BOTTOM - h;
  const k = 5;
  return `M${x} ${BAR_BOTTOM - dl} V${top + k} Q${x} ${top} ${x + k} ${top} H${x + BAR_W - k} Q${x + BAR_W} ${top} ${x + BAR_W} ${top + k} V${BAR_BOTTOM - dr} Z`;
};
const BAR_CUTS = [
  [0, 9],
  [0, 0],
  [9, 0],
];

interface Paint {
  loop: string;
  pink: string;
  blue: string;
}

function Shapes({ paint }: { paint: Paint }) {
  return (
    <>
      <path className="lm-draw" d={LOOP} pathLength={1} fill="none" stroke={paint.loop} strokeWidth={22} strokeLinecap="round" />
      {BARS.map((b, i) => (
        <path
          key={b.x}
          className="lm-bar"
          style={{ animationDelay: `${0.95 + i * 0.13}s` }}
          d={barPath(b.x, b.h, BAR_CUTS[i][0], BAR_CUTS[i][1])}
          fill={paint.pink}
        />
      ))}
      <g className="lm-lock">
        <path className="lm-shackle" d="M346 262 V246 a23 23 0 0 1 46 0 V262" fill="none" stroke={paint.blue} strokeWidth={12} strokeLinecap="round" />
        <path
          fillRule="evenodd"
          fill={paint.blue}
          d="M338 258 h62 a9 9 0 0 1 9 9 v52 a9 9 0 0 1 -9 9 h-62 a9 9 0 0 1 -9 -9 v-52 a9 9 0 0 1 9 -9Z M369 279 a8 8 0 0 0 -3.5 15.2 V306 a3.5 3.5 0 0 0 7 0 V294.2 A8 8 0 0 0 369 279Z"
        />
      </g>
      {SPARKLES.map((s, i) => (
        <path
          key={i}
          className="lm-spark"
          style={{ animationDelay: `${s.delay}s, ${s.delay + 0.7}s` }}
          d={s.d}
          fill={s.pink ? paint.pink : paint.blue}
        />
      ))}
    </>
  );
}

const WHITE: Paint = { loop: '#fff', pink: '#fff', blue: '#fff' };
const COLOUR: Paint = { loop: 'url(#lm-loop)', pink: '#F230FF', blue: '#00CCFF' };

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
          {/* The loop runs magenta on the left, through violet and blue over the crossing, to cyan
              on the right, as in the logo */}
          <linearGradient id="lm-loop" gradientUnits="userSpaceOnUse" x1="53" y1="0" x2="457" y2="0">
            <stop offset="0" stopColor="#F531FF" />
            <stop offset="0.3" stopColor="#E234FF" />
            <stop offset="0.42" stopColor="#A64BFF" />
            <stop offset="0.5" stopColor="#6A82FF" />
            <stop offset="0.6" stopColor="#22B6FF" />
            <stop offset="0.68" stopColor="#00CCFF" />
            <stop offset="1" stopColor="#00CCFF" />
          </linearGradient>
          {/* The passing band of light, kept inside the mark's own outline */}
          <linearGradient id="lm-sheen-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="lm-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
            <Shapes paint={WHITE} />
          </mask>
        </defs>

        <Shapes paint={COLOUR} />

        <g mask="url(#lm-mask)" aria-hidden="true">
          <rect className="lm-sheen" x="-160" y="0" width="120" height="512" fill="url(#lm-sheen-band)" transform="skewX(-20)" />
        </g>
      </svg>
    </div>
  );
}
