'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Gradient } from '../IntroHero';
import { glideBetweenLabels, pinned } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';
import { Avatar } from '../splitPage/screens';

// THE TABLET VERSION, kept for later (switched off in app/features/bills/page.tsx).
// Bills & Subscriptions, as the app's bill calendar on a tablet. The tablet swings up out of the
// dark in 3D and its screen builds itself: the sidebar's cards slide in, the week's days pop up,
// and every bill drops onto its day as a block. Then, one step per scroll, the camera moves round
// the screen while notifications and coins float out of it:
//   1. Every bill, on its day: in close on the week, today glowing, the time sweeping down to now
//   2. Paid, overdue, coming up: every block takes its colour, and the legend comes in
//   3. Overdue? Sorted in a tap: the overdue bill's card pops out of the screen; pay it, it's green
//   4. Where it all goes: over to the sidebar, today's list ticks off, the breakdown fills
//   5. Your month, at a glance: back out, Week flips to Month, and the month's summary comes up
// The dates are this real week; all figures are illustrative.

type Status = 'paid' | 'overdue' | 'today' | 'upcoming';
const COLOR: Record<Status | 'idle', string> = { idle: '#3f3a7a', paid: '#22C55E', overdue: '#EF4444', today: '#F5A524', upcoming: '#6E5BFF' };
const BILLS: { key: string; name: string; sub: string; mark: string; brand: string; ink: string; day: number; from: number; to: number; amount: number; status: Status; cat: string }[] = [
  { key: 'netflix', name: 'Netflix', sub: 'Premium', mark: 'N', brand: '#E50914', ink: '#fff', day: 0, from: 8, to: 8.85, amount: 649, status: 'paid', cat: 'Subscriptions' },
  { key: 'power', name: 'Electricity', sub: 'BESCOM', mark: '⚡', brand: '#F5B400', ink: '#1a1a1a', day: 0, from: 10, to: 11.5, amount: 1840, status: 'overdue', cat: 'Utilities' },
  { key: 'prime', name: 'Amazon Prime', sub: 'Annual', mark: 'prime', brand: '#00A8E1', ink: '#fff', day: 1, from: 8.5, to: 9.75, amount: 1499, status: 'paid', cat: 'Subscriptions' },
  { key: 'gym', name: 'Cult.fit', sub: 'Monthly', mark: 'c', brand: '#111', ink: '#fff', day: 1, from: 13, to: 14, amount: 1299, status: 'paid', cat: 'Lifestyle' },
  { key: 'card', name: 'Credit card', sub: 'HDFC · min due', mark: '▭', brand: '#1d3f8f', ink: '#fff', day: 2, from: 9, to: 10.75, amount: 4250, status: 'today', cat: 'Cards' },
  { key: 'wifi', name: 'Broadband', sub: 'ACT Fibernet', mark: '◉', brand: '#e11d2e', ink: '#fff', day: 2, from: 13, to: 14, amount: 999, status: 'today', cat: 'Utilities' },
  { key: 'spotify', name: 'Spotify', sub: 'Individual', mark: '♫', brand: '#1DB954', ink: '#0b1a10', day: 3, from: 8, to: 8.85, amount: 119, status: 'upcoming', cat: 'Subscriptions' },
  { key: 'rent', name: 'Rent', sub: 'Flat 4B · split 3 ways', mark: '⌂', brand: '#8B5CF6', ink: '#fff', day: 4, from: 9, to: 11.5, amount: 18000, status: 'upcoming', cat: 'Rent' },
  { key: 'youtube', name: 'YouTube Premium', sub: 'Family', mark: '▶', brand: '#FF0033', ink: '#fff', day: 5, from: 10, to: 11, amount: 299, status: 'upcoming', cat: 'Subscriptions' },
  { key: 'hotstar', name: 'Disney+ Hotstar', sub: 'Super', mark: 'D+', brand: '#1F3FB8', ink: '#fff', day: 6, from: 13, to: 14.5, amount: 899, status: 'upcoming', cat: 'Subscriptions' },
];
const OVERDUE = BILLS.find((b) => b.status === 'overdue')!;
const WEEK_TOTAL = BILLS.reduce((t, b) => t + b.amount, 0);
const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const BREAKDOWN = Object.entries(BILLS.reduce<Record<string, number>>((a, b) => ({ ...a, [b.cat]: (a[b.cat] ?? 0) + b.amount }), {})).sort((a, b) => b[1] - a[1]);
const BAR_COLORS = ['#6E5BFF', '#E86AB4', '#22C55E', '#F5A524', '#38BDF8'];

const CAPTIONS = [
  { eyebrow: 'Bills & Subscriptions', title: 'Every bill, on your calendar.', body: 'Subscriptions, rent, utilities and cards, each one sitting on the day it’s due.' },
  { eyebrow: '01 · Your week', title: 'Every bill, on its day.', body: 'See the week at a glance: what’s due, when, and how much.' },
  { eyebrow: '02 · Status', title: 'Paid. Overdue. Coming up.', body: 'Green when it’s paid, red the moment it slips, amber for what’s due today.' },
  { eyebrow: '03 · Pay', title: 'Overdue? Sorted in a tap.', body: 'Open the bill, pay it over UPI, or split it with your flatmates. Done.' },
  { eyebrow: '04 · Breakdown', title: 'Where it all goes.', body: 'Today’s bills ticked off, and your spend split by subscriptions, rent, utilities and cards.' },
  { eyebrow: '05 · Your month', title: 'Your month, at a glance.', body: 'Switch to Month and see every due date ahead, with a nudge before each one.' },
];
const STEPS = CAPTIONS.length - 1;

// The tablet's screen, in its own pixels
const TW = 1180;
const TH = 790;
const SIDE = 300;
const ROW = 70; // an hour
const HOURS = [8, 9, 10, 11, 12, 13, 14];
const COL_W = 104;
const GRID_X = 60;

function useWeek() {
  return useMemo(() => {
    const now = new Date();
    // The week shown starts two days before today, so today sits in the middle with bills on
    // either side
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    const days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    const monthName = now.toLocaleString('en-IN', { month: 'long' });
    const year = now.getFullYear();
    const lead = (new Date(year, now.getMonth(), 1).getDay() + 6) % 7;
    const inMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    return {
      today: now.getDate(),
      days: days.map((d) => ({ label: d.toLocaleString('en-IN', { weekday: 'short' }), date: d.getDate(), month: d.getMonth() })),
      long: (i: number) => days[i].toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
      monthName,
      year,
      thisMonth: now.getMonth(),
      lead,
      inMonth,
    };
  }, []);
}

function Brand({ b, size = 22 }: { b: (typeof BILLS)[number]; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[7px] font-extrabold leading-none" style={{ width: size, height: size, background: b.brand, color: b.ink, fontSize: size * (b.mark.length > 2 ? 0.3 : 0.48), boxShadow: '0 0 0 1.5px rgba(255,255,255,0.25)' }}>
      {b.mark}
    </span>
  );
}

const ICONS = ['M4 11l8-7 8 7v9H4z', 'M4 6h16v14H4zM4 10h16M9 3v5M15 3v5', 'M8 11a3 3 0 1 0 0-.01M16 11a3 3 0 1 0 0-.01M3 20c1-3 9-3 10 0M11 20c1-3 9-3 10 0', 'M5 20V10M11 20V4M17 20v-7', 'M4 5h16v11H8l-4 4z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-2V4h-4v2L9 7 7 6 5 10l2 1v2l-2 1 2 4 2-1 2 2v2h4v-2l2-2 2 1 2-4z'];

// ---------------------------------------------------------------------------------------------
// The tablet's screen

function Screen({ w }: { w: ReturnType<typeof useWeek> }) {
  const card = 'rounded-[22px] bg-[#16161c] p-4';
  const dueToday = BILLS.filter((b) => b.status === 'today' || b.status === 'overdue');
  const billDays = new Set(BILLS.map((b) => w.days[b.day]).filter((d) => d.month === w.thisMonth).map((d) => d.date));
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[30px] bg-[#0b0b0f] p-5 text-white">
      {/* Top bar */}
      <div data-b="topbar" className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <Image src="/assets/images/main_logo.png" alt="" width={30} height={30} className="rounded-full" />
          <span className="text-[19px] font-bold tracking-tight">BrokeNoMore</span>
        </span>
        <span className="flex gap-2">
          {ICONS.map((d, i) => (
            <span key={i} className={`flex h-10 w-10 items-center justify-center rounded-full border ${i === 1 ? 'border-white bg-white text-black' : 'border-white/15 text-white/80'}`}>
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
            </span>
          ))}
        </span>
        <span className="flex items-center gap-2.5">
          <Avatar id="you" size={36} />
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold">Vanshita</span>
            <span className="block text-[11px] text-white/50">3 bills due this week</span>
          </span>
        </span>
      </div>

      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `${SIDE}px 1fr`, height: TH - 96 }}>
        {/* Sidebar */}
        <div className="flex min-h-0 flex-col gap-3">
          <div data-b="side" className={card}>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">
                {w.monthName} {w.year}
              </p>
              <span className="flex gap-1.5 text-white/60">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">‹</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">›</span>
              </span>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[11px]">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="font-semibold text-white/50">
                  {d}
                </span>
              ))}
              {Array.from({ length: w.lead }, (_, i) => (
                <span key={`l${i}`} />
              ))}
              {Array.from({ length: w.inMonth }, (_, i) => {
                const d = i + 1;
                const inWeek = w.days.some((x) => x.month === w.thisMonth && x.date === d);
                return (
                  <span key={d} className="relative flex h-[26px] items-center justify-center">
                    <span className={`flex h-[24px] w-[24px] items-center justify-center rounded-full ${d === w.today ? 'bg-white font-bold text-black' : inWeek ? 'bg-white/10' : 'text-white/80'}`}>{d}</span>
                    {billDays.has(d) && <span data-b="cal-dot" className="absolute bottom-[-1px] h-1 w-1 rounded-full bg-[#E86AB4] opacity-0" />}
                  </span>
                );
              })}
            </div>
          </div>
          <div data-b="side" className={card}>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">Due today</p>
              <span className="text-[12px] text-white/50">View all</span>
            </div>
            <div className="mt-2.5 space-y-2">
              {dueToday.map((b) => (
                <div key={b.key} data-b="todo" data-key={b.key} className="flex items-center gap-2.5 text-[13px]">
                  <span data-b="box" className="flex h-4 w-4 items-center justify-center rounded-[4px] border-2 border-white/50 text-[10px] font-bold text-transparent">
                    ✓
                  </span>
                  <span data-b="todo-name" className="flex-1">
                    {b.name}
                  </span>
                  <span className="tabular-nums text-white/70">{rupees(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div data-b="side" className={`${card} flex-1`}>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">Spend breakdown</p>
              <span className="text-[12px] text-white/50">This week</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {BREAKDOWN.map(([cat, amt], i) => (
                <div key={cat} className="grid grid-cols-[92px_1fr_62px] items-center gap-2 text-[12.5px]">
                  <span className="text-white/80">{cat}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span data-b="spend-bar" className="block h-full origin-left rounded-full" style={{ width: `${Math.max(8, (amt / BREAKDOWN[0][1]) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length], transform: 'scaleX(0)' }} />
                  </span>
                  <span className="text-right tabular-nums text-white/70">{rupees(amt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The calendar */}
        <div data-b="main" className="relative min-h-0 rounded-[22px] bg-[#16161c] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[28px] font-bold tracking-tight">
              {w.monthName} {w.year}
            </p>
            <span className="relative flex rounded-full border border-white/10 p-1 text-[12.5px]">
              <span data-b="toggle-pill" className="absolute top-1 h-[calc(100%-8px)] w-[60px] rounded-full bg-white" style={{ left: 64 }} />
              {['Month', 'Week', 'Day'].map((t) => (
                <span key={t} data-b={`toggle-${t}`} className={`relative z-[1] w-[60px] py-1.5 text-center ${t === 'Week' ? 'text-black' : 'text-white/80'}`}>
                  {t}
                </span>
              ))}
            </span>
          </div>

          {/* The week */}
          <div data-b="week" className="absolute inset-x-4 bottom-4 top-[66px]">
            <div className="flex items-center" style={{ paddingLeft: GRID_X }}>
              {w.days.map((d, i) => (
                <span key={i} data-b="day" className="px-[3px]" style={{ width: COL_W }}>
                  <span className={`flex h-[44px] items-center justify-center rounded-[14px] text-[13px] font-medium ${i === 2 ? 'bg-white text-black' : 'bg-[#0b0b0f] text-white/85'}`}>
                    {d.label} {d.date}
                  </span>
                </span>
              ))}
            </div>
            <div className="relative mt-3" style={{ height: HOURS.length * ROW }}>
              {HOURS.map((h, i) => (
                <div key={h} className="absolute inset-x-0 border-t border-white/[0.07]" style={{ top: i * ROW }}>
                  <span className="absolute -top-2 left-0 text-[11px] text-white/45">{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</span>
                </div>
              ))}
              {/* Today's column, lit */}
              <div data-b="today-col" className="absolute inset-y-0 rounded-[14px] opacity-0" style={{ left: GRID_X + 2 * COL_W, width: COL_W, background: 'linear-gradient(180deg, rgba(110,91,255,0.18), rgba(110,91,255,0.02))', boxShadow: 'inset 0 0 0 1px rgba(110,91,255,0.4)' }} />
              {/* Now */}
              <div data-b="now" className="absolute h-0.5 opacity-0" style={{ left: GRID_X, right: 0, top: 0, background: '#E86AB4', boxShadow: '0 0 10px #E86AB4' }}>
                <span className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-[#E86AB4]" />
              </div>
              {/* The bills */}
              {BILLS.map((b) => (
                <div
                  key={b.key}
                  data-b="block"
                  data-key={b.key}
                  className="absolute overflow-hidden rounded-[14px] px-2.5 py-2"
                  style={{ left: GRID_X + b.day * COL_W + 3, width: COL_W - 6, top: (b.from - 8) * ROW + 2, height: (b.to - b.from) * ROW - 4, background: COLOR.idle, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Brand b={b} size={18} />
                    <span className="truncate text-[12px] font-semibold leading-tight">{b.name}</span>
                  </span>
                  <span className="mt-1 block text-[12px] font-bold tabular-nums">{rupees(b.amount)}</span>
                  {b.to - b.from > 1 && <span className="mt-0.5 block truncate text-[10.5px] text-white/75">{b.sub}</span>}
                  <span data-b="block-tick" className="absolute right-2 top-2 h-4 w-4 rounded-full bg-white text-center text-[10px] font-bold leading-4 text-[#16a34a] opacity-0">
                    ✓
                  </span>
                </div>
              ))}
              {/* The legend */}
              <div data-b="legend" className="absolute -bottom-1 right-0 flex gap-3 text-[11.5px] opacity-0">
                {(['paid', 'overdue', 'today', 'upcoming'] as Status[]).map((s) => (
                  <span key={s} className="flex items-center gap-1.5 capitalize text-white/75">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[s] }} />
                    {s === 'today' ? 'Due today' : s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* The month */}
          <div data-b="month" className="absolute inset-x-4 bottom-4 top-[66px] opacity-0">
            <div className="grid grid-cols-7 gap-1.5 text-[12px]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d} className="pb-1 text-center font-semibold text-white/50">
                  {d}
                </span>
              ))}
              {Array.from({ length: w.lead }, (_, i) => (
                <span key={`m${i}`} />
              ))}
              {Array.from({ length: w.inMonth }, (_, i) => {
                const d = i + 1;
                const here = BILLS.filter((b) => w.days[b.day].month === w.thisMonth && w.days[b.day].date === d);
                return (
                  <span key={d} data-b="mcell" className={`relative h-[86px] rounded-[12px] p-1.5 ${d === w.today ? 'bg-white/[0.08] ring-1 ring-white/60' : 'bg-[#0b0b0f]'}`}>
                    <span className={`text-[11px] ${d === w.today ? 'font-bold' : 'text-white/60'}`}>{d}</span>
                    <span className="mt-1 block space-y-1">
                      {here.map((b) => (
                        <span key={b.key} className="block truncate rounded-[6px] px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: `${COLOR[b.key === OVERDUE.key ? 'paid' : b.status]}cc` }}>
                          {b.name}
                        </span>
                      ))}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* The overdue bill's card, popping out of the screen */}
      <div data-b="pop" className="absolute z-20 w-[330px] rounded-[24px] bg-white p-4 text-[#0b0b0f] opacity-0 shadow-[0_40px_80px_rgba(0,0,0,0.6)]" style={{ left: SIDE + 20 + 16 + GRID_X + COL_W + 30, top: 210 }}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <Brand b={OVERDUE} size={30} />
            <span>
              <span className="block text-[17px] font-semibold leading-tight">{OVERDUE.name}</span>
              <span className="block text-[12px] text-black/50">{OVERDUE.sub} · monthly</span>
            </span>
          </span>
          <span className="text-[20px] font-bold">{rupees(OVERDUE.amount)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/[0.05] px-3 py-2.5 text-[13px]">
          <span>📅</span> Due {w.long(OVERDUE.day)}
          <span data-b="pop-late" className="ml-auto rounded-full bg-[#EF4444]/15 px-2 py-0.5 text-[11px] font-bold text-[#dc2626]">
            2 days late
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/[0.05] px-3 py-2.5 text-[13px]">
          <span>⚡</span> Pay with UPI · you@bank
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11.5px] font-semibold text-white">
          {[
            ['Utilities', '#6E5BFF'],
            ['Monthly', '#22C55E'],
            ['Autopay off', '#8B5CF6'],
          ].map(([t, c]) => (
            <span key={t} className="rounded-full px-3 py-1" style={{ background: c }}>
              {t}
            </span>
          ))}
          <span data-b="pop-tag" className="relative rounded-full bg-[#EF4444] px-3 py-1">
            <span data-b="pop-tag-overdue">Overdue</span>
            <span data-b="pop-tag-paid" className="absolute inset-0 flex items-center justify-center opacity-0">
              Paid
            </span>
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex -space-x-2">
            {['you', 'atharva', 'parva'].map((id) => (
              <Avatar key={id} id={id} size={30} ring="#fff" />
            ))}
          </span>
          <span className="text-[12px] text-black/55">Split with flatmates</span>
        </div>
        <div className="relative mt-3 h-11">
          <div data-b="pay-btn" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#0b0b0f] text-[14px] font-semibold text-white">
            Pay {rupees(OVERDUE.amount)}
          </div>
          <div data-b="pay-done" className="absolute inset-0 flex items-center justify-center rounded-full bg-[#22C55E] text-[14px] font-semibold text-[#052e16] opacity-0">
            ✓ Paid · all clear
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

// `flat`: shown straight on, with no tablet round it, building itself as it scrolls into view
// (after the night-desk opening); otherwise the tablet swings up on arrival
export default function BillsBoard({ flat = false }: { flat?: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const capsRef = useRef<HTMLDivElement | null>(null);
  const w = useWeek();
  useTypeOnShow(capsRef, '[data-b="cap"]', 34);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-b="${k}"]`));
    const one = (k: string) => q(k)[0];
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [stage] = q('stage');
      const [fit] = q('fit');
      const [cam] = q('cam');
      const [tablet] = q('tablet');
      const caps = q('cap');
      const blocks = q('block');
      const block = (key: string) => blocks.find((b) => b.dataset.key === key)!;
      const floats = q('float');
      const fitScale = () => Math.min(1, (stage.clientWidth * 0.98) / TW, (stage.clientHeight * 0.9) / TH);
      // Bring a point on the screen (its own pixels) to the middle, at a zoom
      const focus = (fx: number, fy: number, s: number) => ({ x: -(fx - TW / 2) * s, y: -(fy - TH / 2) * s, scale: s });
      const MAIN_X = SIDE + 20 + 16;

      gsap.set(fit, { xPercent: -50, yPercent: -50, scale: fitScale });
      gsap.set(caps, { autoAlpha: 0 });
      gsap.set(floats, { autoAlpha: 0, scale: 0.6 });

      // ---- The tablet swings up, and its screen builds itself ----
      const intro = gsap.timeline(flat ? { paused: true } : { delay: 0.2 });
      if (flat) {
        intro.fromTo(tablet, { y: 120, scale: 0.94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.9, ease: 'power3.out' }, 0);
        ScrollTrigger.create({ trigger: section, start: 'top 75%', once: true, onEnter: () => intro.play() });
      } else intro.fromTo(tablet, { y: 380, rotationX: 62, rotationY: -30, rotationZ: 8, scale: 0.7, autoAlpha: 0 }, { y: 0, rotationX: 10, rotationY: -16, rotationZ: 0, scale: 1, autoAlpha: 1, duration: 1.4, ease: 'power3.out' }, 0);
      intro.from(one('topbar'), { autoAlpha: 0, y: -16, duration: 0.4 }, 0.7);
      intro.from(q('side'), { autoAlpha: 0, x: -40, duration: 0.45, stagger: 0.1, ease: 'power2.out' }, 0.8);
      intro.from(one('main'), { autoAlpha: 0, scale: 0.96, duration: 0.45, ease: 'power2.out' }, 0.85);
      intro.from(q('day'), { autoAlpha: 0, y: 14, duration: 0.3, stagger: 0.05, ease: 'back.out(2)' }, 1.05);
      intro.from(blocks, { autoAlpha: 0, y: -50, scale: 0.85, duration: 0.45, stagger: 0.07, ease: 'bounce.out' }, 1.3);
      intro.to(caps[0], { autoAlpha: 1, duration: 0.3 }, 1.2);
      // Then it floats, slowly
      if (!flat)
        intro.add(() => {
          gsap.to(tablet, { y: -10, rotationY: -13, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        });

      // ---- One step per scroll ----
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { ...pinned(section, STEPS, 9), end: () => `+=${window.innerHeight * 0.65 * STEPS}` } });
      for (let c = 0; c <= STEPS; c++) tl.addLabel(`s${c}`, c);
      for (let c = 1; c <= STEPS; c++) {
        tl.fromTo(caps[c - 1], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.15, immediateRender: false }, c - 1 + 0.03);
        tl.fromTo(caps[c], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, c - 1 + 0.15);
      }
      const showFloat = (i: number, at: number) => tl.fromTo(floats[i], { autoAlpha: 0, scale: 0.6, z: -60 }, { autoAlpha: 1, scale: 1, z: 0, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, at);
      const hideFloat = (i: number, at: number) => tl.to(floats[i], { autoAlpha: 0, scale: 0.7, duration: 0.15 }, at);

      // 1. In close on the week: today lights up, the time sweeps down to now
      tl.to(cam, { ...focus(MAIN_X + 380, 470, 1.32), duration: 0.6, ease: 'power3.inOut' }, 0.05);
      tl.to(one('today-col'), { opacity: 1, duration: 0.2 }, 0.4);
      tl.fromTo(one('now'), { opacity: 1, top: 0 }, { top: 2.6 * ROW, duration: 0.45, ease: 'power2.out', immediateRender: false }, 0.45);
      showFloat(0, 0.55);

      // 2. Every block takes its colour
      hideFloat(0, 1.05);
      BILLS.forEach((b, i) => {
        tl.to(block(b.key), { backgroundColor: COLOR[b.status], boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px -10px ${COLOR[b.status]}`, duration: 0.12 }, 1.15 + i * 0.05);
        if (b.status === 'paid') tl.to(block(b.key).querySelector('[data-b="block-tick"]'), { opacity: 1, duration: 0.1 }, 1.2 + i * 0.05);
      });
      tl.fromTo(block(OVERDUE.key), { x: 0 }, { x: 4, duration: 0.03, yoyo: true, repeat: 7, immediateRender: false }, 1.7);
      tl.to(one('legend'), { opacity: 1, duration: 0.2 }, 1.6);
      showFloat(1, 1.55);
      showFloat(2, 1.7);

      // 3. The overdue bill pops out of the screen, and gets paid
      hideFloat(1, 2.05);
      hideFloat(2, 2.05);
      tl.to(cam, { ...focus(MAIN_X + 290, 420, 1.18), duration: 0.5, ease: 'power3.inOut' }, 2.05);
      tl.to(block(OVERDUE.key), { scale: 1.06, boxShadow: '0 0 0 3px #fff, 0 16px 40px -8px #EF4444', duration: 0.15 }, 2.2);
      tl.fromTo(one('pop'), { autoAlpha: 0, scale: 0.6, z: 0, rotationY: -20, transformOrigin: '0% 30%' }, { autoAlpha: 1, scale: 1, z: 90, rotationY: 0, duration: 0.35, ease: 'back.out(1.6)', immediateRender: false }, 2.3);
      tl.to(one('pay-btn'), { scale: 0.94, duration: 0.05 }, 2.75);
      tl.to(one('pay-btn'), { scale: 1, opacity: 0, duration: 0.08 }, 2.8);
      tl.to(one('pay-done'), { opacity: 1, duration: 0.08 }, 2.82);
      tl.to(one('pop-tag'), { backgroundColor: '#22C55E', duration: 0.1 }, 2.82);
      tl.to(one('pop-tag-overdue'), { opacity: 0, duration: 0.05 }, 2.82);
      tl.to(one('pop-tag-paid'), { opacity: 1, duration: 0.05 }, 2.84);
      tl.to(one('pop-late'), { opacity: 0, duration: 0.1 }, 2.82);
      tl.to(block(OVERDUE.key), { backgroundColor: COLOR.paid, scale: 1, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px -10px ${COLOR.paid}`, duration: 0.15 }, 2.85);
      tl.to(block(OVERDUE.key).querySelector('[data-b="block-tick"]'), { opacity: 1, duration: 0.1 }, 2.88);
      q('coin').forEach((c, i) => {
        const a = (i / q('coin').length) * Math.PI * 2;
        tl.fromTo(c, { x: 0, y: 0, z: 0, autoAlpha: 0, rotation: 0, scale: 0.5 }, { x: Math.cos(a) * 190, y: Math.sin(a) * 120 - 60, z: 160, autoAlpha: 1, rotation: 540, scale: 1.3, duration: 0.3, ease: 'power2.out', immediateRender: false }, 2.85);
        tl.to(c, { autoAlpha: 0, duration: 0.12 }, 3.1);
      });
      showFloat(3, 2.9);

      // 4. Over to the sidebar: today's list ticks off, the breakdown fills
      hideFloat(3, 3.05);
      tl.to(one('pop'), { autoAlpha: 0, z: 0, scale: 0.8, duration: 0.2 }, 3.05);
      tl.to(cam, { ...focus(170, 470, 1.4), duration: 0.6, ease: 'power3.inOut' }, 3.08);
      q('todo').forEach((t, i) => {
        const at = 3.45 + i * 0.12;
        tl.to(t.querySelector('[data-b="box"]'), { backgroundColor: '#22C55E', borderColor: '#22C55E', color: '#052e16', duration: 0.08 }, at);
        tl.to(t.querySelector('[data-b="todo-name"]'), { opacity: 0.5, textDecoration: 'line-through', duration: 0.08 }, at);
      });
      tl.to(q('spend-bar'), { scaleX: 1, duration: 0.35, stagger: 0.07, ease: 'power2.out' }, 3.5);
      tl.to(q('cal-dot'), { opacity: 1, duration: 0.1, stagger: 0.03 }, 3.5);

      // 5. Back out, Week flips to Month, and the summary
      tl.to(cam, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power3.inOut' }, 4.05);
      tl.to(one('toggle-pill'), { left: 4, duration: 0.2, ease: 'power2.inOut' }, 4.35);
      tl.to(one('toggle-Month'), { color: '#000', duration: 0.1 }, 4.4);
      tl.to(one('toggle-Week'), { color: 'rgba(255,255,255,0.8)', duration: 0.1 }, 4.4);
      tl.to(one('week'), { autoAlpha: 0, rotationX: -40, y: 40, duration: 0.25 }, 4.4);
      tl.fromTo(one('month'), { opacity: 0, rotationX: 40, y: -30 }, { opacity: 1, rotationX: 0, y: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, 4.55);
      tl.from(q('mcell'), { autoAlpha: 0, scale: 0.7, duration: 0.2, stagger: 0.008, immediateRender: false }, 4.55);
      showFloat(4, 4.65);
      tl.set({}, {}, STEPS);

      const unglide = glideBetweenLabels(tl);
      return () => {
        unglide();
        intro.kill();
      };
    });
    return () => mm.revert();
  }, [w, flat]);

  const glass = 'absolute z-30 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#14141b]/80 px-4 py-3 text-white shadow-[0_30px_60px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md';

  return (
    <section ref={sectionRef} aria-label={flat ? 'Your bill calendar' : 'Bills and Subscriptions'} className="relative h-[calc(100svh-72px)] min-h-[620px] w-full overflow-hidden bg-black text-white select-none">
      {flat && <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[20%] bg-gradient-to-b from-black to-transparent" />}
      {flat && <div className="pointer-events-none absolute inset-y-0 left-0 z-[35] hidden w-[36%] bg-gradient-to-r from-black via-black/85 to-transparent md:block" />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_64%_55%,rgba(110,91,255,0.24),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_25%_30%_at_80%_85%,rgba(232,106,180,0.1),transparent_70%)]" />

      <div className="relative mx-auto grid h-full max-w-[1500px] grid-rows-[auto_1fr] px-4 sm:px-8 md:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.9fr)] md:grid-rows-1 md:items-center md:gap-4">
        {/* The words */}
        <div ref={capsRef} className="relative z-40 min-h-[96px] pt-6 md:min-h-[260px] md:pt-0">
          {CAPTIONS.map((c, i) => (
            <div key={c.title} data-b="cap" className="absolute inset-x-0 top-6 md:top-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">{c.eyebrow}</p>
              {i === 0 ? (
                React.createElement(
                  flat ? 'h2' : 'h1',
                  { className: 'mt-3 text-[34px] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[56px]' },
                  'Every bill, ',
                  <Gradient key="g">on your calendar.</Gradient>
                )
              ) : (
                <h2 className="mt-3 text-[26px] font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[46px]">{c.title}</h2>
              )}
              <p className="mt-3 hidden max-w-sm text-[15px] leading-relaxed text-neutral-400 sm:block sm:text-[17px]">{c.body}</p>
            </div>
          ))}
        </div>

        {/* The tablet */}
        <div data-b="stage" className="relative h-full min-h-0 [perspective:1800px]">
          <div data-b="fit" className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]" style={{ width: TW, height: TH }}>
            <div data-b="cam" className="absolute inset-0 [transform-style:preserve-3d]">
              <div data-b="tablet" className="absolute inset-0 [transform-style:preserve-3d]">
                {/* Its body: the edge, layered for thickness, and the bezel */}
                {flat ? (
                  <div className="absolute -inset-px rounded-[31px] border border-white/10 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9),0_0_90px_-30px_rgba(110,91,255,0.5)]" />
                ) : (
                  <>
                    {[18, 14, 10, 6].map((d) => (
                      <div key={d} className="absolute -inset-[22px] rounded-[54px]" style={{ transform: `translateZ(-${d}px)`, background: 'linear-gradient(135deg,#3b3b44,#16161b 40%,#2b2b33 70%,#0d0d10)' }} />
                    ))}
                    <div className="absolute -inset-[22px] rounded-[54px] border border-white/15 bg-[#050507] shadow-[0_80px_140px_-30px_rgba(0,0,0,0.9),0_0_80px_-20px_rgba(110,91,255,0.45)]" />
                    <div className="absolute left-1/2 top-[-14px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#1f1f26]" />
                  </>
                )}
                <Screen w={w} />
                {/* Glare across the glass */}
                <div className="pointer-events-none absolute inset-0 rounded-[30px]" style={{ background: 'linear-gradient(118deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.0) 30%, transparent 70%, rgba(255,255,255,0.04) 100%)' }} />

                {/* Coins, for the payment */}
                <div className="absolute [transform-style:preserve-3d]" style={{ left: SIDE + 20 + 16 + GRID_X + 40, top: 330 }}>
                  {Array.from({ length: flat ? 0 : 8 }, (_, i) => (
                    <span key={i} data-b="coin" className="absolute h-9 w-9 rounded-full text-center text-[15px] font-extrabold leading-9 text-[#8a6418] opacity-0" style={{ background: 'radial-gradient(circle at 35% 30%, #fff4c9, #e9c565 45%, #b08427)', boxShadow: '0 0 20px rgba(245,196,81,0.6)' }}>
                      ₹
                    </span>
                  ))}
                </div>

                {/* Notifications, floating off the screen */}
                <div data-b="float" className={glass} style={{ left: TW - 120, top: 40, transform: 'translateZ(120px)' }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E86AB4]/20 text-[#E86AB4]">●</span>
                  <span className="leading-tight">
                    <span className="block text-[12px] text-white/55">Right now</span>
                    <span className="block text-[15px] font-semibold">{rupees(WEEK_TOTAL)} due this week</span>
                  </span>
                </div>
                <div data-b="float" className={glass} style={{ left: -90, top: 120, transform: 'translateZ(140px)' }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-[16px] font-bold text-[#052e16]">✓</span>
                  <span className="leading-tight">
                    <span className="block text-[12px] text-white/55">Netflix · auto-paid</span>
                    <span className="block text-[15px] font-semibold">₹649 paid</span>
                  </span>
                </div>
                <div data-b="float" className={glass} style={{ left: TW - 200, top: TH - 140, transform: 'translateZ(160px)', borderColor: 'rgba(239,68,68,0.6)' }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EF4444] text-[16px] font-bold">!</span>
                  <span className="leading-tight">
                    <span className="block text-[12px] text-[#fca5a5]">Electricity is 2 days late</span>
                    <span className="block text-[15px] font-semibold">{rupees(OVERDUE.amount)} overdue</span>
                  </span>
                </div>
                <div data-b="float" className={glass} style={{ left: TW - 160, top: 70, transform: 'translateZ(180px)', borderColor: 'rgba(34,197,94,0.6)' }}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-[16px] font-bold text-[#052e16]">✓</span>
                  <span className="leading-tight">
                    <span className="block text-[12px] text-white/55">Paid via UPI</span>
                    <span className="block text-[15px] font-semibold">0 late fees</span>
                  </span>
                </div>
                <div data-b="float" className={`${glass} flex-col items-start`} style={{ left: TW - 330, top: TH - 250, transform: 'translateZ(170px)', width: 280 }}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
                    {w.monthName} at a glance
                  </span>
                  <span className="text-[26px] font-bold leading-tight">{rupees(WEEK_TOTAL)}</span>
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full w-[46%] rounded-full bg-[#22C55E]" />
                  </span>
                  <span className="text-[12px] text-white/60">
                    <span className="text-[#22C55E]">{rupees(BILLS.filter((b) => b.status === 'paid' || b.status === 'overdue').reduce((t, b) => t + b.amount, 0))} paid</span> · next up: Spotify, tomorrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
