'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { Gradient } from '../IntroHero';
import { glideBetweenLabels, pinned, usePointerVars } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';

// Bills & Subscriptions, as a city. This month's calendar lies flat on the screen, then tilts
// back into 3D, and every bill rises off its due date as a glowing tower: taller for bigger
// bills, the brand's mark on its roof, a little sign above it with its name and amount. Then, one
// step per scroll, a "today" marker walks through the month while an app panel beside it shows
// the same thing as the app does:
//   1. Every bill, on its date: the list fills in, and this month's total counts up
//   2. What's paid: the marker sweeps up to today and every tower behind it turns green
//   3. What's overdue: the one that slipped turns red and starts to pulse, with an alert
//   4. What's coming up: the rest glow amber, and a reminder drops in before the next one's due
//   5. Overdue? Sorted in a tap: the pay sheet comes up, and the red tower turns green
//   6. Your month, in one number: the camera swings round the city, the summary comes up
// The month is this real month; all figures are illustrative.

type Status = 'paid' | 'overdue' | 'pending';
export const SUBS = [
  { key: 'netflix', name: 'Netflix', plan: 'Premium · monthly', mark: 'N', amount: 649, offset: -8, status: 'paid', color: '#E50914', ink: '#FFFFFF', cat: 'Streaming' },
  { key: 'prime', name: 'Amazon Prime', plan: 'Annual plan', mark: 'prime', amount: 1499, offset: -5, status: 'paid', color: '#00A8E1', ink: '#FFFFFF', cat: 'Shopping' },
  { key: 'power', name: 'Electricity', plan: 'BESCOM · monthly', mark: '⚡', amount: 1840, offset: -2, status: 'overdue', color: '#F5B400', ink: '#1A1A1A', cat: 'Utilities' },
  { key: 'spotify', name: 'Spotify', plan: 'Individual · monthly', mark: '♫', amount: 119, offset: 3, status: 'pending', color: '#1DB954', ink: '#0B1A10', cat: 'Music' },
  { key: 'youtube', name: 'YouTube Premium', plan: 'Family · monthly', mark: '▶', amount: 299, offset: 7, status: 'pending', color: '#FF0033', ink: '#FFFFFF', cat: 'Streaming' },
  { key: 'hotstar', name: 'Disney+ Hotstar', plan: 'Super · quarterly', mark: 'D+', amount: 899, offset: 12, status: 'pending', color: '#1F3FB8', ink: '#FFFFFF', cat: 'Streaming' },
] as const;
export const TOTAL = SUBS.reduce((t, s) => t + s.amount, 0);
const PAID_TOTAL = SUBS.filter((s) => s.status === 'paid').reduce((t, s) => t + s.amount, 0);
const OVERDUE = SUBS.find((s) => s.status === 'overdue')!;
const NEXT = SUBS.find((s) => s.status === 'pending')!;

export const STATUS_COLOR: Record<Status | 'none', string> = { none: '#6E5BFF', paid: '#22C55E', overdue: '#EF4444', pending: '#EAB308' };
export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TILE = 84;
const GAP = 8;
const PAD = 22;
const PILLAR = 50;
const heightOf = (amount: number) => Math.round(36 + Math.sqrt(amount) * 3.4);
// The city's pose: tipped back, turned a little, like looking across it from a corner
const POSE = { rotationX: 56, rotationZ: -38 };

const CAPTIONS = [
  { eyebrow: 'Bills & Subscriptions', title: 'Your month, at a glance.', body: 'Every bill and subscription on one calendar, standing on the day it’s due.' },
  { eyebrow: '01 · On one calendar', title: 'Every bill, on its date.', body: 'Netflix, rent, electricity, that annual plan you forgot about. All of it, in one place.' },
  { eyebrow: '02 · Paid', title: 'What’s paid.', body: 'Ticked off in green, on the day you paid it.' },
  { eyebrow: '03 · Overdue', title: 'What’s overdue.', body: 'Flagged in red the moment a date slips by.' },
  { eyebrow: '04 · Coming up', title: 'What’s coming up.', body: 'Pending in amber, with a nudge before each one is due.' },
  { eyebrow: '05 · Pay', title: 'Overdue? Sorted in a tap.', body: 'Pay it right from the alert, and it turns green.' },
  { eyebrow: '06 · Your month', title: 'Your month, in one number.', body: 'What’s gone out, what’s still to come, and never a late fee again.' },
];
const STEPS = CAPTIONS.length - 1;

function buildMonth(now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
  const rows = Math.ceil((lead + days) / 7);
  // "Today", kept far enough from either end that every bill falls inside the month
  const today = Math.min(days - 13, Math.max(9, now.getDate()));
  const cell = (day: number) => {
    const i = lead + day - 1;
    return { col: i % 7, row: Math.floor(i / 7) };
  };
  const at = (day: number) => {
    const { col, row } = cell(day);
    return { x: PAD + col * (TILE + GAP) + TILE / 2, y: PAD + 30 + row * (TILE + GAP) + TILE / 2 };
  };
  const name = now.toLocaleString('en-IN', { month: 'long' });
  const subs = SUBS.map((s) => ({ ...s, day: today + s.offset }));
  return { year, month, days, lead, rows, today, at, name, subs, width: PAD * 2 + 7 * TILE + 6 * GAP, height: PAD * 2 + 30 + rows * TILE + (rows - 1) * GAP };
}
type Month = ReturnType<typeof buildMonth>;
type PlacedSub = Month['subs'][number];

export function Mark({ s, size = 34 }: { s: (typeof SUBS)[number]; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[10px] font-extrabold leading-none" style={{ width: size, height: size, background: s.color, color: s.ink, fontSize: size * (s.mark.length > 2 ? 0.28 : s.mark.length > 1 ? 0.36 : 0.5) }}>
      {s.mark}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// A tower: a box standing on its date, coloured by its status (the --c on it), its roof the brand's
// mark, and a sign standing above it. It rises with --rise, 0 to 1.

function Tower({ s, x, y, mon }: { s: PlacedSub; x: number; y: number; mon: string }) {
  const H = heightOf(s.amount);
  const w = PILLAR;
  // Dark glass, lit from inside by rows of windows in the tower's colour, its edges glowing
  const face = (shade: number): React.CSSProperties => ({
    backgroundColor: `color-mix(in srgb, var(--c) ${Math.round(14 * shade)}%, #0b0b12)`,
    backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--c) ${Math.round(70 + 30 * shade)}%, #fff) 0 1.6px, transparent 2.4px), linear-gradient(0deg, rgba(0,0,0,0.55), rgba(255,255,255,${(0.1 * shade).toFixed(2)}))`,
    backgroundSize: '10px 11px, 100% 100%',
    backgroundPosition: '5px 4px, 0 0',
    boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, var(--c) ${Math.round(60 + 40 * shade)}%, transparent), inset 0 0 18px color-mix(in srgb, var(--c) 35%, transparent)`,
  });
  return (
    <div data-b="tower" data-key={s.key} className="absolute [transform-style:preserve-3d]" style={{ left: x, top: y, transform: 'scale3d(1,1,var(--rise,0.001))', ['--c' as string]: STATUS_COLOR.none, ['--rise' as string]: 0.001 }}>
      {/* The light it throws on the tiles round it */}
      <div className="absolute rounded-full blur-2xl" style={{ left: -w * 1.1, top: -w * 1.1, width: w * 2.2, height: w * 2.2, background: 'var(--c)', opacity: 0.5 }} />
      <div className="absolute rounded-[10px]" style={{ left: -w / 2 - 6, top: -w / 2 - 6, width: w + 12, height: w + 12, boxShadow: '0 0 0 2px var(--c), 0 0 22px var(--c)', opacity: 0.8 }} />
      {/* The four sides */}
      <div className="absolute" style={{ left: -w / 2, top: 0, width: w, height: H, transformOrigin: '50% 0', transform: `translateY(${w / 2}px) rotateX(90deg)`, ...face(1) }} />
      <div className="absolute" style={{ left: -w / 2, top: 0, width: w, height: H, transformOrigin: '50% 0', transform: `translateY(${-w / 2}px) rotateX(90deg)`, ...face(0.5) }} />
      <div className="absolute" style={{ left: 0, top: -w / 2, width: H, height: w, transformOrigin: '0 50%', transform: `translateX(${w / 2}px) rotateY(-90deg)`, ...face(0.8) }} />
      <div className="absolute" style={{ left: 0, top: -w / 2, width: H, height: w, transformOrigin: '0 50%', transform: `translateX(${-w / 2}px) rotateY(-90deg)`, ...face(0.4) }} />
      {/* The roof: lit up, the brand's mark on it */}
      <div className="absolute flex items-center justify-center rounded-[8px]" style={{ left: -w / 2, top: -w / 2, width: w, height: w, transform: `translateZ(${H}px)`, background: 'radial-gradient(circle, color-mix(in srgb, var(--c) 70%, #fff) 0%, var(--c) 70%)', boxShadow: '0 0 34px var(--c), 0 0 0 1.5px rgba(255,255,255,0.5)' }}>
        <Mark s={s} size={32} />
      </div>
      {/* The pulse round an overdue tower */}
      {s.status === 'overdue' && <div data-b="halo" className="bl-halo absolute rounded-full border-2 border-[#EF4444] opacity-0" style={{ left: -w, top: -w, width: w * 2, height: w * 2 }} />}
      {/* Standing up off the roof, turned to face you: a beam of light, its sign at the top, and
          (for the overdue one) the sparks when it's paid */}
      <div className="absolute [transform-style:preserve-3d]" style={{ left: 0, top: 0, transform: `translateZ(${H}px)` }}>
        <div className="absolute bottom-0 left-0" style={{ transformOrigin: '0 100%', transform: `rotateZ(${-POSE.rotationZ}deg) rotateX(-90deg) translateX(-50%)` }}>
          <div className="flex flex-col items-center">
            <div data-b="sign" className="whitespace-nowrap rounded-xl border border-white/20 bg-[#0b0b10]/85 px-3 py-1.5 text-center shadow-[0_10px_24px_rgba(0,0,0,0.6)] backdrop-blur" style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--c) 50%, transparent), 0 10px 24px rgba(0,0,0,0.6)' }}>
              <span className="block text-[13px] font-semibold leading-tight text-white">{s.name}</span>
              <span className="block text-[13px] font-bold leading-tight tabular-nums" style={{ color: 'color-mix(in srgb, var(--c) 75%, #fff)' }}>
                {rupees(s.amount)} · {s.day} {mon}
              </span>
            </div>
            <div className="h-[34px] w-[3px] rounded-full" style={{ background: 'linear-gradient(0deg, var(--c), transparent)', boxShadow: '0 0 10px var(--c)' }} />
            {s.status === 'overdue' && (
              <div className="relative h-0 w-0">
                {Array.from({ length: 12 }, (_, k) => (
                  <span key={k} data-b="spark" className="absolute left-0 top-0 h-2 w-2 rounded-full bg-[#4ade80] opacity-0" style={{ boxShadow: '0 0 10px #22C55E' }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// The month as a plate of tiles, with the towers on it
function City({ m }: { m: Month }) {
  const cells = Array.from({ length: m.rows * 7 }, (_, i) => i - m.lead + 1);
  const today = m.at(m.today);
  return (
    <div data-b="city" className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]" style={{ width: m.width, height: m.height }}>
      {/* The plate */}
      <div className="absolute inset-0 rounded-[26px] border border-white/10" style={{ background: 'linear-gradient(160deg,#17171c 0%,#0f0f12 100%)', boxShadow: '0 60px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(110,91,255,0.12)' }} />
      <div className="absolute inset-0 rounded-[26px] opacity-40" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(110,91,255,0.25), transparent 70%)' }} />
      <div className="absolute inset-x-0 top-[14px] flex justify-between px-[22px] text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        <span>
          {m.name} {m.year}
        </span>
        <span data-b="month-total">₹0 this month</span>
      </div>
      {/* Weekday letters */}
      <div className="absolute grid grid-cols-7" style={{ left: PAD, top: PAD + 10, width: 7 * TILE + 6 * GAP, columnGap: GAP }}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-center text-[10px] font-semibold text-neutral-600">
            {d}
          </span>
        ))}
      </div>
      {/* The days */}
      {cells.map((day, i) => {
        if (day < 1 || day > m.days) return null;
        const { x, y } = m.at(day);
        return (
          <div
            key={i}
            data-b="tile"
            data-day={day}
            className="absolute rounded-[12px] border border-white/[0.06] bg-[#1a1a20]"
            style={{ left: x - TILE / 2, top: y - TILE / 2, width: TILE, height: TILE }}
          >
            <span className="absolute left-2 top-1.5 text-[12px] font-semibold text-neutral-500">{day}</span>
          </div>
        );
      })}
      {/* Today */}
      <div data-b="today" className="absolute rounded-[14px] border-2 border-white/90 bg-white/[0.08] shadow-[0_0_30px_rgba(255,255,255,0.5),inset_0_0_20px_rgba(255,255,255,0.15)]" style={{ left: today.x - TILE / 2 - 3, top: today.y - TILE / 2 - 3, width: TILE + 6, height: TILE + 6 }}>
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">Today</span>
      </div>
      {/* The towers */}
      {m.subs.map((s) => {
        const { x, y } = m.at(s.day);
        return <Tower key={s.key} s={s} x={x} y={y} mon={m.name.slice(0, 3)} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The app, beside the city

function Panel({ m }: { m: Month }) {
  const order = [...m.subs].sort((a, b) => a.day - b.day);
  const date = (d: number) => `${d} ${m.name.slice(0, 3)}`;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#131418] p-5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)]">
      <p className="text-[11px] font-semibold tracking-[0.15em] text-white/50">BILLS &amp; SUBSCRIPTIONS</p>
      <div className="mt-1 flex items-end justify-between">
        <p className="text-[22px] font-bold">
          {m.name} {m.year}
        </p>
        <p className="text-right">
          <span className="block text-[11px] text-[#85868c]">This month</span>
          <span data-b="panel-total" className="block text-[20px] font-bold tabular-nums">
            ₹0
          </span>
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div data-b="paid-bar" className="h-full w-full origin-left rounded-full bg-[#22C55E]" style={{ transform: 'scaleX(0)' }} />
      </div>
      <p className="mt-1 text-[11px] text-[#85868c]">
        <span data-b="paid-text">Nothing paid yet</span>
      </p>

      {/* The list */}
      <div className="mt-4 space-y-2">
        {order.map((s) => (
          <div key={s.key} data-b="row" data-key={s.key} className="flex items-center gap-3 rounded-2xl border border-transparent bg-[#1b1c21] px-3 py-2.5">
            <Mark s={s} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{s.name}</span>
              <span className="block truncate text-[11px] text-[#85868c]">{s.plan}</span>
            </span>
            <span className="text-right">
              <span className="block text-[14px] font-semibold tabular-nums">{rupees(s.amount)}</span>
              <span className="relative block h-4 w-[96px] text-[11px] font-semibold">
                <span data-b="chip" data-s="none" className="absolute inset-0 text-right text-[#85868c]">
                  Due {date(s.day)}
                </span>
                <span data-b="chip" data-s="paid" className="absolute inset-0 text-right text-[#22C55E] opacity-0">
                  {s.status === 'paid' ? `Paid ${date(s.day)}` : `Paid today ✓`}
                </span>
                <span data-b="chip" data-s="overdue" className="absolute inset-0 text-right text-[#EF4444] opacity-0">
                  Overdue · {m.today - s.day}d
                </span>
                <span data-b="chip" data-s="pending" className="absolute inset-0 text-right text-[#EAB308] opacity-0">
                  In {s.day - m.today} days
                </span>
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* The overdue alert */}
      <div data-b="alert" className="absolute inset-x-4 top-4 flex items-center gap-3 rounded-2xl border border-[#EF4444]/60 bg-[#2a0f12]/95 px-4 py-3 opacity-0 shadow-[0_20px_40px_-10px_rgba(239,68,68,0.5)] backdrop-blur">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EF4444] text-lg font-bold text-white">!</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">
            {OVERDUE.name} is overdue
          </span>
          <span className="block text-[12px] text-[#fca5a5]">
            {rupees(OVERDUE.amount)} was due on {date(m.today + OVERDUE.offset)}
          </span>
        </span>
        <span className="rounded-full bg-[#EF4444] px-3 py-1 text-[12px] font-semibold text-white">Pay</span>
      </div>

      {/* The reminder */}
      <div data-b="nudge" className="absolute inset-x-4 top-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1f2026]/95 px-4 py-3 opacity-0 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur">
        <span className="text-xl">🔔</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-[#85868c]">BrokeNoMore · now</span>
          <span className="block text-[14px] font-semibold">
            {NEXT.name} renews in {NEXT.offset} days
          </span>
          <span className="block text-[12px] text-[#EAB308]">{rupees(NEXT.amount)} on {date(m.today + NEXT.offset)}</span>
        </span>
      </div>

      {/* The pay sheet */}
      <div data-b="sheet" className="absolute inset-x-0 bottom-0 rounded-t-[26px] border-t border-white/10 bg-[#1b1c21] p-5 shadow-[0_-30px_60px_rgba(0,0,0,0.7)]" style={{ transform: 'translateY(110%)' }}>
        <span className="mx-auto block h-1 w-10 rounded-full bg-white/20" />
        <div className="mt-4 flex items-center gap-3">
          <Mark s={OVERDUE} size={42} />
          <span className="flex-1">
            <span className="block text-[16px] font-semibold">{OVERDUE.name}</span>
            <span className="block text-[12px] text-[#85868c]">{OVERDUE.plan}</span>
          </span>
          <span className="text-[22px] font-bold">{rupees(OVERDUE.amount)}</span>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#131418] px-4 py-3 text-[13px]">
          <span className="text-[#85868c]">Pay with</span>
          <span className="font-semibold">UPI · you@bank</span>
        </div>
        <div className="relative mt-4 h-12">
          <div data-b="pay-btn" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#6E5BFF] text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(110,91,255,0.9)]">
            Pay {rupees(OVERDUE.amount)}
          </div>
          <div data-b="pay-done" className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-[#22C55E] text-[15px] font-semibold text-[#052e16] opacity-0">
            ✓ Paid · it’s green now
          </div>
        </div>
      </div>

      {/* The summary */}
      <div data-b="summary" className="absolute inset-0 flex flex-col bg-[#131418] p-5 opacity-0">
        <p className="text-[11px] font-semibold tracking-[0.15em] text-white/50">{m.name.toUpperCase()} AT A GLANCE</p>
        <div className="mt-4 flex items-center gap-5">
          <svg viewBox="0 0 120 120" className="h-[120px] w-[120px] -rotate-90">
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            <circle data-b="ring-paid" cx="60" cy="60" r="48" fill="none" stroke="#22C55E" strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray="0 1" />
          </svg>
          <div>
            <p className="text-[12px] text-[#85868c]">Bills this month</p>
            <p className="text-[30px] font-bold leading-tight tabular-nums">{rupees(TOTAL)}</p>
            <p className="mt-1 text-[12px]">
              <span className="text-[#22C55E]">{rupees(PAID_TOTAL + OVERDUE.amount)} paid</span> · <span className="text-[#EAB308]">{rupees(TOTAL - PAID_TOTAL - OVERDUE.amount)} upcoming</span>
            </p>
          </div>
        </div>
        <p className="mt-6 text-[13px] font-semibold">By category</p>
        <div className="mt-2 space-y-2.5">
          {Object.entries(SUBS.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.cat]: (acc[s.cat] ?? 0) + s.amount }), {}))
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#c4c4ca]">{cat}</span>
                  <span className="font-semibold tabular-nums">{rupees(amt)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div data-b="cat-bar" className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#6E5BFF,#E86AB4)]" style={{ width: `${(amt / TOTAL) * 100}%`, transform: 'scaleX(0)' }} />
                </div>
              </div>
            ))}
        </div>
        <div className="mt-auto rounded-2xl border border-[#22C55E]/40 bg-[#22C55E]/10 px-4 py-3 text-[13px] text-[#bbf7d0]">
          0 late fees this month. Every due date had a reminder.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

export default function BillsCity() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const capsRef = useRef<HTMLDivElement | null>(null);
  const m = useMemo(() => buildMonth(new Date()), []);
  usePointerVars(sectionRef);
  useTypeOnShow(capsRef, '[data-b="cap"]', 36);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-b="${k}"]`));
    const one = (k: string) => q(k)[0];
    const mm = gsap.matchMedia();

    mm.add({ wide: '(min-width: 768px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
      const { wide, motion } = ctx.conditions as { wide: boolean; motion: boolean };
      const [stage] = q('stage');
      const [rig] = q('rig');
      const city = one('city');
      const towers = q('tower');
      const tiles = q('tile');
      const [todayRing] = q('today');
      const caps = q('cap');
      const [panelWrap] = q('panel-wrap');
      const rows = q('row');
      const byKey = (list: HTMLElement[], key: string) => list.find((el) => el.dataset.key === key)!;
      const towerOf = (key: string) => byKey(towers, key);
      const rowOf = (key: string) => byKey(rows, key);
      const chip = (key: string, st: string) => rowOf(key).querySelector<HTMLElement>(`[data-b="chip"][data-s="${st}"]`)!;
      const fitScale = () => Math.min(1, (stage.clientWidth * 0.95) / (m.width * 1.4), (stage.clientHeight * 0.92) / (m.height * 1.15));

      gsap.set(city, { xPercent: -50, yPercent: -50 });
      gsap.set(panelWrap, { yPercent: wide ? -50 : 0 });
      if (!motion) {
        gsap.set(city, { ...POSE, scale: fitScale() });
        towers.forEach((t, i) => gsap.set(t, { '--rise': 1, '--c': STATUS_COLOR[m.subs[i].status === 'overdue' ? 'paid' : m.subs[i].status] }));
        gsap.set(caps.slice(1), { autoAlpha: 0 });
        return;
      }

      // ---- The opening: the calendar lies flat, tilts back, and the towers rise ----
      gsap.set(city, { rotationX: 0, rotationZ: 0, scale: () => fitScale() * 0.92, y: 30, autoAlpha: 0 });
      towers.forEach((t) => t.style.setProperty('--c', STATUS_COLOR.none));
      // Each tower's colour so far, so every change says where it starts from
      const shown = new Map<string, string>(m.subs.map((x) => [x.key, STATUS_COLOR.none]));
      gsap.set(caps, { autoAlpha: 0 });
      gsap.set(panelWrap, { autoAlpha: 0, x: wide ? 80 : 0, y: wide ? 0 : 80, rotationY: wide ? -18 : 0, transformPerspective: 1400 });
      gsap.set(rig, { x: 0 });
      const intro = gsap.timeline({ delay: 0.2 });
      intro.to(city, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0);
      intro.from(tiles, { autoAlpha: 0, scale: 0.6, duration: 0.4, stagger: { each: 0.012, from: 'start' }, ease: 'back.out(2)' }, 0.1);
      intro.to(city, { ...POSE, scale: fitScale, duration: 1.5, ease: 'power3.inOut' }, 0.9);
      intro.to(towers, { '--rise': 1, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.12 }, 2.0);
      intro.to(caps[0], { autoAlpha: 1, duration: 0.3 }, 2.3);
      // Then the city drifts, slowly, like it's being filmed
      intro.add(() => {
        gsap.to(rig, { rotationZ: 3, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });

      // ---- The story, one step per scroll ----
      const total = { v: 0, paid: 0 };
      const monthTotal = one('month-total');
      const panelTotal = one('panel-total');
      const paidText = one('paid-text');
      const paidBar = one('paid-bar');
      const render = () => {
        monthTotal.textContent = `${rupees(total.v)} this month`;
        panelTotal.textContent = rupees(total.v);
        paidText.textContent = total.paid < 1 ? 'Nothing paid yet' : `${rupees(total.paid)} of ${rupees(TOTAL)} paid`;
        paidBar.style.transform = `scaleX(${total.paid / TOTAL})`;
      };
      const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: { ...pinned(section, STEPS, 9), end: () => `+=${window.innerHeight * 0.6 * STEPS}` } });
      for (let c = 0; c <= STEPS; c++) tl.addLabel(`s${c}`, c);
      const caption = (k: number, at: number) => {
        tl.fromTo(caps[k - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.2, immediateRender: false }, at);
        tl.fromTo(caps[k], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: false }, at + 0.15);
      };
      const status = (key: string, st: Status, at: number) => {
        tl.fromTo(towerOf(key), { '--c': shown.get(key)! }, { '--c': STATUS_COLOR[st], duration: 0.25, immediateRender: false }, at);
        shown.set(key, STATUS_COLOR[st]);
        tl.to(rowOf(key).querySelectorAll('[data-b="chip"]'), { opacity: 0, duration: 0.12 }, at);
        tl.to(chip(key, st), { opacity: 1, duration: 0.15 }, at + 0.1);
        tl.to(rowOf(key), { borderColor: `${STATUS_COLOR[st]}66`, duration: 0.2 }, at);
      };

      // 1. Every bill, on its date: the city moves aside, the app comes in, the list fills
      caption(1, 0.05);
      if (wide) tl.to(rig, { x: () => -stage.clientWidth * 0.2, scale: 0.8, duration: 0.6, ease: 'power2.inOut' }, 0.05);
      else tl.to(rig, { y: () => -stage.clientHeight * 0.2, scale: 0.7, duration: 0.6, ease: 'power2.inOut' }, 0.05);
      tl.to(panelWrap, { autoAlpha: 1, x: 0, y: 0, rotationY: 0, duration: 0.55, ease: 'power3.out' }, 0.25);
      tl.from(rows, { autoAlpha: 0, x: 24, duration: 0.2, stagger: 0.06, immediateRender: false }, 0.45);
      tl.to(total, { v: TOTAL, duration: 0.45, ease: 'power2.out' }, 0.45);
      towers.forEach((t, i) => tl.fromTo(t, { scale: 1 }, { scale: 1.12, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, 0.45 + i * 0.06));

      // 2. What's paid: today's marker sweeps from the 1st up to today, turning them green
      caption(2, 1.05);
      const first = m.at(1);
      const now = m.at(m.today);
      tl.fromTo(todayRing, { x: first.x - now.x, y: first.y - now.y }, { x: 0, y: 0, duration: 0.6, ease: 'power1.inOut', immediateRender: false }, 1.15);
      tiles.forEach((tile) => {
        const d = Number(tile.dataset.day);
        if (d < m.today) tl.to(tile, { backgroundColor: '#14141a', borderColor: 'rgba(34,197,94,0.12)', duration: 0.05 }, 1.15 + (d / m.today) * 0.6);
      });
      m.subs.forEach((s) => {
        if (s.status === 'paid') {
          status(s.key, 'paid', 1.15 + (s.day / m.today) * 0.6);
          tl.to(total, { paid: `+=${s.amount}`, duration: 0.15 }, 1.15 + (s.day / m.today) * 0.6);
        }
      });

      // 3. What's overdue: it turns red and pulses, and the alert comes up
      caption(3, 2.05);
      status(OVERDUE.key, 'overdue', 2.2);
      tl.to(one('halo'), { opacity: 1, duration: 0.15 }, 2.25);
      tl.fromTo(one('alert'), { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, 2.35);
      tl.to(rowOf(OVERDUE.key), { backgroundColor: 'rgba(239,68,68,0.12)', duration: 0.2 }, 2.3);

      // 4. What's coming up: amber, and a nudge before the next one
      caption(4, 3.05);
      tl.to(one('alert'), { opacity: 0, y: -30, duration: 0.2 }, 3.05);
      m.subs.filter((s) => s.status === 'pending').forEach((s, i) => status(s.key, 'pending', 3.2 + i * 0.1));
      tl.fromTo(one('nudge'), { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, 3.5);
      tl.fromTo(towerOf(NEXT.key), { y: 0 }, { y: -8, duration: 0.1, yoyo: true, repeat: 3, immediateRender: false }, 3.55);

      // 5. Pay the overdue one: the sheet comes up, it's paid, and the tower turns green
      caption(5, 4.05);
      tl.to(one('nudge'), { opacity: 0, y: -30, duration: 0.2 }, 4.05);
      tl.to(one('sheet'), { y: '0%', duration: 0.35, ease: 'power3.out' }, 4.15);
      tl.to(one('pay-btn'), { scale: 0.94, duration: 0.06 }, 4.55);
      tl.to(one('pay-btn'), { scale: 1, opacity: 0, duration: 0.1 }, 4.62);
      tl.to(one('pay-done'), { opacity: 1, duration: 0.12 }, 4.64);
      tl.to(one('halo'), { opacity: 0, duration: 0.15 }, 4.64);
      status(OVERDUE.key, 'paid', 4.64);
      tl.to(rowOf(OVERDUE.key), { backgroundColor: '#1b1c21', duration: 0.2 }, 4.64);
      tl.to(total, { paid: `+=${OVERDUE.amount}`, duration: 0.25 }, 4.64);
      tl.fromTo(towerOf(OVERDUE.key), { scale: 1 }, { scale: 1.18, duration: 0.1, yoyo: true, repeat: 1, immediateRender: false }, 4.64);
      q('spark').forEach((sp, k) => {
        const a = (k / 12) * Math.PI * 2;
        tl.fromTo(sp, { x: 0, y: 0, opacity: 1, scale: 1 }, { x: Math.cos(a) * 70, y: Math.sin(a) * 50 - 30, opacity: 0, scale: 0.3, duration: 0.35, ease: 'power2.out', immediateRender: false }, 4.66);
      });

      // 6. The month in one number: the camera swings round the city, the summary comes up
      caption(6, 5.05);
      tl.to(one('sheet'), { y: '110%', duration: 0.3, ease: 'power2.in' }, 5.05);
      tl.to(city, { rotationZ: POSE.rotationZ + 16, rotationX: POSE.rotationX - 6, duration: 0.8, ease: 'power2.inOut' }, 5.1);
      tl.to(one('summary'), { opacity: 1, duration: 0.3 }, 5.3);
      tl.to(one('ring-paid'), { strokeDasharray: `${(PAID_TOTAL + OVERDUE.amount) / TOTAL} 1`, duration: 0.4, ease: 'power2.out' }, 5.4);
      tl.to(q('cat-bar'), { scaleX: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out' }, 5.45);
      tl.set({}, {}, STEPS);

      render();
      const unglide = glideBetweenLabels(tl);
      return () => {
        unglide();
        intro.kill();
      };
    });
    return () => mm.revert();
  }, [m]);

  return (
    <section ref={sectionRef} aria-label="Bills and Subscriptions" className="relative h-[calc(100svh-72px)] min-h-[600px] w-full overflow-hidden bg-black text-white select-none motion-reduce:h-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_58%_60%,rgba(110,91,255,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_50%_80%,rgba(34,197,94,0.08),transparent_70%)]" />
      {/* Stars over the city */}
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(1px 1px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 72% 12%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 30%, #c4bcff, transparent), radial-gradient(1px 1px at 88% 40%, #fff, transparent), radial-gradient(1px 1px at 22% 62%, #fff, transparent), radial-gradient(1.5px 1.5px at 60% 8%, #fff, transparent)' }} />

      <div className="relative mx-auto grid h-full max-w-7xl grid-rows-[auto_1fr] px-4 sm:px-8 md:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)] md:grid-rows-1 md:items-center md:gap-6">
        {/* The words: one for each step, typing themselves in */}
        <div ref={capsRef} className="relative z-20 min-h-[96px] pt-6 md:min-h-[260px] md:pt-0">
          {CAPTIONS.map((c, i) => (
            <div key={c.title} data-b="cap" className={`absolute inset-x-0 top-6 md:top-0 ${i ? 'motion-reduce:hidden' : ''}`}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">{c.eyebrow}</p>
              {i === 0 ? (
                <h1 className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[62px]">
                  Your month, <Gradient>at a glance.</Gradient>
                </h1>
              ) : (
                <h2 className="mt-3 text-[26px] font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[48px]">{c.title}</h2>
              )}
              <p className="mt-3 hidden max-w-md text-[15px] leading-relaxed text-neutral-400 sm:block sm:text-lg">{c.body}</p>
            </div>
          ))}
        </div>

        {/* The city, and the app beside it */}
        <div data-b="stage" className="relative h-full min-h-0">
          <div data-b="rig" className="absolute inset-0 [perspective:1600px]">
            <div className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: 'rotateX(calc(var(--py, 0) * -3deg)) rotateY(calc(var(--px, 0) * 4deg))' }}>
              <City m={m} />
            </div>
          </div>
          <div data-b="panel-wrap" className="absolute bottom-3 right-0 z-10 h-[min(620px,52%)] w-full md:bottom-auto md:top-1/2 md:h-[min(620px,88%)] md:w-[380px]">
            <Panel m={m} />
          </div>
        </div>
      </div>
    </section>
  );
}
