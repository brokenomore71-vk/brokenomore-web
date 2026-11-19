// Frame 3 of the digital gold section: what the app does, one step per scroll. Each step has an
// illustration on the phone, a toast along the screen's bottom, and a title and description beside the
// phone. The figures follow on from each other and come from the app's own screens
// (goldStory/goldData); they are illustrative, never live prices or holdings.

import type gsap from 'gsap';
import { BUY_AMOUNT, BUY_GRAMS, GOLD as APP } from '../goldStory/goldData';
import { SCENES } from './goldData';

const inr = (n: number, decimals = 0) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
const SELL_GRAMS = 0.25;

export const STEPS = [
  {
    key: 'buy',
    title: 'Buy gold',
    body: SCENES[1].body,
    // Which of the side panel's cards it lights up (Buy 24K gold)
    card: 0,
    toast: { title: 'Buying 24K gold', line: `${BUY_GRAMS.toFixed(4)} g on its way to your locker` },
  },
  {
    key: 'sell',
    title: 'Sell gold',
    body: SCENES[5].body,
    card: 3, // Sell anytime
    toast: { title: 'Selling your gold', line: `${SELL_GRAMS.toFixed(4)} g sold at ${inr(APP.sellRate, 2)}/g` },
  },
  {
    key: 'withdraw',
    title: 'Withdraw gold',
    body: SCENES[4].body,
    card: 2, // Get it delivered
    toast: { title: 'Preparing your delivery', line: `${APP.coinGrams} g coin · dispatch in ${APP.dispatch}` },
  },
] as const;

// ---- The three scenes: small flat illustrations, played by the scroll ----

// A ₹ coin seen face on, centred on 0,0 (wrapped by its caller, so the scroll can move it freely)
function RupeeCoin({ r = 13 }: { r?: number }) {
  return (
    <g>
      <circle r={r} fill="url(#gs-coin)" stroke="#8C6B20" strokeWidth="1.5" />
      <circle r={r * 0.7} fill="none" stroke="#8C6B20" strokeOpacity="0.55" strokeWidth="1" />
      <text y={r * 0.38} textAnchor="middle" fontSize={r * 1.05} fontWeight="700" fill="#6E5016">
        ₹
      </text>
    </g>
  );
}

// A gold bar's mould: its top and front, dark until the gold fills it from the bottom
function Bar({ x, y, fill, fillHook, topHook }: { x: number; y: number; fill: number; fillHook: string; topHook: string }) {
  const w = 124;
  const h = 50;
  const inset = 13;
  const top = 15;
  const topFace = `M${x + inset} ${y - top} H${x + w - inset} L${x + w} ${y} H${x} Z`;
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + h + 10} rx={w * 0.62} ry="7" fill="#000" fillOpacity="0.5" />
      {/* Top face: dark, then gold once it is full */}
      <path d={topFace} fill="#241a09" stroke="#8C6B20" strokeWidth="1.5" strokeLinejoin="round" />
      <path data-g={topHook} d={topFace} fill="url(#gs-top)" opacity={fill >= 1 ? 1 : 0} />
      {/* Front face, and the gold filling it */}
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#1a1307" />
      <rect data-g={fillHook} x={x} y={y + h * (1 - fill)} width={w} height={h * fill} fill="url(#gs-gold)" />
      <rect x={x} y={y} width={w} height={h} rx="3" fill="none" stroke="#8C6B20" strokeWidth="1.5" />
      <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="3" fill="#6E5016" fillOpacity="0.85">
        24K
      </text>
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="gs-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE9A3" />
        <stop offset="0.5" stopColor="#D4AF37" />
        <stop offset="1" stopColor="#8C6B20" />
      </linearGradient>
      <linearGradient id="gs-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFF4C8" />
        <stop offset="1" stopColor="#F5D76E" />
      </linearGradient>
      <radialGradient id="gs-coin" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#FFE9A3" />
        <stop offset="0.6" stopColor="#D4AF37" />
        <stop offset="1" stopColor="#8C6B20" />
      </radialGradient>
      <linearGradient id="gs-note" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F7EBC3" />
        <stop offset="1" stopColor="#D9C27A" />
      </linearGradient>
      <linearGradient id="gs-box" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#C9962F" />
        <stop offset="1" stopColor="#7a5a1a" />
      </linearGradient>
    </defs>
  );
}

const ARC = { stroke: '#D4AF37', strokeOpacity: 0.35, strokeWidth: 1.5, strokeDasharray: '4 6', fill: 'none' };

// Buy: ₹ coins arc from a stack into a gold bar's mould, which fills with gold
function BuyScene() {
  return (
    <>
      <ellipse cx="90" cy="214" rx="40" ry="7" fill="#000" fillOpacity="0.5" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="90" cy={206 - i * 9} rx="32" ry="10" fill="#8C6B20" />
          <ellipse cx="90" cy={202 - i * 9} rx="32" ry="10" fill="url(#gs-coin)" stroke="#8C6B20" strokeWidth="1" />
        </g>
      ))}
      <text x="90" y="244" textAnchor="middle" fontSize="15" fontWeight="600" fill="#A3A3A3">
        {inr(BUY_AMOUNT)}
      </text>
      <path d="M100 160 Q205 30 300 132" {...ARC} />
      <Bar x={248} y={156} fill={0} fillHook="buy-fill" topHook="buy-top" />
      <text data-g="buy-label" x="310" y="112" textAnchor="middle" fontSize="22" fontWeight="700" fill="#F5D76E" opacity="0">
        +{BUY_GRAMS.toFixed(4)} g
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform="translate(90 168)">
          <g data-g="buy-coin" opacity="0">
            <RupeeCoin />
          </g>
        </g>
      ))}
    </>
  );
}

// Sell: gold coins fly out of a bar, which goes down a little, and land as a stack of ₹ notes
function SellScene() {
  return (
    <>
      <Bar x={40} y={156} fill={1} fillHook="sell-fill" topHook="sell-top" />
      <text x="102" y="244" textAnchor="middle" fontSize="15" fontWeight="600" fill="#A3A3A3">
        −{SELL_GRAMS.toFixed(4)} g
      </text>
      <path d="M128 130 Q230 30 318 140" {...ARC} />
      <ellipse cx="322" cy="214" rx="56" ry="7" fill="#000" fillOpacity="0.5" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(274 ${172 - i * 12})`}>
          <g data-g="sell-note" opacity="0">
            <rect width="96" height="38" rx="5" fill="url(#gs-note)" stroke="#8C6B20" strokeWidth="1.2" />
            <rect x="5" y="5" width="86" height="28" rx="3" fill="none" stroke="#8C6B20" strokeOpacity="0.45" strokeWidth="1" />
            <circle cx="48" cy="19" r="10" fill="none" stroke="#8C6B20" strokeOpacity="0.7" strokeWidth="1.2" />
            <text x="48" y="24" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6E5016">
              ₹
            </text>
          </g>
        </g>
      ))}
      <text data-g="sell-label" x="322" y="112" textAnchor="middle" fontSize="22" fontWeight="700" fill="#F5D76E" opacity="0">
        {inr(SELL_GRAMS * APP.sellRate, 2)}
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform="translate(110 140)">
          <g data-g="sell-coin" opacity="0">
            <circle r="12" fill="url(#gs-coin)" stroke="#8C6B20" strokeWidth="1.5" />
            <circle r="8" fill="none" stroke="#8C6B20" strokeOpacity="0.55" strokeWidth="1" />
          </g>
        </g>
      ))}
    </>
  );
}

// Withdraw: a coin drops into a parcel, the lid goes on, and the parcel travels to the pin
function WithdrawScene() {
  return (
    <>
      {/* The route, and the pin at its end */}
      <path d="M60 222 H330" stroke="#A3A3A3" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
      <g transform="translate(352 158)">
        <path d="M0 52 C-18 30 -24 18 -24 4 A24 24 0 0 1 24 4 C24 18 18 30 0 52 Z" fill="url(#gs-gold)" stroke="#8C6B20" strokeWidth="1.5" />
        <path d="M-9 8 L0 -1 L9 8 V16 H-9 Z" fill="#6E5016" />
      </g>
      <text x="352" y="246" textAnchor="middle" fontSize="13" fontWeight="600" fill="#A3A3A3">
        {APP.pincode}
      </text>
      <text data-g="wd-coin-label" x="110" y="52" textAnchor="middle" fontSize="14" fontWeight="600" fill="#F5D76E">
        {APP.coinGrams} g coin
      </text>

      <g data-g="wd-box">
        <ellipse cx="110" cy="224" rx="50" ry="6" fill="#000" fillOpacity="0.5" />
        {/* Inside and back of the open box */}
        <path d="M70 172 L84 160 H136 L150 172 Z" fill="#3a2a0e" />
        {/* The coin, which drops in */}
        <g transform="translate(110 92)">
          <g data-g="wd-coin">
            <circle r="18" fill="url(#gs-coin)" stroke="#8C6B20" strokeWidth="1.5" />
            <circle r="12.5" fill="none" stroke="#8C6B20" strokeOpacity="0.55" strokeWidth="1" />
            <text y="4" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1" fill="#6E5016">
              24K
            </text>
          </g>
        </g>
        {/* Front of the box, with its tape */}
        <rect x="70" y="172" width="80" height="48" rx="3" fill="url(#gs-box)" stroke="#6E5016" strokeWidth="1.5" />
        <rect x="104" y="172" width="12" height="48" fill="#F5D76E" fillOpacity="0.35" />
        {/* The lid, which comes down onto it */}
        <g data-g="wd-lid" opacity="0">
          <path d="M66 172 L82 156 H138 L154 172 Z" fill="#E6B93F" stroke="#6E5016" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M104 172 L106 156 H114 L116 172 Z" fill="#F5D76E" fillOpacity="0.55" />
        </g>
      </g>
    </>
  );
}

const SCENE_LABELS = ['Rupees turning into 24K gold', 'Gold turning back into rupees', 'A gold coin on its way to your door'];

export function StepScene({ step }: { step: number }) {
  return (
    <svg viewBox="0 0 420 260" className="h-full max-w-full" role="img" aria-label={SCENE_LABELS[step]}>
      {/* The gradients, once on the page: all three scenes use them (they stay in the page, just
          hidden, while the other scenes play) */}
      {step === 0 && <Defs />}
      {step === 0 && <BuyScene />}
      {step === 1 && <SellScene />}
      {step === 2 && <WithdrawScene />}
    </svg>
  );
}

// Each scene's moves, added to the section's scroll timeline from `at` (they take about 0.7 units)
export function animateStepScene(tl: gsap.core.Timeline, scene: HTMLElement, step: number, at: number) {
  const one = (k: string) => scene.querySelector(`[data-g="${k}"]`)!;
  const all = (k: string) => Array.from(scene.querySelectorAll(`[data-g="${k}"]`));
  if (step === 0) {
    // Coins arc over into the mould; it fills; the grams appear
    all('buy-coin').forEach((coin, i) => {
      const t = at + 0.1 + i * 0.1;
      tl.set(coin, { opacity: 1 }, t)
        .to(coin, { keyframes: [{ x: 112, y: -102, ease: 'sine.out' }, { x: 220, y: 0, ease: 'sine.in' }], duration: 0.28 }, t)
        .set(coin, { opacity: 0 }, t + 0.28);
    });
    tl.to(one('buy-fill'), { attr: { y: 156, height: 50 }, duration: 0.35, ease: 'power1.inOut' }, at + 0.32)
      .to(one('buy-top'), { opacity: 1, duration: 0.1 }, at + 0.62)
      .to(one('buy-label'), { opacity: 1, y: -6, duration: 0.15, ease: 'power2.out' }, at + 0.6);
  } else if (step === 1) {
    // Coins fly out of the bar, which goes down; notes stack up; the amount appears
    tl.to(one('sell-fill'), { attr: { y: 168, height: 38 }, duration: 0.4, ease: 'power1.inOut' }, at + 0.1)
      .to(one('sell-top'), { opacity: 0, duration: 0.1 }, at + 0.1);
    all('sell-coin').forEach((coin, i) => {
      const t = at + 0.1 + i * 0.1;
      tl.set(coin, { opacity: 1 }, t)
        .to(coin, { keyframes: [{ x: 110, y: -100, ease: 'sine.out' }, { x: 212, y: 20, ease: 'sine.in' }], duration: 0.26 }, t)
        .set(coin, { opacity: 0 }, t + 0.26);
    });
    tl.fromTo(all('sell-note'), { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.12, stagger: 0.1, ease: 'power2.out', immediateRender: false }, at + 0.34)
      .to(one('sell-label'), { opacity: 1, y: -6, duration: 0.15, ease: 'power2.out' }, at + 0.6);
  } else {
    // The coin drops in, the lid goes on, the parcel sets off for the pin
    tl.to(one('wd-coin'), { y: 92, duration: 0.2, ease: 'power2.in' }, at + 0.1)
      .to(one('wd-coin-label'), { opacity: 0, duration: 0.1 }, at + 0.1)
      .fromTo(one('wd-lid'), { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out', immediateRender: false }, at + 0.3)
      // (stopping just short of the pin)
      .to(one('wd-box'), { x: 158, duration: 0.3, ease: 'power2.inOut' }, at + 0.46);
  }
}

// ---- The toast along the bottom of the screen ----

export function StepToast({ step }: { step: number }) {
  const { title, line } = STEPS[step].toast;
  return (
    <div className="flex w-full items-start gap-[2.5%] rounded-lg lg:rounded-xl bg-[#141414]/95 px-[3%] py-[2.2%] ring-1 ring-white/[0.07] backdrop-blur-sm">
      <svg viewBox="0 0 24 24" className="mt-[0.2em] h-[1.3em] w-[1.3em] shrink-0 text-[10px] md:text-[12px] lg:text-[15px]" aria-hidden="true">
        <path d="M9 2l1.6 5.4L16 9l-5.4 1.6L9 16l-1.6-5.4L2 9l5.4-1.6z" fill="#F5D76E" />
        <path d="M18 13l.9 2.6 2.6.9-2.6.9L18 20l-.9-2.6-2.6-.9 2.6-.9z" fill="#D4AF37" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] md:text-[12px] lg:text-[15px] font-semibold text-[#F5F5F5]">{title}</p>
        <p className="mt-[0.15em] truncate text-[8px] md:text-[10px] lg:text-[13px] text-neutral-400">{line}</p>
        {/* Filled as the step plays */}
        <div className="mt-[0.6em] h-[3px] lg:h-[4px] overflow-hidden rounded-full bg-white/10">
          <div data-g="toast-bar" className="h-full origin-left rounded-full bg-gradient-to-r from-[#8C6B20] to-[#F5D76E]" />
        </div>
      </div>
    </div>
  );
}

// ---- The title and description beside the phone ----

export function StepText({ step }: { step: number }) {
  const { title, body } = STEPS[step];
  return (
    <div>
      {/* Set like the screen's "Start small. Build something golden." headline */}
      <h3 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight leading-[1.1] text-[#F5F5F5]">{title}</h3>
      <p className="mt-2 lg:mt-3 max-w-md text-sm lg:text-lg leading-snug text-neutral-400">{body}</p>
    </div>
  );
}
