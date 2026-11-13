'use client';

import React, { useId, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { IBM_Plex_Mono } from 'next/font/google';
import { Gradient } from '../IntroHero';
import { typeText, type Typing } from '../typewriter';
import { BILL, PEOPLE, inr } from '../splitStory/splitData';
import { Avatar, PERSON_COLORS, PaperBill } from './screens';

const plexMono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin', 'latin-ext'] });

// The Split & Share hero, shot like a film's opening. A dark wooden table under a warm lamp, the
// bill, a coffee and some change on it, and a phone lying face up with the bill split four ways.
// The camera starts low in the middle of the table, out of focus, and cranes up and over onto
// the phone at the top of the table, pulling focus as it goes. Then four hands reach in, three
// holding cards and one a phone, and tap their share in turn: the phone ripples, that friend's
// row turns to Paid, and what's collected counts up to the total. The letterbox opens, the
// headline types itself in, and the camera keeps drifting a little, like it's handheld.

// The table, in its own pixels, and where the phone lies on it
const TABLE_W = 2000;
const TABLE_H = 1300;
const PHONE_X = 1000;
const PHONE_Y = 560;

type Skin = { base: string; light: string; dark: string; nail: string };
const SKINS: Record<string, Skin> = {
  light: { base: '#e3b28f', light: '#f6d3b8', dark: '#b9805e', nail: '#f3d9cc' },
  medium: { base: '#c08156', light: '#dca27a', dark: '#8e5634', nail: '#e6c0aa' },
  brown: { base: '#8c5a3c', light: '#ad7754', dark: '#5f3a24', nail: '#c99c86' },
  deep: { base: '#5b3a28', light: '#7c5139', dark: '#3a2418', nail: '#a77d6a' },
};

// Each hand: whose, the direction it points (degrees; 0 points right), how far from the phone
// it rests, its skin and sleeve, and what it holds
const HANDS = [
  { id: 'you', angle: -32, rest: 250, skin: 'light', sleeve: '#2a2457', holds: 'card' },
  { id: 'atharva', angle: 28, rest: 260, skin: 'brown', sleeve: '#4f1c37', holds: 'card' },
  { id: 'parva', angle: -146, rest: 255, skin: 'medium', sleeve: '#1d364c', holds: 'card' },
  { id: 'ruchi', angle: 152, rest: 270, skin: 'deep', sleeve: '#36363c', holds: 'phone' },
] as const;
const share = (id: string) => PEOPLE.find((p) => p.id === id)!.dutch;

// ---------------------------------------------------------------------------------------------
// The props

function Contactless({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
    </svg>
  );
}

// A bank card: glossy, with a metal chip and a sheen across it
function Card({ color }: { color: string }) {
  return (
    <div
      className="relative h-[108px] w-[172px] overflow-hidden rounded-[11px]"
      style={{
        background: `linear-gradient(125deg, ${color} 0%, color-mix(in srgb, ${color} 70%, #000) 60%, color-mix(in srgb, ${color} 45%, #000) 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.4)',
      }}
    >
      <span className="absolute inset-0" style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.28) 45%, transparent 58%)' }} />
      <span className="absolute -bottom-16 -right-10 h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)' }} />
      {/* The chip */}
      <span
        className="absolute left-4 top-9 h-[22px] w-[30px] rounded-[5px]"
        style={{
          background: 'linear-gradient(135deg,#fbe7a3 0%,#d9b25a 45%,#a9802f 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(90,60,10,0.5)',
          backgroundImage:
            'linear-gradient(90deg, transparent 32%, rgba(90,60,10,0.45) 33%, transparent 35%, transparent 65%, rgba(90,60,10,0.45) 66%, transparent 68%), linear-gradient(0deg, transparent 45%, rgba(90,60,10,0.45) 47%, transparent 50%), linear-gradient(135deg,#fbe7a3 0%,#d9b25a 45%,#a9802f 100%)',
        }}
      />
      <Contactless className="absolute left-[52px] top-[38px] h-[18px] w-[18px] text-white/70" />
      <span className="absolute bottom-3 left-4 font-mono text-[10px] tracking-[0.22em] text-white/80" style={{ textShadow: '0 1px 0 rgba(0,0,0,0.5)' }}>
        •••• 4821
      </span>
      <span className="absolute bottom-2.5 right-3 flex">
        <span className="h-[18px] w-[18px] rounded-full bg-[#eb001b]/85" />
        <span className="-ml-2 h-[18px] w-[18px] rounded-full bg-[#f79e1b]/85" />
      </span>
    </div>
  );
}

// A phone's body: a titanium frame, black glass, the screen inset, and the lamp's glare across it
function PhoneBody({ w, h, radius, children }: { w: number; h: number; radius: number; children: React.ReactNode }) {
  return (
    <div
      className="relative"
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: 'linear-gradient(135deg,#8d8e95 0%,#3a3b40 30%,#1c1c20 55%,#6b6c72 100%)',
        padding: Math.round(w * 0.025),
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
      }}
    >
      <div className="relative h-full w-full overflow-hidden bg-black" style={{ borderRadius: radius - Math.round(w * 0.025), padding: Math.round(w * 0.03) }}>
        <div className="relative h-full w-full overflow-hidden bg-[#0f1013]" style={{ borderRadius: radius - Math.round(w * 0.06) }}>
          {children}
        </div>
        {/* Glare from the lamp */}
        <span className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(118deg, rgba(255,240,220,0.16) 0%, rgba(255,240,220,0.04) 28%, transparent 40%, transparent 75%, rgba(255,255,255,0.05) 100%)' }} />
      </div>
    </div>
  );
}

// The phone on the table: the app, with the bill split four ways
function TablePhone() {
  return (
    <PhoneBody w={250} h={514} radius={42}>
      <div className="flex h-full flex-col px-4 pb-4 pt-3 text-white">
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span>9:41</span>
          <span className="h-[18px] w-[64px] rounded-full bg-black" />
          <span className="flex gap-0.5">
            <span className="h-2 w-3 rounded-sm bg-white/80" />
          </span>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold">
          <span className="text-[#8f80ff]">‹</span> Split Bill
        </p>
        <div className="mt-2.5 rounded-xl px-3 py-2.5" style={{ background: 'linear-gradient(140deg,#6E5BFF 0%,#8B5CF6 60%,#E86AB4 130%)' }}>
          <p className="text-[9px] font-semibold tracking-[0.15em] text-white/80">{BILL.splitName.toUpperCase()} · TOTAL</p>
          <p className="text-[24px] font-bold leading-tight">{inr(BILL.total, 0)}</p>
          <p className="text-[9px] text-white/80">4 people · Dutch</p>
        </div>
        <div className="mt-2.5 space-y-1.5">
          {HANDS.map((hand) => {
            const p = PEOPLE.find((x) => x.id === hand.id)!;
            return (
              <div key={hand.id} data-c="row" className="flex items-center gap-2 rounded-lg border border-transparent bg-[#1c1d22] px-2 py-1.5">
                <Avatar id={hand.id} size={22} />
                <span className="flex-1 text-[11.5px] font-medium">{p.name}</span>
                <span className="text-[11.5px] font-semibold tabular-nums">{inr(p.dutch, 0)}</span>
                <span data-c="paid" className="rounded-full bg-[#34d399] px-1.5 text-[9px] font-bold text-[#062a1c]">
                  ✓
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-auto">
          <div className="flex items-baseline justify-between text-[11px] text-[#85868c]">
            <span>Collected</span>
            <span data-c="collected" className="text-[15px] font-bold tabular-nums text-white">
              ₹0
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div data-c="bar" className="h-full w-full rounded-full bg-[linear-gradient(90deg,#6E5BFF,#E86AB4,#34d399)]" />
          </div>
          <div className="mt-3 rounded-full bg-[#6E5BFF] py-2 text-center text-[11px] font-semibold">Tap to pay your share</div>
        </div>
      </div>
    </PhoneBody>
  );
}

// The phone in Ruchi's hand, with the app's UPI screen
function HandPhone() {
  return (
    <div style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }} className="-my-[46px]">
      <PhoneBody w={98} h={196} radius={18}>
        <div className="flex h-full flex-col p-2 text-white">
          <div className="rounded-md p-1.5" style={{ background: 'linear-gradient(140deg,#6E5BFF,#E86AB4)' }}>
            <p className="text-[6px] font-semibold tracking-wider text-white/80">PAY VIA UPI</p>
            <p className="text-[13px] font-bold">{inr(share('ruchi'), 0)}</p>
          </div>
          <span className="mt-1.5 block h-1.5 w-full rounded-full bg-white/10" />
          <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-white/10" />
          <span className="mt-auto rounded-md bg-[#6E5BFF] py-1 text-center text-[7px] font-bold">Pay</span>
        </div>
      </PhoneBody>
    </div>
  );
}

// A cup of coffee, seen from above
function Coffee() {
  return (
    <div className="relative h-[200px] w-[260px]">
      <div className="absolute left-0 top-0 h-[200px] w-[200px] rounded-full" style={{ background: 'radial-gradient(circle at 42% 38%, #fbfaf6 0%, #e7e4dc 55%, #b9b5ab 100%)', boxShadow: '18px 24px 40px rgba(0,0,0,0.55)' }} />
      <div className="absolute left-[150px] top-[84px] h-[34px] w-[100px] rounded-full" style={{ background: 'linear-gradient(180deg,#f5f3ee,#c9c5bb)', boxShadow: '10px 14px 18px rgba(0,0,0,0.4)' }} />
      <div className="absolute left-[30px] top-[30px] h-[140px] w-[140px] rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #ffffff 0%, #ece9e2 60%, #c7c2b8 100%)' }} />
      <div className="absolute left-[42px] top-[42px] h-[116px] w-[116px] rounded-full" style={{ background: 'radial-gradient(circle at 45% 40%, #6a3d1f 0%, #3b1f0e 60%, #2a1509 100%)', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.6)' }} />
      <div className="absolute left-[56px] top-[54px] h-[86px] w-[86px] rounded-full opacity-70" style={{ background: 'radial-gradient(circle at 40% 40%, rgba(214,160,104,0.85) 0%, rgba(160,100,50,0.5) 45%, transparent 70%)' }} />
      <div className="absolute left-[58px] top-[52px] h-[20px] w-[50px] rotate-[-25deg] rounded-full bg-white/25 blur-[3px]" />
    </div>
  );
}

function Coin({ size = 46 }: { size?: number }) {
  return (
    <span
      className="block rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 35% 30%, #fff4c9 0%, #e9c565 40%, #b08427 80%, #8a6418 100%)',
        boxShadow: 'inset 0 0 0 3px rgba(140,100,20,0.6), 6px 8px 12px rgba(0,0,0,0.55)',
      }}
    >
      <span className="flex h-full w-full items-center justify-center text-[18px] font-extrabold text-[#8a6418]/80">₹</span>
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// A hand, seen from above, reaching right and pinching what it holds by its back edge: the index
// finger lies along the top of it, tip pressing down; the other three are curled over its back
// edge, so mostly their knuckles show; the thumb is underneath, pinching from below. Drawn in
// layers so what's held sits between the thumb (under) and the fingers (over), and every finger
// casts a soft shadow onto it. With `shadow`, it's the same shape in black, for the table.

const HW = 380; // the drawing's size
const HH = 170;

// The fingers that sit on top: the index stretched out, the rest curled
const FINGERS = {
  index: 'M300 40 C 328 38, 360 40, 390 46 C 403 49, 405 67, 392 70 C 362 72, 330 68, 300 64 Z',
  middle: 'M302 64 C 322 64, 340 66, 351 70 C 361 75, 360 88, 349 90 C 335 91, 318 90, 302 88 Z',
  ring: 'M302 88 C 320 88, 334 90, 344 94 C 352 98, 351 109, 342 111 C 330 112, 316 111, 302 110 Z',
  pinky: 'M300 110 C 314 110, 325 112, 333 116 C 340 119, 339 129, 331 130 C 321 131, 310 130, 298 127 Z',
};
// Where each curled finger folds under (its far end), shaded darker
const FOLDS = [
  { x: 341, y: 68, w: 18, h: 22 },
  { x: 334, y: 91, w: 16, h: 20 },
  { x: 325, y: 113, w: 13, h: 17 },
];

function HandLayers({ skin, sleeve, shadow, part }: { skin: Skin; sleeve: string; shadow?: boolean; part: 'under' | 'over' }) {
  const uid = useId().replace(/:/g, '');
  const ink = shadow ? '#000' : undefined;
  const skinFill = ink ?? `url(#skin-${uid})`;
  const fingerFill = ink ?? `url(#finger-${uid})`;
  return (
    <svg viewBox={`0 0 ${HW} ${HH}`} width={HW} height={HH} className="absolute left-0 top-0 overflow-visible" aria-hidden="true">
      {!shadow && (
        <defs>
          <linearGradient id={`sleeve-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={sleeve} />
            <stop offset="0.35" stopColor={`color-mix(in srgb, ${sleeve} 72%, #fff)`} />
            <stop offset="0.7" stopColor={sleeve} />
            <stop offset="1" stopColor={`color-mix(in srgb, ${sleeve} 50%, #000)`} />
          </linearGradient>
          <radialGradient id={`skin-${uid}`} cx="0.62" cy="0.32" r="0.85">
            <stop offset="0" stopColor={skin.light} />
            <stop offset="0.55" stopColor={skin.base} />
            <stop offset="1" stopColor={skin.dark} />
          </radialGradient>
          <linearGradient id={`finger-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={skin.light} />
            <stop offset="0.45" stopColor={skin.base} />
            <stop offset="1" stopColor={skin.dark} />
          </linearGradient>
          <radialGradient id={`flush-${uid}`}>
            <stop offset="0" stopColor="#d9665a" stopOpacity="0.28" />
            <stop offset="1" stopColor="#d9665a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`fold-${uid}`} x1="0" x2="1">
            <stop offset="0" stopColor={skin.dark} stopOpacity="0" />
            <stop offset="1" stopColor={skin.dark} stopOpacity="0.75" />
          </linearGradient>
          <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>
      )}
      {part === 'under' ? (
        <>
          {/* The sleeve, with folds in the fabric */}
          <path d="M-260 34 C -80 28, 90 26, 196 38 L 198 132 C 90 142, -80 140, -260 136 Z" fill={ink ?? `url(#sleeve-${uid})`} />
          {!shadow && (
            <g fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="3" strokeLinecap="round">
              <path d="M40 46 C 70 62, 90 64, 120 52" />
              <path d="M90 118 C 120 104, 140 104, 170 116" />
              <path d="M-60 60 C -30 74, -10 74, 20 62" />
              <path d="M150 44 C 165 70, 165 100, 152 124" stroke="rgba(0,0,0,0.18)" />
            </g>
          )}
          {/* The cuff */}
          <rect x="188" y="32" width="26" height="106" rx="12" fill={ink ?? `color-mix(in srgb, ${sleeve} 80%, #000)`} />
          {/* The thumb, reaching under what's held to pinch it from below */}
          <path d="M246 116 C 270 120, 298 122, 326 120 C 344 118, 358 120, 360 128 C 360 136, 344 140, 322 141 C 296 142, 268 138, 244 130 Z" fill={skinFill} />
          {!shadow && (
            <>
              <path d="M262 132 C 286 136, 312 137, 334 136" fill="none" stroke={skin.dark} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
              <path d="M300 124 q 4 7 0 14" fill="none" stroke={skin.dark} strokeOpacity="0.4" strokeWidth="1.6" />
            </>
          )}
        </>
      ) : (
        <>
          {/* The fingers' shadows, cast onto what's held */}
          {!shadow && (
            <g filter={`url(#soft-${uid})`} fill="#000" opacity="0.45" transform="translate(4 7)">
              {Object.values(FINGERS).map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
          )}
          {/* The wrist and the back of the hand */}
          <path d="M204 50 C 232 48, 258 42, 284 39 C 300 38, 312 41, 318 50 L 320 122 C 314 130, 298 134, 282 134 C 258 133, 232 126, 204 122 Z" fill={skinFill} />
          {!shadow && (
            <>
              {/* Tendons running to each knuckle, and the wrist bone */}
              <g fill="none" stroke={skin.dark} strokeOpacity="0.28" strokeWidth="2.4" strokeLinecap="round">
                <path d="M236 64 C 262 58, 286 54, 310 52" />
                <path d="M236 82 C 262 78, 288 76, 312 76" />
                <path d="M236 100 C 262 98, 288 98, 312 99" />
                <path d="M238 116 C 262 116, 284 117, 306 119" />
              </g>
              <ellipse cx="222" cy="58" rx="9" ry="6" fill={skin.light} opacity="0.35" />
            </>
          )}
          {/* The four fingers: the index along the top, the others curled over the edge */}
          {Object.entries(FINGERS).map(([name, d]) => (
            <path key={name} d={d} fill={fingerFill} />
          ))}
          {!shadow && (
            <>
              {/* Where the curled fingers fold under */}
              {FOLDS.map((f) => (
                <rect key={f.y} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.h / 2} fill={`url(#fold-${uid})`} />
              ))}
              {/* The gaps between the fingers */}
              <g fill="none" stroke={skin.dark} strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round">
                <path d="M304 64 C 324 65, 340 67, 350 71" />
                <path d="M304 88 C 320 89, 334 91, 343 95" />
                <path d="M302 110 C 315 111, 325 113, 332 117" />
              </g>
              {/* Knuckles, catching the lamp, and a little warmth in the skin */}
              {[
                [308, 51, 11],
                [312, 76, 11],
                [311, 99, 10],
                [307, 119, 9],
              ].map(([x, y, r]) => (
                <g key={y}>
                  <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill={skin.light} opacity="0.5" />
                  <ellipse cx={x + 4} cy={y + 2} rx={r * 1.2} ry={r} fill={`url(#flush-${uid})`} />
                </g>
              ))}
              {/* The index finger's joints and nail, pressing down on the card */}
              <g fill="none" stroke={skin.dark} strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round">
                <path d="M336 43 q 3 12 0 24" />
                <path d="M339 45 q 2 10 0 20" strokeOpacity="0.25" />
                <path d="M366 45 q 3 11 0 22" />
              </g>
              <path d="M378 48 C 388 47, 396 50, 398 57 C 398 64, 390 67, 379 65 C 375 60, 375 53, 378 48 Z" fill={skin.nail} />
              <path d="M380 51 C 386 50, 391 52, 393 55" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M379 49 q -3 8 0 15" fill="none" stroke={skin.dark} strokeOpacity="0.3" strokeWidth="1.2" />
              {/* A touch of the lamp along the top of the index finger */}
              <path d="M312 43 C 336 41, 362 42, 384 47" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </svg>
  );
}

function Hand({ hand, shadow }: { hand: (typeof HANDS)[number]; shadow?: boolean }) {
  const skin = SKINS[hand.skin];
  return (
    <div className="relative" style={{ width: HW + 160, height: HH }}>
      <HandLayers skin={skin} sleeve={hand.sleeve} shadow={shadow} part="under" />
      {/* What it holds: its back edge tucked under the curled fingers, the index along its top */}
      <div className="absolute left-[322px] top-[30px]" style={{ filter: shadow ? 'brightness(0)' : undefined, transform: 'rotate(-3deg)', transformOrigin: '0% 30%' }}>
        {hand.holds === 'card' ? <Card color={PERSON_COLORS[hand.id]} /> : <HandPhone />}
      </div>
      <HandLayers skin={skin} sleeve={hand.sleeve} shadow={shadow} part="over" />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

export default function CinemaHero() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-c="${k}"]`));
    const [lens] = q('lens');
    const [view] = q('view');
    const [table] = q('table');
    const [lamp] = q('lamp');
    const reaches = q('reach');
    const lifts = q('lift');
    const shadows = q('shadow');
    const rows = q('row');
    const paids = q('paid');
    const ripples = q('ripple');
    const [collectedEl] = q('collected');
    const [bar] = q('bar');
    const [text] = q('text');
    const pills = q('pill');
    const bars = q('letterbox');

    // The final framing: looking down over the near edge of the table, the phone a little below
    // the middle. Scaled with the screen.
    const frameScale = () => Math.min(1.1, Math.max(0.62, view.clientWidth / 1500, view.clientHeight / 900));
    const FINAL = { rotationX: 44, rotationZ: 0, x: 0, y: () => view.clientHeight * 0.2, z: 0, scale: () => frameScale() * 0.8 };
    // Where it starts: low, near table level, in the middle of the table, turned a little
    const START = { rotationX: 79, rotationZ: -9, x: 0, y: () => view.clientHeight * 0.32, z: 380, scale: frameScale };

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      gsap.to(view, { rotationY: (((e.clientX - r.left) / r.width) * 2 - 1) * 2.5, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
    };

    const ctx = gsap.context(() => {
      gsap.set(table, { transformOrigin: `${PHONE_X}px ${PHONE_Y}px`, xPercent: 0 });
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(table, FINAL);
        gsap.set(paids, { autoAlpha: 1 });
        gsap.set(bar, { scaleX: 1 });
        gsap.set(bars, { scaleY: 0 });
        gsap.set([text, ...pills], { autoAlpha: 1 });
        collectedEl.textContent = inr(BILL.total, 0);
        return;
      }
      gsap.set(table, START);
      gsap.set(lens, { filter: 'blur(14px) brightness(0.25)' });
      gsap.set(lamp, { opacity: 0 });
      gsap.set(text, { autoAlpha: 0 });
      gsap.set(pills, { autoAlpha: 0, y: 8 });
      gsap.set(reaches, { x: -760 });
      gsap.set(lifts, { z: 70 });
      gsap.set(shadows, { x: 34, y: 46, opacity: 0.32, filter: 'blur(18px)' });
      gsap.set(paids, { autoAlpha: 0, scale: 0.6 });
      gsap.set(ripples, { scale: 0.3, autoAlpha: 0 });
      gsap.set(bar, { scaleX: 0, transformOrigin: 'left' });

      const money = { v: 0 };
      const typings: Typing[] = [];
      const tl = gsap.timeline({
        delay: 0.2,
        onUpdate: () => {
          collectedEl.textContent = inr(money.v, 0);
        },
      });
      // The lamp comes up, then the camera cranes up and over to the phone, pulling focus
      tl.to(lamp, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0);
      tl.to(lens, { filter: 'blur(9px) brightness(0.7)', duration: 1, ease: 'power1.out' }, 0);
      tl.to(table, { ...FINAL, duration: 3.1, ease: 'power3.inOut' }, 0.5);
      tl.to(lens, { filter: 'blur(0px) brightness(1)', duration: 1.6, ease: 'power2.inOut' }, 1.9);
      // The hands reach in, hovering over the table
      HANDS.forEach((_, i) => tl.to(reaches[i], { x: 0, duration: 1.15, ease: 'power3.out' }, 3.1 + i * 0.16));
      // And tap, one after another: down to the glass and back up
      HANDS.forEach((hand, i) => {
        const at = 4.5 + i * 0.62;
        tl.to(reaches[i], { x: 58, duration: 0.24, ease: 'power2.in' }, at);
        tl.to(lifts[i], { z: 8, duration: 0.24, ease: 'power2.in' }, at);
        tl.to(shadows[i], { x: 8, y: 10, opacity: 0.62, filter: 'blur(6px)', duration: 0.24, ease: 'power2.in' }, at);
        tl.fromTo(ripples, { scale: 0.3, autoAlpha: 0.9 }, { scale: 2.6, autoAlpha: 0, duration: 0.7, ease: 'power2.out', stagger: 0.1, immediateRender: false }, at + 0.24);
        tl.to(paids[i], { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' }, at + 0.28);
        tl.to(rows[i], { backgroundColor: `${PERSON_COLORS[hand.id]}26`, borderColor: `${PERSON_COLORS[hand.id]}99`, duration: 0.2 }, at + 0.28);
        tl.to(money, { v: `+=${share(hand.id)}`, duration: 0.35, ease: 'power2.out' }, at + 0.28);
        tl.to(bar, { scaleX: (i + 1) / HANDS.length, duration: 0.35, ease: 'power2.out' }, at + 0.28);
        tl.to(reaches[i], { x: 0, duration: 0.55, ease: 'power2.out' }, at + 0.3);
        tl.to(lifts[i], { z: 70, duration: 0.55, ease: 'power2.out' }, at + 0.3);
        tl.to(shadows[i], { x: 34, y: 46, opacity: 0.32, filter: 'blur(18px)', duration: 0.55, ease: 'power2.out' }, at + 0.3);
      });
      tl.set(money, { v: BILL.total }, '>');
      // The letterbox opens, and the words come up, as the hands reach in
      tl.to(bars, { scaleY: 0, duration: 1, ease: 'power3.inOut' }, 3.0);
      tl.add(() => {
        gsap.set(text, { autoAlpha: 1 });
        let delay = 0;
        (['eyebrow', 'title', 'body'] as const).forEach((k, i) => {
          const el = q(k)[0];
          const ms = [22, 44, 12][i];
          typings.push(typeText(el, { msPerChar: ms, delay, keepCaret: k === 'body' }));
          delay += (el.textContent?.length ?? 0) * ms + 160;
        });
        typings[typings.length - 1].done.then(() => gsap.to(pills, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08 }));
      }, 3.1);
      // Then it stays alive: the camera drifts like it's handheld, the hands shift a little
      tl.add(() => {
        gsap.to(table, { rotationX: '+=1.6', rotationZ: '+=0.8', duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        reaches.forEach((r, i) => gsap.to(r, { x: 10 + i * 3, rotation: i % 2 ? 1.2 : -1.2, duration: 2.4 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
        if (window.matchMedia('(pointer: fine)').matches) section.addEventListener('pointermove', onMove);
      });
      return () => typings.forEach((t) => t.cancel());
    }, section);

    const onResize = () => gsap.set(table, { scale: frameScale() * 0.8 });
    window.addEventListener('resize', onResize);
    return () => {
      ctx.revert();
      window.removeEventListener('resize', onResize);
      section.removeEventListener('pointermove', onMove);
    };
  }, []);

  const props: { el: React.ReactNode; x: number; y: number; r: number; z?: number }[] = [
    { el: <Coffee />, x: 420, y: 330, r: -12 },
    { el: <PaperBill mono={plexMono.style.fontFamily} rows="cine" scale={1.05} />, x: 1290, y: 300, r: 14, z: 1 },
    { el: <Coin />, x: 1280, y: 820, r: 0 },
    { el: <Coin size={40} />, x: 1336, y: 846, r: 20 },
    { el: <Coin size={42} />, x: 650, y: 860, r: 0 },
  ];

  return (
    <section ref={sectionRef} aria-label="Split and Share" className="relative h-[calc(100svh-72px)] min-h-[560px] w-full overflow-hidden bg-black">
      {/* The shot */}
      <div data-c="lens" className="absolute inset-0">
        <div data-c="view" className="absolute inset-0 [perspective:1300px]" style={{ perspectiveOrigin: '50% 30%' }}>
          <div className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]">
            <div data-c="table" className="absolute [transform-style:preserve-3d]" style={{ left: -PHONE_X, top: -PHONE_Y, width: TABLE_W, height: TABLE_H }}>
              {/* The wood: dark walnut, its grain, and the lamp's pool of light */}
              <div className="absolute inset-0 rounded-[40px]" style={{ background: 'linear-gradient(90deg,#1a120d 0%,#24180f 20%,#1c130d 45%,#291b11 70%,#1a110b 100%)' }} />
              <svg className="absolute inset-0 h-full w-full rounded-[40px] opacity-70 mix-blend-overlay" aria-hidden="true">
                <filter id="cine-grain">
                  <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.09" numOctaves="4" seed="7" />
                  <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.36  0 0 0 0 0.2  0 0 0 0.9 0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#cine-grain)" />
              </svg>
              <div className="absolute inset-0 rounded-[40px]" style={{ background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.0) 0px, rgba(0,0,0,0.0) 246px, rgba(0,0,0,0.55) 248px, rgba(0,0,0,0) 252px)' }} />
              <div data-c="lamp" className="absolute inset-0 rounded-[40px]" style={{ background: `radial-gradient(ellipse 760px 560px at ${PHONE_X}px ${PHONE_Y + 40}px, rgba(255,196,130,0.34), rgba(255,170,90,0.08) 55%, transparent 75%)` }} />
              <div className="absolute inset-0 rounded-[40px]" style={{ background: `radial-gradient(ellipse 1100px 700px at ${PHONE_X}px ${PHONE_Y}px, transparent 40%, rgba(0,0,0,0.75) 100%)` }} />
              <div className="absolute inset-0 rounded-[40px] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.04)]" />

              {/* What's on the table */}
              {props.map((p, i) => (
                <div key={i} className="absolute" style={{ left: p.x, top: p.y, transform: `translate(-50%,-50%) rotate(${p.r}deg) translateZ(${p.z ?? 0}px)` }}>
                  <div style={{ filter: 'drop-shadow(10px 16px 14px rgba(0,0,0,0.6)) brightness(0.92) sepia(0.12)' }}>{p.el}</div>
                </div>
              ))}

              {/* The phone, lying face up */}
              <div className="absolute" style={{ left: PHONE_X, top: PHONE_Y, transform: 'translate(-50%,-50%) rotate(-4deg) translateZ(2px)' }}>
                <div className="absolute inset-0 translate-x-[16px] translate-y-[22px] rounded-[42px] bg-black/70 blur-[18px]" />
                <div className="relative">
                  <TablePhone />
                  <div className="pointer-events-none absolute left-1/2 top-[44%] h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2">
                    {[0, 1, 2].map((k) => (
                      <span key={k} data-c="ripple" className="absolute inset-0 rounded-full border-2 border-[#a99dff]" style={{ boxShadow: '0 0 24px rgba(143,128,255,0.6)' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Everyone reaching in, each with their shadow on the table */}
              {HANDS.map((hand) => (
                <div key={hand.id} className="absolute [transform-style:preserve-3d]" style={{ left: PHONE_X, top: PHONE_Y, transform: `rotate(${hand.angle}deg)` }}>
                  <div data-c="reach" className="absolute [transform-style:preserve-3d]" style={{ left: -(hand.rest + HW + 120), top: -HH / 2 }}>
                    <div data-c="shadow" className="absolute left-0 top-0 opacity-30">
                      <Hand hand={hand} shadow />
                    </div>
                    <div data-c="lift" className="relative" style={{ transform: 'translateZ(70px)' }}>
                      <Hand hand={hand} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* The film: vignette, grain, and the letterbox */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 75% 70% at 50% 55%, transparent 45%, rgba(0,0,0,0.85) 100%)' }} />
      <div className="cine-grain pointer-events-none absolute -inset-[50%] opacity-[0.07] mix-blend-overlay" />
      {/* The letterbox: soft-edged, so the shot fades into it rather than being cut off */}
      <div data-c="letterbox" className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[16%] origin-top" style={{ background: 'linear-gradient(180deg, #000 0%, #000 55%, rgba(0,0,0,0) 100%)' }} />
      <div data-c="letterbox" className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[18%] origin-bottom" style={{ background: 'linear-gradient(0deg, #000 0%, #000 50%, rgba(0,0,0,0) 100%)' }} />
      {/* And the table melts into the dark at the bottom, into the section that follows */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[34%]" style={{ background: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0) 100%)' }} />

      {/* The words, typed in over the top of the shot */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[48%] bg-gradient-to-b from-black via-black/80 to-transparent" />
      <div data-c="text" className="absolute inset-x-0 top-0 z-20 mx-auto max-w-3xl px-4 pt-8 text-center sm:pt-12" style={{ visibility: 'hidden' }}>
        <p data-c="eyebrow" className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Split &amp; Share
        </p>
        <h1 data-c="title" className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[64px]" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
          Split any bill. <Gradient>Settle</Gradient> it in seconds.
        </h1>
        <p data-c="body" className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-300 sm:text-lg">
          Split equally or go Dutch. Snap the bill, tag who had what, and everyone pays just their share, right down to the paisa.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[
            ['Equal', 'or Dutch'],
            ['OCR', 'reads the bill'],
            ['UPI', 'settles it'],
          ].map(([a, b]) => (
            <span key={a} data-c="pill" className="flex items-baseline gap-1.5 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[13px] backdrop-blur">
              <b className="font-semibold text-white">{a}</b>
              <span className="text-neutral-300">{b}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
