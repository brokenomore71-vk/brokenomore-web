import React from 'react';
import type { CalcKey } from '@/lib/calculators';

// The calculator cards' illustrations: small clay-style 3D objects, lit from the top left, in
// silver-lavender with one violet accent each. Drawn in SVG so they stay sharp at any size.

const INK = '#211D33';

// The shared materials: each icon prefixes their ids with its own key
function Materials({ p }: { p: string }) {
  return (
    <defs>
      {/* Silver-lavender clay, lit from the top left */}
      <radialGradient id={`${p}-clay`} cx="0.32" cy="0.28" r="0.85">
        <stop offset="0" stopColor="#FAF9FF" />
        <stop offset="0.45" stopColor="#D3CEEA" />
        <stop offset="1" stopColor="#8079AE" />
      </radialGradient>
      <linearGradient id={`${p}-clayL`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ECE9F8" />
        <stop offset="1" stopColor="#B4AED6" />
      </linearGradient>
      <linearGradient id={`${p}-clayD`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#A49ECB" />
        <stop offset="1" stopColor="#6D669C" />
      </linearGradient>
      {/* A cylinder's side: dark at the edges, a bright band near the front */}
      <linearGradient id={`${p}-edge`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6D669C" />
        <stop offset="0.32" stopColor="#E2DEF3" />
        <stop offset="0.55" stopColor="#B4AED6" />
        <stop offset="1" stopColor="#5E5790" />
      </linearGradient>
      {/* The violet accent */}
      <radialGradient id={`${p}-vio`} cx="0.3" cy="0.25" r="0.9">
        <stop offset="0" stopColor="#C9C0FF" />
        <stop offset="0.45" stopColor="#7B6BFF" />
        <stop offset="1" stopColor="#3F2FC4" />
      </radialGradient>
      <linearGradient id={`${p}-vioEdge`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3326A8" />
        <stop offset="0.35" stopColor="#8E80FF" />
        <stop offset="1" stopColor="#2E2296" />
      </linearGradient>
      <filter id={`${p}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
      <filter id={`${p}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.4" />
      </filter>
    </defs>
  );
}

const Shadow = ({ p, cx, cy, rx, ry = 4, o = 0.55 }: { p: string; cx: number; cy: number; rx: number; ry?: number; o?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity={o} filter={`url(#${p}-soft)`} />
);
const Gloss = ({ p, cx, cy, rx, ry, rot = -20, o = 0.55 }: { p: string; cx: number; cy: number; rx: number; ry: number; rot?: number; o?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity={o} transform={`rotate(${rot} ${cx} ${cy})`} filter={`url(#${p}-glow)`} />
);

// A coin lying flat: its rim (a short cylinder) and its face, with ridges on the rim
function FlatCoin({ p, cx, y, rx = 13, ry = 4.6, h = 4.6, violet = false }: { p: string; cx: number; y: number; rx?: number; ry?: number; h?: number; violet?: boolean }) {
  return (
    <g>
      <path d={`M${cx - rx} ${y} v${h} a${rx} ${ry} 0 0 0 ${rx * 2} 0 v${-h} Z`} fill={`url(#${p}-${violet ? 'vioEdge' : 'edge'})`} />
      {Array.from({ length: 9 }, (_, i) => {
        const x = cx - rx + ((i + 0.5) * (rx * 2)) / 9;
        return <line key={i} x1={x} y1={y + 1.2} x2={x} y2={y + h + Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) * ry - 1} stroke="#000" strokeOpacity="0.12" strokeWidth="0.6" />;
      })}
      <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill={violet ? `url(#${p}-vio)` : `url(#${p}-clayL)`} />
      <ellipse cx={cx} cy={y} rx={rx * 0.7} ry={ry * 0.62} fill="none" stroke={violet ? '#E4DEFF' : '#8F89B8'} strokeOpacity="0.55" strokeWidth="0.7" />
    </g>
  );
}

// A coin standing up, facing us, with its rim showing on the right
function StandingCoin({ p, cx, cy, r }: { p: string; cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx + r * 0.16} cy={cy} r={r} fill={`url(#${p}-vioEdge)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${p}-vio)`} />
      <circle cx={cx} cy={cy} r={r * 0.74} fill="none" stroke="#E4DEFF" strokeOpacity="0.5" strokeWidth="0.8" />
      <text x={cx} y={cy + r * 0.38} textAnchor="middle" fontSize={r * 1.05} fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
        ₹
      </text>
    </g>
  );
}

function Piggy({ p }: { p: string }) {
  return (
    <g>
      <Shadow p={p} cx={60} cy={95} rx={36} />
      {/* Tail */}
      <path d="M22 60c-7-1-9-8-4-10 4-1.5 6 3 3 5.5-2 1.5-4.5 0-4-2" fill="none" stroke="#8F89B8" strokeWidth="2.6" strokeLinecap="round" />
      {/* Far legs */}
      <rect x="41" y="76" width="11" height="17" rx="5.5" fill={`url(#${p}-clayD)`} />
      <rect x="73" y="75" width="11" height="17" rx="5.5" fill={`url(#${p}-clayD)`} />
      {/* Far ear */}
      <path d="M66 35c1-7 4-12 8-14 2 5 3 10 2 15Z" fill="#9C96C6" stroke="#9C96C6" strokeWidth="3" strokeLinejoin="round" />
      {/* Body */}
      <ellipse cx="57" cy="60" rx="38" ry="28.5" fill={`url(#${p}-clay)`} />
      {/* Near ear */}
      <path d="M77 37c2-7 6-11 11-12 1 5 0 11-3 15Z" fill={`url(#${p}-clayL)`} stroke="#C9C4E4" strokeWidth="3" strokeLinejoin="round" />
      <path d="M80 36c1.5-4 4-6.5 6.5-7.5 0 3-.5 6-2 8.5Z" fill="#8F89B8" opacity="0.6" />
      {/* Snout */}
      <ellipse cx="93" cy="62" rx="9" ry="10.5" fill="#C9C4E4" />
      <ellipse cx="94" cy="61.5" rx="7.6" ry="9.2" fill={`url(#${p}-clayL)`} />
      <ellipse cx="91.5" cy="61" rx="1.5" ry="2.6" fill="#6D669C" />
      <ellipse cx="96.6" cy="61" rx="1.5" ry="2.6" fill="#6D669C" />
      {/* Eye and cheek */}
      <ellipse cx="80" cy="51" rx="2.4" ry="3.1" fill={INK} />
      <circle cx="80.9" cy="49.9" r="0.9" fill="#fff" />
      <ellipse cx="80" cy="62" rx="5" ry="3" fill="#A99DFF" opacity="0.35" filter={`url(#${p}-glow)`} />
      {/* Near legs */}
      <rect x="47" y="78" width="12" height="17" rx="6" fill={`url(#${p}-clayL)`} />
      <rect x="77" y="77" width="12" height="17" rx="6" fill={`url(#${p}-clayL)`} />
      <rect x="47" y="90" width="12" height="5" rx="2.5" fill="#8F89B8" />
      <rect x="77" y="89" width="12" height="5" rx="2.5" fill="#8F89B8" />
      {/* Slot, and the light on its back */}
      <rect x="47" y="33.6" width="19" height="3.6" rx="1.8" fill={INK} />
      <Gloss p={p} cx={40} cy={47} rx={12} ry={5.5} />
      {/* A coin on its way in */}
      <StandingCoin p={p} cx={56.5} cy={18} r={10} />
    </g>
  );
}

function House({ p }: { p: string }) {
  return (
    <g>
      <Shadow p={p} cx={60} cy={92} rx={42} ry={5} />
      {/* Walls: the gable end (lit) and the long side (in shade) */}
      <path d="M20 46 58 62v28L20 74Z" fill={`url(#${p}-clayL)`} />
      <path d="M20 46 39 28 58 62Z" fill="#E5E2F4" />
      <path d="M58 62 100 44v28L58 90Z" fill={`url(#${p}-clayD)`} />
      {/* Roof, in violet, with its thickness along the eaves */}
      <path d="M37 25 81 6 105 42 61 61Z" fill={`url(#${p}-vio)`} />
      <path d="M61 61 105 42 105 46 61 65Z" fill="#2E2296" />
      <path d="M37 25 61 61 58 64 34 28Z" fill="#4B3BD6" />
      {/* Chimney */}
      <path d="M84 14 92 10.5v9l-8 3.5Z" fill="#8F89B8" />
      <path d="M80 12.5 84 14v9l-4-1.6Z" fill="#B4AED6" />
      <path d="M80 12.5 88 9 92 10.5 84 14Z" fill="#E5E2F4" />
      {/* Door and window */}
      <path d="M74 83.2 84 79V63.5l-10 4.3Z" fill={INK} />
      <circle cx="81.6" cy="72.6" r="0.9" fill="#A99DFF" />
      <path d="M27 58.5 40 64v-10l-13-5.5Z" fill="#3B3358" />
      <path d="M28.4 57.7 38.6 62v-7.4l-10.2-4.3Z" fill="#A99DFF" opacity="0.85" />
      <path d="M33.5 52.5v7.3M28.4 54.3l10.2 4.4" stroke="#3B3358" strokeWidth="0.9" />
      <Gloss p={p} cx={30} cy={56} rx={6} ry={2} rot={22} o={0.35} />
      {/* The key, in front */}
      <g transform="rotate(-18 28 88)">
        <circle cx="20" cy="88" r="5.6" fill="none" stroke={`url(#${p}-edge)`} strokeWidth="3.4" />
        <rect x="25" y="86.6" width="19" height="2.8" rx="1.4" fill="#C9C4E4" />
        <rect x="37" y="89" width="2.4" height="4" rx="1" fill="#C9C4E4" />
        <rect x="41" y="89" width="2.4" height="3" rx="1" fill="#C9C4E4" />
      </g>
    </g>
  );
}

function Stacks({ p }: { p: string }) {
  const stack = (cx: number, n: number, violetTop: boolean) =>
    Array.from({ length: n }, (_, i) => <FlatCoin key={i} p={p} cx={cx} y={86 - i * 5.4} violet={violetTop && i === n - 1} />);
  return (
    <g>
      <Shadow p={p} cx={62} cy={95} rx={48} ry={4.5} />
      {stack(30, 3, false)}
      {stack(58, 5, false)}
      {stack(87, 8, true)}
      {/* A sprout from the tallest stack */}
      <path d="M87 47c0-6 .5-11 2-15" fill="none" stroke="#7B6BFF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M88.5 36c-7.5.5-12.5-3.5-13.5-10 7 0 12.5 3.5 13.5 10Z" fill={`url(#${p}-vio)`} />
      <path d="M89 33c5-4.5 10.5-5.5 15-3.5-2.5 5-8 7-15 3.5Z" fill={`url(#${p}-vio)`} />
      <path d="M88 35.5c-4-1.5-7-4-8.5-7" fill="none" stroke="#E4DEFF" strokeOpacity="0.6" strokeWidth="0.7" />
      <Gloss p={p} cx={24} cy={74} rx={4} ry={1.4} rot={0} o={0.5} />
    </g>
  );
}

function Wallet({ p }: { p: string }) {
  return (
    <g>
      <Shadow p={p} cx={60} cy={95} rx={44} ry={4.5} />
      {/* Notes and a card, tucked in behind */}
      <rect x="30" y="24" width="44" height="26" rx="3" fill="#E5E2F4" transform="rotate(-12 52 37)" />
      <circle cx="51" cy="37" r="5" fill="none" stroke="#8F89B8" strokeWidth="1.2" transform="rotate(-12 52 37)" />
      <rect x="44" y="22" width="44" height="28" rx="4" fill={`url(#${p}-vio)`} transform="rotate(8 66 36)" />
      <rect x="49" y="28" width="10" height="7" rx="1.5" fill="#E4DEFF" opacity="0.7" transform="rotate(8 66 36)" />
      {/* The wallet: its thickness, then its front */}
      <rect x="19" y="43" width="86" height="51" rx="12" fill="#57508A" />
      <rect x="16" y="40" width="86" height="51" rx="12" fill={`url(#${p}-clay)`} />
      <rect x="21" y="45" width="76" height="41" rx="8" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="2.2 2" />
      {/* The clasp */}
      <rect x="76" y="54" width="34" height="23" rx="11.5" fill="#57508A" />
      <rect x="74" y="52" width="34" height="23" rx="11.5" fill={`url(#${p}-clayD)`} />
      <circle cx="86" cy="63.5" r="5" fill={`url(#${p}-vio)`} />
      <circle cx="84.6" cy="62" r="1.4" fill="#fff" opacity="0.8" />
      <Gloss p={p} cx={34} cy={50} rx={13} ry={3.5} rot={-6} />
    </g>
  );
}

function Vault({ p }: { p: string }) {
  return (
    <g>
      <Shadow p={p} cx={64} cy={96} rx={42} ry={4.5} />
      {/* Feet */}
      <rect x="30" y="88" width="9" height="6" rx="2" fill={INK} />
      <rect x="78" y="88" width="9" height="6" rx="2" fill={INK} />
      {/* Box: top, side, front */}
      <path d="M24 28 37 19h66l-13 9Z" fill="#ECE9F8" />
      <path d="M90 28 103 19v62l-13 9Z" fill={`url(#${p}-clayD)`} />
      <rect x="24" y="28" width="66" height="62" rx="5" fill={`url(#${p}-clay)`} />
      {/* Door */}
      <rect x="30" y="34" width="54" height="50" rx="4" fill="none" stroke="#7F78AD" strokeWidth="1.4" />
      <rect x="31" y="35" width="52" height="48" rx="3.5" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.7" />
      <rect x="27.5" y="42" width="3" height="8" rx="1.2" fill="#7F78AD" />
      <rect x="27.5" y="68" width="3" height="8" rx="1.2" fill="#7F78AD" />
      {/* Dial */}
      <circle cx="50" cy="59" r="14.5" fill="#6D669C" />
      <circle cx="49" cy="58" r="14" fill={`url(#${p}-clayL)`} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="48.5" y="45.6" width="1" height={i % 3 ? 2 : 3.4} rx="0.5" fill="#6D669C" transform={`rotate(${i * 30} 49 58)`} />
      ))}
      <circle cx="49" cy="58" r="8" fill={`url(#${p}-vio)`} />
      <rect x="48.2" y="50.5" width="1.6" height="6" rx="0.8" fill="#fff" />
      {/* Handle */}
      <g stroke="#6D669C" strokeWidth="3" strokeLinecap="round">
        <path d="M74 59v-8M74 59l7 4M74 59l-7 4" />
      </g>
      <g stroke="#ECE9F8" strokeWidth="1.6" strokeLinecap="round">
        <path d="M74 59v-8M74 59l7 4M74 59l-7 4" />
      </g>
      <circle cx="74" cy="59" r="3" fill={`url(#${p}-clayD)`} />
      <Gloss p={p} cx={36} cy={33} rx={10} ry={2.4} rot={0} o={0.6} />
    </g>
  );
}

function Shield({ p }: { p: string }) {
  const bar = (x: number, top: number) => (
    <g key={x}>
      <path d={`M${x + 8} ${top + 2} l3 -2 v${74 - top} l-3 2Z`} fill="#2E2296" />
      <path d={`M${x} ${top + 2} l3 -2 h8 l-3 2Z`} fill="#C9C0FF" />
      <rect x={x} y={top + 2} width="8" height={74 - top} fill={`url(#${p}-vio)`} />
    </g>
  );
  return (
    <g>
      <Shadow p={p} cx={58} cy={96} rx={32} ry={4} />
      {/* The shield: its rim, then its face */}
      <path d="M58 8 94 21v27c0 23-15 39-36 46-21-7-36-23-36-46V21Z" fill="#6D669C" />
      <path d="M56 6 92 19v27c0 23-15 39-36 46-21-7-36-23-36-46V19Z" fill={`url(#${p}-clay)`} />
      <path d="M56 15 84 25v21c0 18-11 31-28 37-17-6-28-19-28-37V25Z" fill="#3B3358" />
      <path d="M56 15 84 25v21c0 18-11 31-28 37-17-6-28-19-28-37V25Z" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="0.8" />
      {/* Its savings, rising */}
      {bar(38, 58)}
      {bar(51, 48)}
      {bar(64, 36)}
      <Gloss p={p} cx={34} cy={24} rx={9} ry={3} rot={-22} o={0.6} />
      <StandingCoin p={p} cx={95} cy={80} r={10} />
    </g>
  );
}

export function CalcArt({ k }: { k: CalcKey }) {
  const p = `ca-${k}`;
  return (
    <svg viewBox="0 0 120 100" className="h-full w-full overflow-visible" aria-hidden="true">
      <Materials p={p} />
      {k === 'swp' && <Piggy p={p} />}
      {k === 'emi' && <House p={p} />}
      {k === 'sip' && <Stacks p={p} />}
      {k === 'lumpsum' && <Wallet p={p} />}
      {k === 'fd' && <Vault p={p} />}
      {k === 'ppf' && <Shield p={p} />}
    </svg>
  );
}
