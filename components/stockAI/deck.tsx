'use client';

import React from 'react';
import { AI_STAGES, AMOUNT_PRESETS, GOALS, HORIZONS, OWN_OPTIONS, STOCK, SWINGS, GREEN, RED } from './data';
import { Mark, Sparkle, smoothPath } from './ui';
import AiCore, { CrystalMark } from './AiCore';

// The AI analysis, as the app asks it: one card per question. The scroll timeline in the section
// moves the cards and plays what happens on each one; the parts it touches carry data-s names.

export const STEP_TITLES = [
  'Which stock?',
  'Do you already own this stock?',
  'How much are you planning to put in?',
  'When will you need this money?',
  'How much swing can you handle?',
  'What do you want this stock to do for you?',
];
const STEP_BODIES = [
  'Pick it from Explore, or search for it by name.',
  'The same stock reads differently when you hold it versus when you are deciding.',
  'We use this to show what a fall would mean in rupees, not just percentages.',
  'Time changes how much a market fall can hurt you. Tap the stage that fits.',
  'Prices move both ways. More room to grow comes with deeper dips — choose the range you are comfortable with.',
  'We weight the report towards what matters for your goal.',
];

function Shell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-[28px] border border-white/[0.08] bg-[#151517] p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)]" style={{ background: 'linear-gradient(170deg, #1b1b1f 0%, #131315 70%)' }}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6E5BFF]">Question {step + 1}</p>
      <h3 className="mt-2 text-[26px] font-bold leading-tight tracking-tight">{STEP_TITLES[step]}</h3>
      <p className="mt-2 text-[14px] leading-snug text-[#8b8b94]">{STEP_BODIES[step]}</p>
      <div className="mt-5 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function StockStep() {
  return (
    <Shell step={0}>
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#1c1c20] p-4">
        <Mark symbol="HINDUNILVR" size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-semibold">{STOCK.name}</p>
          <p className="text-[13px] text-[#8b8b94]">
            {STOCK.symbol} • FMCG &amp; Consumer Goods
          </p>
        </div>
        <span className="text-[14px] font-semibold text-[#a1a1aa]">Change</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          ['Price', '₹1,999.80'],
          ['Today', '+0.14%'],
          ['Mkt Cap', '₹4.7L Cr'],
        ].map(([k, v], i) => (
          <div key={k} className="rounded-xl border border-white/[0.06] bg-[#121214] px-3 py-2.5">
            <p className="text-[11px] text-[#8b8b94]">{k}</p>
            <p className="text-[15px] font-semibold" style={{ color: i === 1 ? GREEN : undefined }}>
              {v}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-3 rounded-2xl border border-dashed border-[#6E5BFF]/40 bg-[#6E5BFF]/[0.06] p-4 text-[13px] text-[#c4bcff]">
        <Sparkle className="h-5 w-5 shrink-0 text-[#8f80ff]" />
        Six quick questions, and the AI writes the report for you, not for everyone.
      </div>
    </Shell>
  );
}

function OwnIcon({ i }: { i: number }) {
  return i === 0 ? (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V8h-5a3 3 0 0 0 0 6h5v3.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM15 10h6v2h-6a1 1 0 0 1 0-2z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M12 5c5 0 8.6 4.3 9.6 6.4a1.4 1.4 0 0 1 0 1.2C20.6 14.7 17 19 12 19s-8.6-4.3-9.6-6.4a1.4 1.4 0 0 1 0-1.2C3.4 9.3 7 5 12 5zm0 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
    </svg>
  );
}

function OwnStep() {
  return (
    <Shell step={1}>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {OWN_OPTIONS.map((o, i) => (
          <div
            key={o.title}
            data-s={i === 1 ? 'own-pick' : undefined}
            className="relative flex flex-col rounded-2xl border border-white/[0.09] bg-[#1a1a1d] p-4"
            style={{ '--c': o.color } as React.CSSProperties}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${o.color}22`, color: o.color }}>
              <OwnIcon i={i} />
            </span>
            <p className="mt-5 text-[17px] font-semibold">{o.title}</p>
            <p className="text-[14px] font-semibold" style={{ color: o.color }}>
              {o.sub}
            </p>
            <p className="mt-3 text-[13px] leading-snug text-[#8b8b94]">{o.body}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// A stack of notes, in 3D
function Notes() {
  return (
    <div className="relative mx-auto h-[70px] w-[132px] [perspective:500px]">
      <div className="sa-notes relative h-full w-full [transform-style:preserve-3d]">
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            className="absolute inset-0 flex items-center justify-center rounded-lg border border-[#0f8f66] text-xl font-bold text-[#0b6e4f]"
            style={{ background: 'linear-gradient(160deg,#3fe0a8,#1fbf88)', transform: `translateZ(${k * 7}px) translate(${(3 - k) * 2}px, ${(3 - k) * 3}px)`, opacity: k === 3 ? 1 : 0.9 }}
          >
            {k === 3 && '₹'}
          </div>
        ))}
      </div>
    </div>
  );
}

function AmountStep() {
  return (
    <Shell step={2}>
      <div className="flex flex-1 flex-col rounded-2xl border border-[#1FC58E]/40 p-4" style={{ background: 'linear-gradient(180deg, rgba(31,197,142,0.12), rgba(31,197,142,0.02))' }}>
        <Notes />
        <p className="mt-3 text-center text-[40px] font-bold leading-none tabular-nums" style={{ color: GREEN }}>
          ₹ <span data-s="amount">1,000</span>
        </p>
        <div className="relative mx-2 mt-6 h-2 rounded-full bg-[#2a2a2f]">
          <div data-s="amount-fill" className="absolute inset-y-0 left-0 w-full origin-left rounded-full" style={{ background: GREEN, transform: 'scaleX(0)' }} />
          <div data-s="amount-knob" className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.6)]" style={{ left: '0%' }} />
        </div>
        <div className="mx-1 mt-3 flex justify-between text-[11px] text-[#7b7b84]">
          <span>₹1K</span>
          <span>₹10L</span>
        </div>
        <div data-s="amount-note" className="mt-auto pt-3 text-center opacity-0">
          <p className="text-[16px] font-semibold">Meaningful position</p>
          <p className="text-[12px] text-[#8b8b94]">Big enough that its ups and downs will be noticeable.</p>
        </div>
      </div>
      <div className="mt-3 flex justify-between gap-1.5">
        {AMOUNT_PRESETS.map((p) => (
          <span key={p} className="flex-1 rounded-full border border-white/10 bg-[#1a1a1d] py-1.5 text-center text-[13px] font-medium">
            {p}
          </span>
        ))}
      </div>
    </Shell>
  );
}

function Sprout({ i }: { i: number }) {
  const paths = [
    'M12 20v-6M12 14c-3-.5-5-3-5-6 3 .5 5 3 5 6zm0 0c3-.5 5-3 5-6-3 .5-5 3-5 6zM5 20h14',
    'M12 21V9M12 9c0-3 2.5-5.5 6-6-.2 3.6-2.6 6-6 6zm0 4c0-2.4-2-4.4-5-4.8.2 2.9 2.2 4.8 5 4.8z',
    'M12 3l5 8h-3l4 6H6l4-6H7zM12 17v4',
    'M8 4l4 6h-2l3 5H3l3-5H4zM16 6l4 6h-2l3 5h-6M8 15v5M17 17v3',
  ];
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[i]} />
    </svg>
  );
}

function HorizonStep() {
  const h = HORIZONS[0];
  return (
    <Shell step={3}>
      <div className="flex flex-1 items-center gap-4 rounded-2xl border border-[#1FC58E]/40 p-5" style={{ background: 'linear-gradient(160deg, rgba(31,197,142,0.12), rgba(31,197,142,0.02))' }}>
        <span className="sa-sway h-14 w-14 shrink-0 text-[#2fd9a0]">
          <Sprout i={0} />
        </span>
        <div>
          <p className="text-[12px] font-bold text-[#2fd9a0]">{h.tag}</p>
          <p className="text-[20px] font-semibold">{h.title}</p>
          <p className="text-[13px] text-[#c4c4ca]">{h.sub}</p>
          <p className="mt-2 text-[12px] leading-snug text-[#8b8b94]">{h.body}</p>
        </div>
      </div>
      <div className="relative mt-5 flex justify-between px-2">
        <div className="absolute left-8 right-8 top-[22px] h-[3px] bg-[#2a2a2f]" />
        {HORIZONS.map((x, i) => (
          <div key={x.short} className="relative flex flex-col items-center gap-1.5">
            <span
              data-s={i === 0 ? 'horizon-pick' : undefined}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#1f1f23] p-2.5 text-[#9a9aa3]"
            >
              <Sprout i={i} />
            </span>
            <span className={`text-[12px] ${i === 0 ? 'font-semibold text-white' : 'text-[#7b7b84]'}`}>{x.short}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// The swing chart: a ₹15,000 line that dips and climbs, stretched by how much swing is picked
const SWING_PTS: [number, number][] = [
  [0, 0], [30, -0.15], [60, -0.4], [85, -0.42], [110, -0.75], [135, -1], [160, -0.7], [190, -0.3], [220, -0.05], [250, 0], [280, 0.3], [310, 0.75], [335, 1], [365, 0.88], [400, 0.86],
];
function SwingStep() {
  const pts = SWING_PTS.map(([x, y]) => [x, -y * 34] as const);
  return (
    <Shell step={4}>
      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[#1a1a1d] p-4">
        <p className="text-[14px] leading-snug text-[#d4d4d8]">
          Your <span style={{ color: GREEN }}>₹15,000</span> could swing between <span data-s="swing-low" style={{ color: RED }}>₹14,250</span> and{' '}
          <span data-s="swing-high" style={{ color: GREEN }}>₹15,750</span>. Could you stay calm at the low point?
        </p>
        <svg viewBox="-10 -55 420 110" className="mt-3 h-[120px] w-full overflow-visible">
          <path d="M0 0H400" stroke="#55555c" strokeDasharray="5 5" />
          <text x="2" y="-8" fontSize="11" fill="#9a9aa3">₹15K</text>
          <g data-s="swing-g" transform="scale(1 0.33)">
            <path d={smoothPath(pts)} fill="none" stroke="#e5e5ea" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </g>
          <g data-s="swing-dots">
            <circle data-s="swing-dot-low" cx="135" cy="11" r="6" fill={RED} stroke="#fff" strokeWidth="1.5" />
            <circle data-s="swing-dot-high" cx="335" cy="-11" r="6" fill={GREEN} stroke="#fff" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {SWINGS.map((s, i) => (
          <div key={s.name} data-s="swing-opt" className="rounded-2xl border border-white/[0.09] bg-[#1a1a1d] px-2 py-3 text-center" style={{ '--c': s.color } as React.CSSProperties}>
            <p className="text-[16px] font-semibold">{s.name}</p>
            <p className="text-[13px] font-semibold" style={{ color: s.color }}>
              {s.mood}
            </p>
            <p className="mt-1.5 text-[14px] font-semibold">±{s.pct}%</p>
            <p className="text-[11px] text-[#7b7b84]">±₹{i === 0 ? '750' : i === 1 ? '2.25K' : '4.5K'}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function GoalIcon({ icon }: { icon: (typeof GOALS)[number]['icon'] }) {
  const d = {
    trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    cash: 'M3 7h14v10H3zM7 4h14v10M10 12a2 2 0 1 0 0-.01',
    gem: 'M6 3h12l3 6-9 12L3 9zM3 9h18M9 3l3 18 3-18',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  }[icon];
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function GoalStep() {
  return (
    <Shell step={5}>
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((g, i) => (
          <div key={g.title} data-s={i === 0 ? 'goal-pick' : undefined} className="rounded-2xl border border-white/[0.09] bg-[#1a1a1d] p-3" style={{ '--c': g.color } as React.CSSProperties}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${g.color}22`, color: g.color }}>
              <GoalIcon icon={g.icon} />
            </span>
            <p className="mt-2 text-[15px] font-semibold leading-tight">{g.title}</p>
            <p className="mt-1 text-[12px] leading-snug text-[#8b8b94]">{g.sub}</p>
          </div>
        ))}
      </div>
      <div data-s="goal-note" className="my-3 flex items-center gap-3 rounded-2xl border border-[#1FC58E]/40 bg-[#1FC58E]/[0.07] px-4 py-3 text-[13px] opacity-0">
        <span className="text-[#2fd9a0]">◎</span>
        <span>
          Your report will focus on <span className="font-semibold text-[#2fd9a0]">business quality &amp; growth momentum</span>.
        </span>
      </div>
      <div data-s="generate" className="mt-auto flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#6E5BFF] py-3.5 text-[16px] font-semibold shadow-[0_14px_36px_-8px_rgba(110,91,255,0.8)]">
        <Sparkle /> Generate AI Stock Report
      </div>
    </Shell>
  );
}

// The report being made: the AI core, spun up, with the app's progress line
function WorkingStep({ energyRef }: { energyRef: React.MutableRefObject<number> }) {
  return (
    <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[28px] border border-[#6E5BFF]/30 bg-[#0d0d10] p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_42%,rgba(110,91,255,0.25),transparent_70%)]" />
      <AiCore className="relative min-h-0 w-full flex-1" energyRef={energyRef} fallback={<CrystalMark className="h-28 w-28" />} />
      <div className="relative w-full pb-2 text-center">
        <div className="relative h-6">
          {AI_STAGES.map((s, i) => (
            <p key={s} data-s="stage" className="absolute inset-x-0 text-[18px] font-semibold" style={{ opacity: i === 0 ? 1 : 0 }}>
              {s}
            </p>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-[#8b8b94]">Fetching live data &amp; scanning market metrics…</p>
        <div className="mx-auto mt-4 h-1.5 w-[60%] overflow-hidden rounded-full bg-[#26262b]">
          <div data-s="progress" className="h-full w-full origin-left rounded-full bg-[#6E5BFF]" style={{ transform: 'scaleX(0.04)' }} />
        </div>
      </div>
    </div>
  );
}

export function DeckCards({ energyRef }: { energyRef: React.MutableRefObject<number> }) {
  return [<StockStep key="0" />, <OwnStep key="1" />, <AmountStep key="2" />, <HorizonStep key="3" />, <SwingStep key="4" />, <GoalStep key="5" />, <WorkingStep key="6" energyRef={energyRef} />];
}
