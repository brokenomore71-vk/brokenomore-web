'use client';

import React from 'react';
import { Avatar, PERSON_COLORS } from './screens';
import { FRIEND_BALANCES, FULL_NAMES, GROUP, GROUPS, NAMES, NET, NET_DEBTS, PAID, RAW_DEBTS, RECENT_SPLITS, rupees, type PersonId } from './groupData';

// The Split tab and settling up: the overview's cards, the group's own screens for the deck, and
// the table the four friends stand round while their debts are worked out and paid.

const TONE: Record<string, string> = { up: '#34d399', down: '#f05252', flat: '#85868c' };
const CARD = 'rounded-2xl border border-white/[0.07] bg-[#18181b]';

// ---------------------------------------------------------------------------------------------
// The overview: the Split tab's pieces, as cards on a wall

export function BalanceBanner() {
  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-6 text-[14px]">
          {['Create', 'Groups', 'Split'].map((t, i) => (
            <span key={t} className={`relative pb-2 ${i === 2 ? 'font-semibold text-white' : 'text-[#85868c]'}`}>
              {t}
              {i === 2 && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#6E5BFF]" />}
            </span>
          ))}
        </div>
        <span className="rounded-md bg-[#6E5BFF]/15 px-2 py-1 text-[11px] font-semibold text-[#a99dff]">3 groups · 5 friends</span>
      </div>
      <div className="flex items-end justify-between rounded-2xl border border-[#10b981]/60 bg-[#064e3b]/40 px-5 py-4">
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-[#34d399]">OVERALL BALANCE</p>
          <p className="mt-1 text-[30px] font-extrabold leading-none">
            You are owed <span data-w="owed">₹0</span>
          </p>
        </div>
        <p className="text-right text-[12px] text-[#a7f3d0]">
          ₹8,000 to collect
          <br />
          ₹1,250 to pay
        </p>
      </div>
    </div>
  );
}

function Members({ ids, size = 26 }: { ids: readonly string[]; size?: number }) {
  return (
    <span className="flex -space-x-2">
      {ids.map((id) => (
        <Avatar key={id} id={id} size={size} ring="#18181b" />
      ))}
    </span>
  );
}

export function GroupsCard() {
  return (
    <div className="flex h-full flex-col p-4">
      <p className="text-[17px] font-semibold">Your groups</p>
      <div className="mt-3 flex flex-1 flex-col justify-between gap-2">
        {GROUPS.map((g, i) => (
          <div key={g.name} data-w={i === 0 ? 'pick' : 'group'} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#121214] px-3 py-2.5">
            <Members ids={g.members} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{g.name}</span>
              <span className="block text-[11px] text-[#85868c]">{g.members.length} members</span>
            </span>
            <span className="text-[12px] font-semibold" style={{ color: TONE[g.tone] }}>
              {g.note}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentCard() {
  return (
    <div className="flex h-full flex-col p-4">
      <p className="text-[17px] font-semibold">Recent splits</p>
      <div className="mt-3 flex flex-1 flex-col justify-around gap-2">
        {RECENT_SPLITS.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#121214] px-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: i ? 'rgba(232,106,180,0.15)' : 'rgba(110,91,255,0.15)', color: i ? '#E86AB4' : '#8f80ff' }}>
              {i ? '⌖' : '='}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{r.name}</span>
              <span className="block text-[11px] text-[#85868c]">{r.meta}</span>
            </span>
            <span className="text-[15px] font-semibold tabular-nums">{rupees(r.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FriendCard({ f }: { f: (typeof FRIEND_BALANCES)[number] }) {
  return (
    <div data-w="friend" className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
      <Avatar id={f.id} size={52} letter={'letter' in f ? f.letter : undefined} ring={TONE[f.tone]} />
      <p className="text-[14px] font-semibold">{f.id === 'bharti' ? 'Bharti' : NAMES[f.id as PersonId]}</p>
      <p className="text-[12px] font-semibold" style={{ color: TONE[f.tone] }}>
        {f.note}
      </p>
    </div>
  );
}

export const WALL_CARD = CARD;

// ---------------------------------------------------------------------------------------------
// The table: the four friends stand round it while the group's debts are drawn, netted out and paid

// Where each friend stands on the table (a 400 × 400 plane)
const SPOT: Record<PersonId, { x: number; y: number }> = {
  you: { x: 200, y: 330 },
  atharva: { x: 68, y: 200 },
  parva: { x: 200, y: 70 },
  ruchi: { x: 332, y: 200 },
};
const TILT = 58;

// A line from one friend to another, bowed a little so no two overlap, stopping short of each
function arc(from: PersonId, to: PersonId, bow = 22) {
  const a = SPOT[from];
  const b = SPOT[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const s = { x: a.x + ux * 40, y: a.y + uy * 40 };
  const e = { x: b.x - ux * 46, y: b.y - uy * 46 };
  const mid = { x: (s.x + e.x) / 2 - uy * bow, y: (s.y + e.y) / 2 + ux * bow };
  return { d: `M${s.x.toFixed(1)} ${s.y.toFixed(1)} Q${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`, s, e, mid };
}

// Something standing up off the table at (x, y): turned back upright against the table's tilt
function Upright({ x, y, children, className = '', v }: { x: number; y: number; children: React.ReactNode; className?: string; v?: string }) {
  return (
    <div data-v={v} className={`absolute [transform-style:preserve-3d] ${className}`} style={{ left: x, top: y }}>
      <div className="absolute bottom-0 left-1/2 [transform-origin:50%_100%]" style={{ transform: `translateX(-50%) rotateX(-${TILT}deg)` }}>
        {children}
      </div>
    </div>
  );
}

export function SettleTable() {
  const people = GROUP.members;
  return (
    <div data-v="board" className="absolute inset-0 flex flex-col">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">{GROUP.name}</p>
      <div className="relative mt-2 h-[52px]">
        <p data-v="board-spent" className="absolute inset-0 text-[34px] font-bold leading-tight">
          <span data-v="spent">₹0</span> <span className="text-lg font-medium text-neutral-400">spent together</span>
        </p>
        <p data-v="board-owed" className="absolute inset-0 text-[34px] font-bold leading-tight opacity-0">
          You’re owed <span className="text-[#34d399]">₹8,000</span>
        </p>
        <p data-v="board-done" className="absolute inset-0 text-[34px] font-bold leading-tight opacity-0">
          <span className="text-[#34d399]">All settled</span> <span className="text-lg font-medium text-neutral-400">in 2 payments</span>
        </p>
      </div>

      <div className="relative flex-1 [perspective:1100px]">
        <div className="absolute left-1/2 top-[54%] h-[400px] w-[400px] [transform-style:preserve-3d]" style={{ transform: `translate(-50%,-50%) rotateX(${TILT}deg)` }}>
          {/* The table */}
          <div className="absolute inset-0 rounded-[48px] border border-white/10" style={{ background: 'radial-gradient(circle at 50% 45%, #22222a 0%, #141418 60%, #0d0d10 100%)', boxShadow: '0 0 0 1px rgba(110,91,255,0.15), 0 60px 80px rgba(0,0,0,0.7)' }} />
          <div className="absolute inset-6 rounded-[36px] opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* Balance rings round each friend's feet */}
          {people.map((id) => (
            <span
              key={id}
              data-v="ring"
              className="absolute h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
              style={{ left: SPOT[id].x, top: SPOT[id].y, background: `radial-gradient(circle, ${NET[id] > 0 ? 'rgba(52,211,153,0.55)' : NET[id] < 0 ? 'rgba(240,82,82,0.5)' : 'rgba(160,160,170,0.35)'} 0%, transparent 70%)` }}
            />
          ))}

          {/* Who owes whom: every payment, then the two that settle it */}
          <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <marker id="sp-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="#c4bcff" />
              </marker>
              <marker id="sp-head-net" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="#34d399" />
              </marker>
              <linearGradient id="sp-net" x1="0" x2="1">
                <stop offset="0" stopColor="#E86AB4" />
                <stop offset="1" stopColor="#34d399" />
              </linearGradient>
            </defs>
            {RAW_DEBTS.map((d) => (
              <path key={`${d.from}-${d.to}`} data-v="raw" d={arc(d.from, d.to).d} fill="none" stroke="#a99dff" strokeWidth="2.5" strokeDasharray="1" strokeDashoffset="1" pathLength={1} markerEnd="url(#sp-head)" />
            ))}
            {NET_DEBTS.map((d) => (
              <path key={`${d.from}-${d.to}`} data-v="net" d={arc(d.from, d.to, 0).d} fill="none" stroke="url(#sp-net)" strokeWidth="6" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1" pathLength={1} markerEnd="url(#sp-head-net)" />
            ))}
          </svg>

          {/* The trip's bills, dropped in front of whoever paid */}
          {GROUP.expenses.map((e) => (
            <Upright key={e.title} v="slip" x={SPOT[e.payer].x + (e.payer === 'ruchi' ? -54 : e.payer === 'atharva' ? 54 : 0)} y={SPOT[e.payer].y + (e.payer === 'parva' ? 50 : e.payer === 'you' ? -52 : 0)}>
              <span className="block whitespace-nowrap rounded-[4px] bg-[#f6f4ec] px-2 py-1 font-mono text-[11px] font-semibold text-[#26241f] shadow-[0_8px_16px_rgba(0,0,0,0.5)]">{rupees(e.amount)}</span>
            </Upright>
          ))}

          {/* What each payment is for, over its line */}
          {RAW_DEBTS.map((d) => {
            const m = arc(d.from, d.to).mid;
            return (
              <Upright key={`l-${d.from}-${d.to}`} v="raw-label" x={m.x} y={m.y} className="opacity-0">
                <span className="block whitespace-nowrap rounded-full bg-[#2a2547] px-2 py-0.5 text-[10px] font-semibold text-[#c4bcff]">{rupees(d.amount)}</span>
              </Upright>
            );
          })}
          {NET_DEBTS.map((d) => {
            const m = arc(d.from, d.to, 0).mid;
            return (
              <Upright key={`n-${d.from}-${d.to}`} v="net-label" x={m.x} y={m.y} className="opacity-0">
                <span className="block whitespace-nowrap rounded-full bg-[#34d399] px-2.5 py-1 text-[12px] font-bold text-[#062a1c] shadow-[0_8px_20px_-6px_#34d399]">{rupees(d.amount)}</span>
              </Upright>
            );
          })}

          {/* Coins on their way along the two payments */}
          {NET_DEBTS.map((d) => (
            <Upright key={`c-${d.from}`} v="pay-coin" x={SPOT[d.from].x} y={SPOT[d.from].y} className="opacity-0">
              <span className="block h-7 w-7 rounded-full text-center text-[13px] font-extrabold leading-7 text-[#9a6a0c]" style={{ background: 'radial-gradient(circle at 35% 30%, #fff1b8, #f5c451 50%, #c48a17)', boxShadow: '0 6px 14px rgba(245,196,81,0.6)' }}>
                ₹
              </span>
            </Upright>
          ))}

          {/* The four friends */}
          {people.map((id) => (
            <Upright key={id} v="friend" x={SPOT[id].x} y={SPOT[id].y}>
              <span className="flex flex-col items-center">
                <span data-v="chip" className="mb-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold opacity-0" style={{ background: NET[id] > 0 ? '#34d399' : NET[id] < 0 ? '#f05252' : '#3a3a40', color: NET[id] === 0 ? '#e4e4e7' : '#0b0b0d' }}>
                  <span data-v="chip-before">{NET[id] === 0 ? 'Settled' : `${NET[id] > 0 ? '+' : '−'}${rupees(Math.abs(NET[id]))}`}</span>
                </span>
                <Avatar id={id} size={54} ring={PERSON_COLORS[id]} />
                <span className="mt-1 rounded-full bg-black/60 px-2 text-[11px] font-semibold">{NAMES[id]}</span>
              </span>
            </Upright>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The group's screens, for the deck

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#131418] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)]">{children}</div>;
}
function Head({ title }: { title: string }) {
  return (
    <div className="px-5 pt-5">
      <p className="text-[11px] font-semibold tracking-[0.15em] text-white/50">SPLIT &amp; SETTLE</p>
      <p className="mt-1 text-[22px] font-bold">{title}</p>
    </div>
  );
}

function ExpensesScreen() {
  return (
    <Screen>
      <Head title={GROUP.name} />
      <div className="mx-5 mt-3 flex items-center justify-between rounded-2xl bg-[#1b1c21] px-4 py-3">
        <Members ids={GROUP.members} size={28} />
        <span className="text-right">
          <span className="block text-[11px] text-[#85868c]">Total spent</span>
          <span className="block text-[18px] font-bold tabular-nums">{rupees(GROUP.total)}</span>
        </span>
      </div>
      <p className="mx-5 mt-4 text-[15px] font-semibold">Shared Expenses</p>
      <div className="mx-5 mt-2 space-y-2">
        {GROUP.expenses.map((e) => (
          <div key={e.title} data-p="expense" className="flex items-center gap-3 rounded-xl bg-[#1b1c21] px-3 py-2.5">
            <Avatar id={e.payer} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{e.title}</span>
              <span className="block text-[11px] text-[#85868c]">Paid by {NAMES[e.payer]}</span>
            </span>
            <span className="text-[14px] font-bold tabular-nums">{rupees(e.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mx-5 mb-5 mt-auto flex justify-between rounded-xl border border-dashed border-white/10 px-4 py-3 text-[13px]">
        <span className="text-[#85868c]">Each person’s share</span>
        <span className="font-semibold">{rupees(GROUP.share)}</span>
      </div>
    </Screen>
  );
}

function BalancesScreen() {
  return (
    <Screen>
      <Head title={GROUP.name} />
      <div className="mx-5 mt-3 rounded-2xl border border-[#10b981] bg-[#064e3b]/40 px-4 py-3">
        <p className="text-[12px] font-semibold text-[#34d399]">OVERALL BALANCE</p>
        <p className="text-[24px] font-extrabold">
          You are owed <span data-p="owed">₹0</span>
        </p>
      </div>
      <p className="mx-5 mt-4 text-[15px] font-semibold">Group Members ({GROUP.members.length})</p>
      <div className="mx-5 mt-2 space-y-2">
        {GROUP.members.map((id) => {
          const n = NET[id];
          const note = id === 'you' ? `Owed ${rupees(n)}` : n < 0 ? `Owes you ${rupees(-n)}` : 'Settled';
          const color = id === 'you' ? '#34d399' : n < 0 ? (n < -3000 ? '#f05252' : '#f59e0b') : '#85868c';
          return (
            <div key={id} data-p="member" className="flex items-center gap-3 rounded-xl bg-[#1b1c21] px-3 py-2.5">
              <Avatar id={id} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{id === 'you' ? 'You (Host)' : FULL_NAMES[id]}</span>
                <span className="block text-[11px] text-[#85868c]">Paid {rupees(PAID[id])}</span>
              </span>
              <span className="text-[13px] font-semibold" style={{ color }}>
                {note}
              </span>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function NetScreen() {
  return (
    <Screen>
      <Head title="Who owes whom" />
      <div className="mx-5 mt-2 flex items-center gap-2 text-[12px]">
        <span data-p="net-count" className="rounded-full bg-[#2a2547] px-2.5 py-1 font-semibold text-[#c4bcff]">
          6 payments
        </span>
        <span data-p="net-arrow" className="text-[#85868c] opacity-0">
          → net debts →
        </span>
        <span data-p="net-after" className="rounded-full bg-[#34d399]/15 px-2.5 py-1 font-semibold text-[#34d399] opacity-0">
          2 payments
        </span>
      </div>
      <div className="relative mx-5 mt-3 flex-1">
        <div data-p="raw-list" className="space-y-1.5">
          {RAW_DEBTS.map((d) => (
            <div key={`${d.from}-${d.to}`} data-p="raw-row" className="flex items-center gap-2 rounded-xl bg-[#1b1c21] px-3 py-2 text-[12px]">
              <Avatar id={d.from} size={24} />
              <span className="text-[#85868c]">→</span>
              <Avatar id={d.to} size={24} />
              <span className="flex-1 truncate">
                {NAMES[d.from]} pays {d.to === 'you' ? 'you' : NAMES[d.to]}
              </span>
              <span className="font-semibold tabular-nums">{rupees(d.amount)}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 space-y-2.5">
          {NET_DEBTS.map((d) => (
            <div key={`${d.from}-${d.to}`} data-p="net-row" className="flex items-center gap-3 rounded-2xl border border-[#34d399]/50 bg-[#34d399]/10 px-3 py-3 opacity-0">
              <Avatar id={d.from} size={34} />
              <span className="text-lg text-[#34d399]">→</span>
              <Avatar id={d.to} size={34} />
              <span className="flex-1 text-[14px] font-semibold">
                {NAMES[d.from]} pays you
              </span>
              <span className="text-[16px] font-bold tabular-nums">{rupees(d.amount)}</span>
            </div>
          ))}
          <p data-p="net-note" className="px-1 pt-2 text-[12px] leading-relaxed text-[#85868c] opacity-0">
            Everything the four of you owe each other comes down to two transfers. Ruchi’s already square.
          </p>
        </div>
      </div>
    </Screen>
  );
}

function SettleScreen() {
  return (
    <Screen>
      <Head title="Settle up" />
      <div className="mx-5 mt-3 space-y-2.5">
        {NET_DEBTS.map((d) => (
          <div key={d.from} data-p="upi-row" className="flex items-center gap-3 rounded-2xl bg-[#1b1c21] px-3 py-3">
            <Avatar id={d.from} size={38} />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{FULL_NAMES[d.from]}</span>
              <span className="relative block h-4 text-[11px]">
                <span data-p="upi-wait" className="absolute inset-0 text-[#f59e0b]">
                  UPI request sent…
                </span>
                <span data-p="upi-paid" className="absolute inset-0 text-[#34d399] opacity-0">
                  Paid via UPI ✓
                </span>
              </span>
            </span>
            <span className="text-[16px] font-bold tabular-nums">{rupees(d.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center px-5 pb-2 text-center">
        <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="3" pathLength={1} data-p="settle-ring" strokeDasharray="1" strokeDashoffset="1" />
          <path d="M25 41l10 10 20-22" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} data-p="settle-tick" strokeDasharray="1" strokeDashoffset="1" />
        </svg>
        <p data-p="settle-done" className="mt-2 text-[20px] font-semibold opacity-0">
          {GROUP.name} is settled
        </p>
      </div>
      <div className="p-5">
        <div data-p="upi-btn" className="flex items-center justify-center rounded-full bg-[#6E5BFF] py-3 text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(110,91,255,0.9)]">
          Request Settle Up via UPI
        </div>
      </div>
    </Screen>
  );
}

export function SettleScreens() {
  return [<ExpensesScreen key="expenses" />, <BalancesScreen key="balances" />, <NetScreen key="net" />, <SettleScreen key="settle" />];
}

export { SPOT, arc };
