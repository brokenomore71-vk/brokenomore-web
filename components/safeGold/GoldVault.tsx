// The digital gold vault, drawn flat: a bank vault set into a panelled wall, its thick bolted ring,
// a keypad beside it, and a heap of gold bars inside. The round door is hinged on the right. The
// section's scroll timeline animates it through the data-g hooks: the wheel turns, the shut door
// folds in towards its hinge, and the open door (drawn in perspective, its thickness showing)
// swings out from the hinge.

// Where things are, in the drawing's own units (viewBox 0 0 520 340)
const CX = 220;
const CY = 158;
const RING = 116; // the ring's outer edge
const OPEN = 98; // the opening
const DOOR = 101; // the shut door, just covering the opening
export const VAULT = {
  door: { cx: CX, cy: CY, r: DOOR },
  hingeX: CX + RING - 4, // the door's right edge, which it swings about
};
const H = VAULT.hingeX;
// Rounded, so the server's and the browser's sums write the same numbers into the drawing
const at = (n: number) => Math.round(n * 100) / 100;

// A gold bar seen a little from above and from the left: its top, front and right side
function Bar({ x, y, w = 38 }: { x: number; y: number; w?: number }) {
  const h = 13;
  const top = 7;
  const inset = 5;
  return (
    <g>
      <path d={`M${x + inset} ${y - top} H${x + w - inset} L${x + w} ${y} H${x} Z`} fill="url(#vault-bar-top)" />
      <rect x={x} y={y} width={w} height={h} fill="url(#vault-bar-front)" />
      <path d={`M${x + w} ${y} L${x + w + 4} ${y - 3} V${y + h - 3} L${x + w} ${y + h} Z`} fill="#8C6B20" />
      <path d={`M${x + 3} ${y + 2.5} H${x + w - 3}`} stroke="#FFF4C8" strokeOpacity="0.6" strokeWidth="1" />
    </g>
  );
}

// The heap of bars inside, bottom row first
const HEAP: [number, number][] = [
  // bottom row
  [-92, 218], [-52, 220], [-12, 219], [28, 220], [68, 218],
  // second
  [-74, 204], [-34, 206], [6, 205], [46, 204],
  // third
  [-56, 191], [-16, 192], [24, 190],
  // fourth
  [-38, 177], [2, 178],
  // top
  [-20, 164],
];

export default function GoldVault({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const bolts = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2 + Math.PI / 16);
  const doorBolts = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  return (
    <svg viewBox="0 0 520 340" className={className} style={style} role="img" aria-label="A bank vault, its door open on a heap of gold bars">
      <defs>
        <linearGradient id="vault-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b160c" />
          <stop offset="1" stopColor="#0d0a05" />
        </linearGradient>
        <linearGradient id="vault-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a0e" />
          <stop offset="1" stopColor="#120d05" />
        </linearGradient>
        <linearGradient id="vault-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE9A3" />
          <stop offset="0.45" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#7a5a1a" />
        </linearGradient>
        <linearGradient id="vault-door" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5D76E" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#8C6B20" />
        </linearGradient>
        <linearGradient id="vault-door-open" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B8862B" />
          <stop offset="0.55" stopColor="#F5D76E" />
          <stop offset="1" stopColor="#C9962F" />
        </linearGradient>
        <linearGradient id="vault-door-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6E5016" />
          <stop offset="1" stopColor="#A8782A" />
        </linearGradient>
        <radialGradient id="vault-inside" cx="0.5" cy="0.7" r="0.7">
          <stop offset="0" stopColor="#4a3510" />
          <stop offset="1" stopColor="#0c0904" />
        </radialGradient>
        <linearGradient id="vault-bar-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4C8" />
          <stop offset="1" stopColor="#F5D76E" />
        </linearGradient>
        <linearGradient id="vault-bar-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6B93F" />
          <stop offset="1" stopColor="#A8782A" />
        </linearGradient>
        <clipPath id="vault-opening">
          <circle cx={CX} cy={CY} r={OPEN} />
        </clipPath>
      </defs>

      {/* The wall, with its panel mouldings */}
      <rect x="0" y="0" width="520" height="314" rx="14" fill="url(#vault-wall)" />
      <g fill="none" stroke="#D4AF37" strokeOpacity="0.22" strokeWidth="1.5">
        <rect x="16" y="14" width="488" height="288" rx="10" />
        <path d={`M40 34 H${CX - 70} M${CX + 70} 34 H480 M40 34 V282 H${CX - 80} M${CX + 80} 282 H480 V34`} />
        <rect x="408" y="60" width="72" height="196" rx="6" />
      </g>

      {/* The floor */}
      <rect x="0" y="306" width="520" height="34" fill="url(#vault-floor)" />
      <path d="M0 306.5 H520" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth="1" />
      <ellipse cx={CX} cy="314" rx="150" ry="8" fill="#000" fillOpacity="0.45" />

      {/* The keypad, on the left */}
      <g>
        <rect x="52" y="122" width="38" height="58" rx="5" fill="#0b0905" stroke="#D4AF37" strokeOpacity="0.7" strokeWidth="1.5" />
        <rect x="58" y="128" width="26" height="9" rx="1.5" fill="#2a1f0b" />
        <rect x="60" y="130.5" width="12" height="4" rx="1" fill="#F5D76E" fillOpacity="0.8" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={59 + (i % 3) * 8.5} y={141 + Math.floor(i / 3) * 9} width="6" height="6" rx="1" fill="#D4AF37" fillOpacity={i === 4 ? 1 : 0.55} />
        ))}
      </g>

      {/* The ring, studded with bolts */}
      <circle cx={CX} cy={CY} r={RING} fill="url(#vault-ring)" />
      <circle cx={CX} cy={CY} r={RING - 1} fill="none" stroke="#FFF4C8" strokeOpacity="0.5" strokeWidth="1.5" />
      {bolts.map((a, i) => (
        <g key={i}>
          <circle cx={at(CX + Math.cos(a) * (RING - 9))} cy={at(CY + Math.sin(a) * (RING - 9))} r="4.2" fill="#7a5a1a" />
          <circle cx={at(CX + Math.cos(a) * (RING - 9) - 1)} cy={at(CY + Math.sin(a) * (RING - 9) - 1)} r="2.6" fill="#FFE9A3" />
        </g>
      ))}

      {/* The opening, and the heap of gold inside it */}
      <circle cx={CX} cy={CY} r={OPEN} fill="url(#vault-inside)" />
      <g clipPath="url(#vault-opening)">
        <rect x={CX - OPEN} y="231" width={OPEN * 2} height="40" fill="#1a1206" />
        <path d={`M${CX - OPEN} 231 H${CX + OPEN}`} stroke="#8C6B20" strokeWidth="2" />
        {HEAP.map(([dx, y], i) => (
          <Bar key={i} x={CX + dx} y={y} />
        ))}
      </g>
      <circle cx={CX} cy={CY} r={OPEN} fill="none" stroke="#4a3510" strokeWidth="5" />

      {/* Hinges, on the right */}
      <rect x={H - 2} y="96" width="16" height="34" rx="4" fill="url(#vault-ring)" stroke="#7a5a1a" strokeWidth="1.5" />
      <rect x={H - 2} y="186" width="16" height="34" rx="4" fill="url(#vault-ring)" stroke="#7a5a1a" strokeWidth="1.5" />

      {/* The shut door */}
      <g data-g="vault-door">
        <circle cx={CX} cy={CY} r={DOOR} fill="url(#vault-door)" stroke="#7a5a1a" strokeWidth="2" />
        <circle cx={CX} cy={CY} r={DOOR - 12} fill="none" stroke="#FFF4C8" strokeOpacity="0.55" strokeWidth="2" />
        <circle cx={CX} cy={CY} r={DOOR * 0.56} fill="none" stroke="#8C6B20" strokeWidth="2.5" />
        {doorBolts.map((a, i) => (
          <circle key={i} cx={at(CX + Math.cos(a) * (DOOR - 24))} cy={at(CY + Math.sin(a) * (DOOR - 24))} r="3.6" fill="#8C6B20" />
        ))}
        <text x={CX} y={CY + 44} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="3" fill="#6E5016">
          24K
        </text>
        <g data-g="vault-wheel">
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
            const x = at(CX + Math.cos(a) * 38);
            const y = at(CY + Math.sin(a) * 38);
            return (
              <g key={i}>
                <line x1={CX} y1={CY} x2={x} y2={y} stroke="#6E5016" strokeWidth="7" strokeLinecap="round" />
                <line x1={CX} y1={CY} x2={x} y2={y} stroke="#F5D76E" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx={x} cy={y} r="7.5" fill="#F5D76E" stroke="#6E5016" strokeWidth="2" />
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r="14" fill="#E6B93F" stroke="#6E5016" strokeWidth="2.5" />
          <circle cx={CX} cy={CY} r="5" fill="#6E5016" />
        </g>
      </g>

      {/* The door swung open, seen from the side: its thick edge by the hinge, its face beyond */}
      <g data-g="vault-open-door">
        <ellipse cx={H + 30} cy={CY} rx="30" ry={DOOR + 4} fill="#5a4212" />
        <rect x={H + 30} y={CY - DOOR - 4} width="40" height={(DOOR + 4) * 2} fill="url(#vault-door-edge)" />
        {/* Locking bolts along the edge */}
        {[-70, -35, 0, 35, 70].map((dy) => (
          <rect key={dy} x={H + 12} y={CY + dy - 7} width="12" height="14" rx="2" fill="#2a1f0b" />
        ))}
        <ellipse cx={H + 70} cy={CY} rx="34" ry={DOOR + 4} fill="url(#vault-door-open)" stroke="#7a5a1a" strokeWidth="2" />
        <ellipse cx={H + 70} cy={CY} rx="27" ry={DOOR - 8} fill="none" stroke="#FFF4C8" strokeOpacity="0.55" strokeWidth="2" />
        <ellipse cx={H + 70} cy={CY} rx="15" ry={DOOR * 0.52} fill="none" stroke="#8C6B20" strokeWidth="2.5" />
        <ellipse cx={H + 70} cy={CY} rx="5" ry="14" fill="#E6B93F" stroke="#6E5016" strokeWidth="2" />
      </g>

    </svg>
  );
}
