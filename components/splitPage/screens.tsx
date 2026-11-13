'use client';

import React from 'react';
import Image from 'next/image';
import { BILL, EQUAL, EQUAL_MEMBERS, FRIEND_LIST, ITEM_OWNERS, PEOPLE, TO_COLLECT, inr, itemWithTax } from '../splitStory/splitData';

// Split & Share, screen by screen, as the app shows it: the Create tab, Select Friends, Who Paid?
// and the split receipt for an Equal split; then Home, the bill scanner, the scanned bill, items
// tagged to friends and the split sent, for a Dutch one. The section's scroll timeline plays what
// happens on each; the parts it touches carry data-p names.

export const ACCENT = '#6E5BFF';
export const PERSON_COLORS: Record<string, string> = { you: '#6E5BFF', atharva: '#E86AB4', parva: '#38BDF8', ruchi: '#F5A524' };

export function Avatar({ id, size = 40, letter, ring }: { id: string; size?: number; letter?: string; ring?: string }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#8b7fe0] font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, boxShadow: ring ? `0 0 0 2px #131418, 0 0 0 4px ${ring}` : undefined }}
    >
      {letter ? letter : <Image src={`/assets/images/split/${id}.png`} alt="" width={size * 2} height={size * 2} className="h-full w-full object-cover" />}
    </span>
  );
}

function Screen({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#131418] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] ${className}`} style={style}>
      {children}
    </div>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <div className="relative flex items-center justify-center px-5 pb-3 pt-5">
      <span className="absolute left-5 text-xl text-white/90">‹</span>
      <p className="text-[17px] font-semibold">{title}</p>
    </div>
  );
}

function Button({ children, p, tone = 'accent', className = '' }: { children: React.ReactNode; p?: string; tone?: 'accent' | 'dark'; className?: string }) {
  return (
    <div
      data-p={p}
      className={`flex items-center justify-center rounded-full py-3 text-[15px] font-semibold ${tone === 'accent' ? 'bg-[#6E5BFF] shadow-[0_12px_30px_-10px_rgba(110,91,255,0.9)]' : 'border border-white/10 bg-[#1f2025]'} ${className}`}
    >
      {children}
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// ---- Equal ----

function CreateScreen() {
  return (
    <Screen>
      {/* The banner over the sheet, with the friends it's for */}
      <div className="relative h-[110px] shrink-0 overflow-hidden" style={{ background: 'linear-gradient(140deg,#b3a3ea 0%,#8f7ff0 45%,#6E5BFF 100%)' }}>
        <div className="absolute inset-x-0 bottom-5 flex justify-center -space-x-3">
          {['atharva', 'you', 'parva'].map((id) => (
            <Avatar key={id} id={id} size={52} ring="#a493d7" />
          ))}
        </div>
      </div>
      <div className="-mt-4 flex flex-1 flex-col rounded-t-[24px] bg-[#16171b] px-5 pt-4">
        <div className="flex items-center justify-center gap-1.5">
          <p className="text-[17px] font-semibold">Split Share</p>
          <span className="text-[11px] text-[#85868c]">ⓘ</span>
        </div>
        <div className="mt-3 grid grid-cols-3 text-center text-[13px]">
          {['Create', 'Groups', 'Split'].map((t, i) => (
            <span key={t} className={`relative pb-2 ${i === 0 ? 'font-semibold text-white' : 'text-[#85868c]'}`}>
              {t}
              {i === 0 && <span className="absolute inset-x-8 bottom-0 h-[3px] rounded-full bg-[#6E5BFF]" />}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 rounded-full bg-[#222328] p-1 text-center text-[13px] font-semibold">
          <span className="rounded-full bg-[#6E5BFF] py-1.5">Equal</span>
          <span className="py-1.5 text-[#85868c]">Dutch</span>
        </div>
        <p className="mt-5 text-center text-[12px] text-[#85868c]">Enter Amount</p>
        <p className="mt-1 text-center text-[38px] font-bold leading-none tabular-nums">
          ₹<span data-p="amt" className="text-[#5c5d63]">100.00</span>
        </p>
        <div className="mx-auto mt-4 w-[78%] rounded-xl border border-white/10 bg-[#1f2025] py-2.5 text-center text-[13px]">
          <span data-p="name" className="text-[#85868c]">Enter Split Name</span>
        </div>
        <Button p="split-btn" className="mx-auto mt-4 w-[48%]">
          Split
        </Button>
        <p className="mt-2 text-center text-[11px] text-[#85868c]">How does it work ⓘ</p>
        <p className="mt-4 text-[14px] font-semibold">Find Friends</p>
        <div className="mt-2 flex gap-2.5">
          <span className="flex h-[66px] w-[60px] items-center justify-center rounded-xl border border-[#6E5BFF] bg-[#1d1c3a] text-2xl text-[#8f80ff]">+</span>
          {PEOPLE.slice(1).map((p) => (
            <span key={p.id} className="flex h-[66px] w-[60px] flex-col items-center justify-center gap-1 rounded-xl bg-[#1f2025] text-[10px]">
              <Avatar id={p.id} size={30} />
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function FriendsScreen() {
  return (
    <Screen>
      <TopBar title="Select Friends" />
      <div className="mx-5 grid grid-cols-2 border-b border-white/10 text-center text-[14px]">
        <span className="relative pb-2 font-semibold">
          Friends
          <span className="absolute inset-x-6 -bottom-px h-[3px] rounded-full bg-[#6E5BFF]" />
        </span>
        <span className="pb-2 text-[#85868c]">Groups</span>
      </div>
      <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#1f2025] px-3 py-2.5 text-[13px] text-[#85868c]">
        <span>⌕</span>
        <span className="flex-1">Search for Friend</span>
        <span className="text-lg text-white">+</span>
      </div>
      <div className="mx-5 mt-4 flex-1 space-y-2.5">
        {FRIEND_LIST.map((f) => (
          <div key={f.id} data-p={f.pick >= 0 ? 'friend-row' : undefined} className="flex items-center gap-3 rounded-2xl border border-transparent bg-[#1f2025] px-3 py-2.5">
            <Avatar id={f.id} size={38} letter={'letter' in f ? f.letter : undefined} />
            <span className="flex-1 text-[14px] font-medium">{f.name}</span>
            <span data-p={f.pick >= 0 ? 'tick' : undefined} className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#55565c] text-transparent">
              <Check />
            </span>
          </div>
        ))}
      </div>
      <div className="p-5">
        <Button>Next</Button>
      </div>
    </Screen>
  );
}

function PaidScreen() {
  return (
    <Screen>
      <TopBar title="Who Paid?" />
      <div className="mx-5 mt-2 flex-1 space-y-2.5">
        {PEOPLE.slice(0, EQUAL_MEMBERS).map((p, i) => (
          <div key={p.id} data-p={i === 0 ? 'payer-row' : undefined} className="flex items-center gap-3 rounded-2xl border border-transparent bg-[#1f2025] px-3 py-3">
            <Avatar id={p.id} size={40} />
            <span className="flex-1 text-[15px] font-medium">{i === 0 ? 'You' : p.fullName}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#8a8a90]">
              <span data-p={i === 0 ? 'payer-dot' : undefined} className="h-3 w-3 scale-0 rounded-full bg-[#6E5BFF]" />
            </span>
          </div>
        ))}
        <div className="!mt-6 rounded-2xl border border-dashed border-white/10 p-4 text-center text-[12px] leading-relaxed text-[#85868c]">
          Whoever covered it gets paid back by everyone else.
        </div>
      </div>
      <div className="p-5">
        <Button p="submit">Submit</Button>
      </div>
    </Screen>
  );
}

function EqualReceiptScreen() {
  return (
    <Screen>
      <div className="flex items-center gap-3 px-5 pb-2 pt-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4a4b51] text-[9px] leading-tight text-[#c4c4ca]">bill</span>
        <p className="text-[17px] font-semibold">{EQUAL.splitName}</p>
      </div>
      <div className="mx-5 mt-2 rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(140deg,#6E5BFF 0%,#8B5CF6 55%,#E86AB4 120%)' }}>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-white/85">SPLIT BILL RECEIPT</p>
        <p className="mt-1 text-[30px] font-bold tabular-nums">
          ₹<span data-p="eq-total">0.00</span>
        </p>
        <p className="text-[12px] text-white/85">{EQUAL_MEMBERS} members sharing</p>
      </div>
      <p className="mx-5 mt-4 text-[10px] font-semibold tracking-[0.15em] text-[#85868c]">MEMBERS SHARE</p>
      <div className="mx-5 mt-2 space-y-2">
        {PEOPLE.slice(0, EQUAL_MEMBERS).map((p, i) => (
          <div key={p.id} data-p="share-row" className="flex items-center gap-3 rounded-xl bg-[#1b1c21] px-3 py-2.5">
            <Avatar id={p.id} size={30} />
            <span className="flex-1 text-[13px]">{i === 0 ? 'You' : p.fullName}</span>
            <span className="text-right">
              <span className="block text-[13px] font-semibold tabular-nums">{inr(EQUAL.shares[i])}</span>
              <span className={`text-[11px] font-medium ${i === 0 ? 'text-[#34d399]' : 'text-[#f05252]'}`}>{i === 0 ? 'Paid' : 'Unpaid'}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mx-5 mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-[16px] font-semibold">You Pay</span>
        <span className="text-[18px] font-bold text-[#8f80ff]">{inr(0)}</span>
      </div>
      <div className="mt-auto p-5">
        <Button tone="dark">Back to Home</Button>
      </div>
    </Screen>
  );
}

// ---- Dutch ----

function HomeScreen() {
  return (
    <Screen style={{ background: 'linear-gradient(180deg,#34367a 0%,#191a2c 55%,#101016 100%)' }}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative h-36 w-28 [perspective:600px]">
          <div className="sa-float absolute inset-0 rounded-md bg-[#f6f4ec] p-3 shadow-[0_30px_60px_rgba(0,0,0,0.6)] [transform:rotateX(14deg)_rotateY(-16deg)]">
            {[0.9, 0.6, 0.75, 0.5, 0.7, 0.55].map((w, i) => (
              <span key={i} className="mb-2 block h-1.5 rounded-full bg-[#26241f]/30" style={{ width: `${w * 100}%` }} />
            ))}
            <span className="mt-3 block h-2 w-full rounded-full bg-[#26241f]/60" />
          </div>
        </div>
        <p className="mt-8 text-[28px] font-semibold">Got a bill?</p>
        <p className="mt-1 text-[15px] text-[#a6a7ad]">Scan it and split it.</p>
      </div>
      <div className="p-6">
        <Button p="scan-btn">⌖&nbsp; Scan bill</Button>
      </div>
    </Screen>
  );
}

// A small paper copy of the bill, its lines as elements so they can be read and tagged
export function PaperBill({ mono, rows = 'p', scale = 1 }: { mono: string; rows?: string; scale?: number }) {
  return (
    <div
      className="relative rounded-[4px] px-[18px] pb-4 pt-5 text-[#26241f]"
      style={{
        fontFamily: mono,
        width: 270 * scale,
        fontSize: 11 * scale,
        background: 'linear-gradient(90deg,#e9e6dc 0%,#f8f6ee 10%,#fdfcf6 55%,#f5f3ea 92%,#e2dfd4 100%)',
        clipPath: 'polygon(0 6px, 3% 0, 6% 6px, 9% 0, 12% 6px, 15% 0, 18% 6px, 21% 0, 24% 6px, 27% 0, 30% 6px, 33% 0, 36% 6px, 39% 0, 42% 6px, 45% 0, 48% 6px, 51% 0, 54% 6px, 57% 0, 60% 6px, 63% 0, 66% 6px, 69% 0, 72% 6px, 75% 0, 78% 6px, 81% 0, 84% 6px, 87% 0, 90% 6px, 93% 0, 96% 6px, 100% 0, 100% 100%, 0 100%)',
      }}
    >
      <p className="text-center font-semibold" style={{ fontSize: 17 * scale }}>
        {BILL.merchant}
      </p>
      <p className="text-center text-[#46423a]" style={{ fontSize: 9.5 * scale }}>
        Indiranagar, Bengaluru
      </p>
      <div className="my-2 border-t border-dashed border-[#26241f]/50" />
      <div className="flex justify-between font-semibold text-[#46423a]" style={{ fontSize: 9 * scale }}>
        <span>ITEM</span>
        <span>AMOUNT</span>
      </div>
      <div className="mt-1.5 space-y-[3px]">
        {BILL.items.map((item, i) => (
          <div key={item.name} data-p={`${rows}-row`} className="relative flex justify-between rounded-[3px] px-1 py-[2px] font-medium" style={{ ['--owner' as string]: PERSON_COLORS[PEOPLE[ITEM_OWNERS[i]].id] }}>
            <span>
              {item.name} ×{item.qty}
            </span>
            <span className="tabular-nums">{item.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="my-2 border-t border-dashed border-[#26241f]/50" />
      <div className="flex justify-between text-[#46423a]">
        <span>CGST + SGST 5%</span>
        <span className="tabular-nums">{(BILL.cgst + BILL.sgst).toFixed(2)}</span>
      </div>
      <div data-p={`${rows}-total`} className="mt-1 flex justify-between rounded-[3px] px-1 py-[2px] font-semibold" style={{ fontSize: 15 * scale }}>
        <span>TOTAL</span>
        <span className="tabular-nums">₹{BILL.total.toFixed(2)}</span>
      </div>
      <div className="mx-auto mt-3 h-5 w-2/3" style={{ background: 'repeating-linear-gradient(90deg,#26241f 0 2px,transparent 2px 4px,#26241f 4px 5px,transparent 5px 8px)' }} />
    </div>
  );
}

function ScanScreen({ mono }: { mono: string }) {
  return (
    <Screen style={{ background: 'linear-gradient(180deg,#3a3530 0%,#0d0c0b 100%)' }}>
      <p className="pt-5 text-center text-[16px] font-semibold">Scan bill</p>
      <div className="relative mx-auto mt-4 flex flex-1 items-start justify-center">
        <div className="relative">
          <PaperBill mono={mono} rows="scan" scale={0.92} />
          {/* The scanner's line, sweeping down the bill */}
          <div data-p="scan-line" className="pointer-events-none absolute inset-x-[-10px] top-0 h-10 opacity-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(110,91,255,0.35) 70%, #8f80ff 100%)', boxShadow: '0 6px 18px rgba(143,128,255,0.8)' }} />
          {/* The viewfinder's corners */}
          {['left-[-14px] top-[-14px] border-l-2 border-t-2', 'right-[-14px] top-[-14px] border-r-2 border-t-2', 'left-[-14px] bottom-[-14px] border-b-2 border-l-2', 'right-[-14px] bottom-[-14px] border-b-2 border-r-2'].map((c) => (
            <span key={c} className={`absolute h-7 w-7 rounded-[6px] border-white ${c}`} />
          ))}
        </div>
      </div>
      <div className="m-4 flex items-center justify-between rounded-2xl bg-black/60 px-4 py-3 backdrop-blur">
        <span data-p="ocr-status" className="text-[15px] font-semibold">
          Finding the bill…
        </span>
        <span data-p="ocr-count" className="text-[13px] text-[#85868c]">
          0 of {BILL.items.length} items
        </span>
      </div>
    </Screen>
  );
}

function ItemRows({ tagged }: { tagged: boolean }) {
  return (
    <div className="mx-5 mt-3 space-y-2">
      {BILL.items.map((item, i) => {
        const owner = PEOPLE[ITEM_OWNERS[i]];
        return (
          <div key={item.name} data-p={tagged ? 'tag-row' : 'item-row'} className="flex items-center gap-3 rounded-xl bg-[#1b1c21] px-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium">{item.name}</span>
              <span className="block text-[10px] text-[#85868c]">Qty {item.qty}</span>
            </span>
            {tagged && (
              <span data-p="tag" className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 text-[11px] font-semibold" style={{ background: `${PERSON_COLORS[owner.id]}26`, color: PERSON_COLORS[owner.id] }}>
                <Avatar id={owner.id} size={20} />
                {owner.name}
              </span>
            )}
            <span className="w-[62px] text-right text-[13px] font-semibold tabular-nums">{inr(tagged ? itemWithTax(i) : item.amount, 0)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewScreen() {
  return (
    <Screen>
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <p className="text-[22px] font-semibold">Bill scanned</p>
          <p className="text-[12px] text-[#85868c]">
            {BILL.splitName} · {BILL.items.length} items
          </p>
        </div>
        <span className="rounded-md bg-[#34d399]/15 px-2 py-1 text-[11px] font-semibold text-[#34d399]">OCR</span>
      </div>
      <ItemRows tagged={false} />
      <div className="mx-5 mt-3 flex justify-between text-[12px] text-[#85868c]">
        <span>CGST + SGST</span>
        <span>{inr(BILL.cgst + BILL.sgst, 0)}</span>
      </div>
      <div className="mx-5 mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
        <span className="text-[16px]">Total</span>
        <span className="text-[26px] font-bold tabular-nums">
          ₹<span data-p="bill-total">0</span>
        </span>
      </div>
      <div className="mt-auto p-5">
        <Button>Split by item</Button>
      </div>
    </Screen>
  );
}

function TagScreen() {
  return (
    <Screen>
      <div className="px-5 pt-5">
        <p className="text-[22px] font-semibold">Who had what?</p>
        <p className="text-[12px] text-[#85868c]">Tap an item, pick a friend. Tax is shared out to match.</p>
      </div>
      <ItemRows tagged />
      <div className="mt-auto p-5">
        <Button p="request">Request {inr(TO_COLLECT, 0)}</Button>
      </div>
    </Screen>
  );
}

function SentScreen() {
  return (
    <Screen>
      <div className="flex flex-col items-center pt-10 text-center">
        <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="3" pathLength={1} data-p="sent-ring" strokeDasharray="1" strokeDashoffset="1" />
          <path d="M25 41l10 10 20-22" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} data-p="sent-tick" strokeDasharray="1" strokeDashoffset="1" />
        </svg>
        <p className="mt-4 text-[26px] font-semibold">Split sent</p>
        <p className="text-[14px] text-[#85868c]">{inr(TO_COLLECT)} to collect</p>
      </div>
      <div className="mx-5 mt-6 space-y-2.5">
        {PEOPLE.slice(1).map((p) => (
          <div key={p.id} data-p="sent-row" className="flex items-center gap-3 rounded-2xl bg-[#1b1c21] px-3 py-3">
            <Avatar id={p.id} size={38} />
            <span className="flex-1">
              <span className="block text-[14px] font-medium">{p.fullName}</span>
              <span className="block text-[11px] text-[#34d399]">Request sent</span>
            </span>
            <span className="text-[15px] font-semibold tabular-nums">{inr(p.dutch, 0)}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto p-5">
        <Button tone="dark">Done</Button>
      </div>
    </Screen>
  );
}

export function SplitScreens({ mono }: { mono: string }) {
  return [
    <CreateScreen key="create" />,
    <FriendsScreen key="friends" />,
    <PaidScreen key="paid" />,
    <EqualReceiptScreen key="receipt" />,
    <HomeScreen key="home" />,
    <ScanScreen key="scan" mono={mono} />,
    <ReviewScreen key="review" />,
    <TagScreen key="tag" />,
    <SentScreen key="sent" />,
  ];
}
