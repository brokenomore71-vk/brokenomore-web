'use client';

import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { IBM_Plex_Mono } from 'next/font/google';
import { glideBetweenLabels, pinned, usePointerVars } from '../scrollSteps';
import { useTypeOnShow } from '../useTypeOnShow';
import { BILL, CAPTIONS, EQUAL, EQUAL_MEMBERS, ITEM_OWNERS, PEOPLE, TO_COLLECT, inr, itemWithTax } from '../splitStory/splitData';
import { Avatar, PERSON_COLORS, PaperBill, SplitScreens } from './screens';
import CinemaHero from './CinemaHero';
// The tap-the-terminal hero, switched off for now:
// import TapHero from './TapHero';
import { BalanceBanner, GroupsCard, RecentCard, SettleScreens, SettleTable, SPOT, WALL_CARD } from './settle';
import { GROUP, NET, NET_DEBTS, SETTLE_CAPTIONS, rupees } from './groupData';

const plexMono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin', 'latin-ext'] });

// Split & Share, told its own way:
//   the hero (TapHero): everyone at the table reaches in and taps their own share onto a 3D card
//     terminal, then the headline types itself in above. (The torn-bill hero lives on in
//     SplitSectionTear, switched off.)
//   the journey (pinned, scrolled sideways): four rooms, one per part of the feature, panned
//     through left to right. Each has a checklist on the left (each step ticks off, the current one
//     types out what happens), the app's screen in the middle (turning over like a page to the
//     next), and what it means on the right:
//       01 Split equally: a pot of coins fills as the total's typed, then splits three ways
//       02 Go Dutch: the paper bill is scanned, and each item flies off to whoever had it
//       03 Settle up: a trip's balances on a 3D table, six payments netted to two, paid over UPI
//       04 The Split tab: every group, split and balance, fanned out in one place
// Every figure comes from the split story's data (splitStory/splitData) and groupData, and adds up.

export default function SplitSection() {
  return (
    <div id="split-share" className="relative w-full bg-black text-[#F5F5F5]">
      <CinemaHero />
      {/* A breath of dark between the opening shot and the steps */}
      <div aria-hidden="true" className="h-[14vh] min-h-[90px] sm:h-[20vh]" />
      <SplitJourney />
    </div>
  );
}

const EYEBROW = 'text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500';

// ---------------------------------------------------------------------------------------------
// The journey: four rooms, panned through sideways

const DECK_W = 400;
const DECK_H = 600;
const VIS_W = 460;
const VIS_H = 560;
const COINS = 12;
const STEP_SCROLL = 0.55;

const FINAL_CAPTIONS = [{ title: 'Every split, in one place.', body: 'Your groups, your recent splits and every friend’s balance, in the Split tab. One number tells you where you stand.' }];
const ROOMS = [
  { key: 'equal', num: '01', name: 'Split equally', captions: CAPTIONS.slice(0, 4), tint: 'rgba(110,91,255,0.2)' },
  { key: 'dutch', num: '02', name: 'Go Dutch', captions: CAPTIONS.slice(4, 9), tint: 'rgba(232,106,180,0.18)' },
  { key: 'settle', num: '03', name: 'Settle up', captions: SETTLE_CAPTIONS, tint: 'rgba(52,211,153,0.14)' },
  { key: 'tab', num: '04', name: 'The Split tab', captions: FINAL_CAPTIONS, tint: 'rgba(110,91,255,0.16)' },
];
// The step each room starts at
const ROOM_AT = ROOMS.reduce<number[]>((acc, r, i) => [...acc, i ? acc[i - 1] + ROOMS[i - 1].captions.length : 0], []);
const STEPS = ROOMS.reduce((t, r) => t + r.captions.length, 0); // 14
const DUTCH_AT = ROOM_AT[1];
const SETTLE_AT = ROOM_AT[2];
const TAB_AT = ROOM_AT[3];

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// The pot: what's being split, as coins, and the people it's split between
function Pot() {
  const people = PEOPLE.slice(0, EQUAL_MEMBERS);
  return (
    <div data-v="pot" className="absolute inset-0 flex flex-col rounded-[28px] border border-white/[0.08] bg-[#111113] p-6 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)]">
      <p className={EYEBROW}>The pot</p>
      <p className="mt-2 min-h-[28px] text-xl font-semibold" data-v="pot-name" />
      <p className="text-[44px] font-bold leading-tight tabular-nums">
        ₹<span data-v="pot-amt">0</span>
      </p>
      <div className="relative flex-1">
        <div className="absolute bottom-[54px] left-1/2 h-6 w-[78%] -translate-x-1/2 rounded-[50%] bg-[#6E5BFF]/20 blur-xl" />
        {Array.from({ length: COINS }, (_, k) => (
          <span
            key={k}
            data-v="coin"
            className="absolute bottom-[60px] left-1/2 h-[26px] w-[76px] rounded-[50%]"
            style={{
              background: 'radial-gradient(ellipse at 40% 35%, #fff1b8 0%, #f5c451 45%, #c48a17 100%)',
              boxShadow: '0 5px 0 #9a6a0c, 0 8px 12px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(154,106,12,0.5)',
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-[#9a6a0c]">₹</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {people.map((p, i) => (
          <div key={p.id} className="flex flex-col items-center">
            <span data-v="pot-person" className="relative">
              <Avatar id={p.id} size={52} ring={PERSON_COLORS[p.id]} />
              {i === 0 && (
                <span data-v="pot-paid" className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#34d399] px-2 py-0.5 text-[10px] font-bold text-[#062a1c] opacity-0">
                  Paid {inr(EQUAL.amount, 0)}
                </span>
              )}
            </span>
            <span className="mt-3 text-[13px] font-medium">{i === 0 ? 'You' : p.name}</span>
            <span data-v="pot-share" className="text-[13px] font-semibold tabular-nums opacity-0">
              {inr(EQUAL.shares[i])}
            </span>
            <span data-v="pot-status" className={`text-[11px] opacity-0 ${i === 0 ? 'text-[#34d399]' : 'text-[#f05252]'}`}>
              {i === 0 ? 'Your share' : 'Owes you'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The bill on the table, read and shared out to the friends who had each thing
function TableBill() {
  return (
    <div data-v="bill" className="absolute inset-0 flex flex-col items-center">
      <div className="relative mt-2 [perspective:1100px]">
        <div data-v="bill-paper" className="relative" style={{ transform: 'rotateX(16deg) rotateY(-12deg) rotateZ(-2deg)', transformStyle: 'preserve-3d' }}>
          <div className="drop-shadow-[0_40px_40px_rgba(0,0,0,0.7)]">
            <PaperBill mono={plexMono.style.fontFamily} rows="big" scale={1.08} />
          </div>
          <div data-v="beam" className="pointer-events-none absolute inset-x-[-12px] top-0 h-12 opacity-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(110,91,255,0.35) 70%, #8f80ff 100%)', boxShadow: '0 8px 22px rgba(143,128,255,0.9)' }} />
        </div>
      </div>
      <div className="mt-auto grid w-full grid-cols-4 gap-2">
        {PEOPLE.map((p) => (
          <div key={p.id} data-v="bucket" className="flex flex-col items-center rounded-2xl border border-white/[0.08] bg-[#111113] px-1 py-3 text-center">
            <Avatar id={p.id} size={40} ring={PERSON_COLORS[p.id]} />
            <span className="mt-2 text-[12px] font-medium">{p.name}</span>
            <span className="text-[15px] font-bold tabular-nums">
              ₹<span data-v="bucket-amt">0</span>
            </span>
            <span data-v="bucket-status" className="text-[10px] font-semibold opacity-0" style={{ color: p.id === 'you' ? '#a99dff' : '#34d399' }}>
              {p.id === 'you' ? 'Your share' : 'Requested ✓'}
            </span>
          </div>
        ))}
      </div>
      {/* Each item's share, on its way from the bill to whoever had it */}
      {BILL.items.map((item, i) => {
        const owner = PEOPLE[ITEM_OWNERS[i]];
        return (
          <span
            key={item.name}
            data-v="fly"
            className="pointer-events-none absolute left-0 top-0 flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-[12px] font-bold opacity-0"
            style={{ background: PERSON_COLORS[owner.id], color: '#0b0b0d', boxShadow: `0 8px 20px -6px ${PERSON_COLORS[owner.id]}` }}
          >
            <Avatar id={owner.id} size={22} />
            {inr(itemWithTax(i), 0)}
          </span>
        );
      })}
    </div>
  );
}

// The last room: the Split tab's cards, fanned out like a hand
function TabFan() {
  return (
    <div className="absolute inset-0">
      <div data-v="fan" className={`${WALL_CARD} absolute left-1/2 top-0 h-[176px] w-[860px] -translate-x-1/2`}>
        <BalanceBanner />
      </div>
      <div data-v="fan" className={`${WALL_CARD} absolute left-[10px] top-[210px] h-[260px] w-[420px]`} style={{ rotate: '-3deg' }}>
        <GroupsCard />
      </div>
      <div data-v="fan" className={`${WALL_CARD} absolute right-[10px] top-[210px] h-[260px] w-[420px]`} style={{ rotate: '3deg' }}>
        <RecentCard />
      </div>
    </div>
  );
}

function SplitJourney() {
  const sectionRef = useRef<HTMLElement | null>(null);
  usePointerVars(sectionRef);
  useTypeOnShow(sectionRef, '[data-y="cap"]', 30);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const p = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-p="${k}"]`));
    const v = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-v="${k}"]`));
    const y = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-y="${k}"]`));
    const x = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-x="${k}"]`));
    const one = (k: string) => p(k)[0];
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const [track] = x('track');
      const rooms = x('room');
      const inners = x('inner');
      const tints = x('tint');
      const cardFits = x('card-fit');
      const visFits = x('vis-fit');
      const cards = p('card');
      const dots = y('dot');
      const titles = y('title');
      const caps = y('cap');
      const coins = v('coin');
      const flies = v('fly');
      const buckets = v('bucket');
      const bigRows = p('big-row');
      const [bigTotal] = p('big-total');
      const scanRows = p('scan-row');
      const fans = v('fan');

      // Each room's screen and picture, fitted to it
      const fitTo = (el: HTMLElement, w: number, h: number) => {
        const box = el.parentElement!;
        return Math.min(1, (box.clientWidth * 0.96) / w, (box.clientHeight * 0.96) / h);
      };
      cardFits.forEach((f) => gsap.set(f, { xPercent: -50, yPercent: -50, scale: () => fitTo(f, DECK_W, DECK_H) }));
      visFits.forEach((f) => gsap.set(f, { xPercent: -50, yPercent: -50, scale: () => fitTo(f, Number(f.dataset.w), Number(f.dataset.h)) }));

      // ---- Starting state ----
      const roomOf = (step: number) => ROOM_AT.filter((a) => a <= step).length - 1;
      cards.forEach((c, k) => gsap.set(c, ROOM_AT.includes(k) ? { rotationY: 0, autoAlpha: 1 } : { rotationY: 95, autoAlpha: 0, transformPerspective: 1400 }));
      gsap.set(cards, { transformPerspective: 1400, transformOrigin: '50% 50%' });
      gsap.set(caps, { autoAlpha: 0, height: 0 });
      const ring = (r: number) => ROOMS[r].tint.replace(/0\.\d+\)$/, '1)');
      // Only the first room's first step is open; each room opens its own as you arrive
      gsap.set(caps[0], { autoAlpha: 1, height: 'auto' });
      gsap.set(titles[0], { color: '#ffffff' });
      gsap.set(dots[0], { borderColor: ring(0) });
      gsap.set(inners.slice(1), { rotationY: -16, scale: 0.9, autoAlpha: 0.35, transformPerspective: 1600 });
      gsap.set(tints.slice(1), { autoAlpha: 0 });
      coins.forEach((c, k) => gsap.set(c, { xPercent: -50, x: 0, y: -k * 8, autoAlpha: 0 }));
      gsap.set(v('pot-person').slice(1), { scale: 0, autoAlpha: 0 });
      gsap.set(v('slip'), { autoAlpha: 0 });
      gsap.set(p('net-row'), { autoAlpha: 0 });
      gsap.set(flies, { autoAlpha: 0 });
      gsap.set(fans, { autoAlpha: 0, y: 120, rotationX: -30, transformPerspective: 1200 });

      // ---- What's driven by number, written out on every update ----
      const typed = { amt: 0, name: 0 };
      const count = { eq: 0, ocr: 0, bill: 0 };
      const owed = PEOPLE.map(() => ({ v: 0 }));
      const group = { spent: 0, owed: 0, settled: 0, tab: 0 };
      const spentEl = v('spent')[0];
      const groupOwedEl = one('owed');
      const tabOwedEl = section.querySelector<HTMLElement>('[data-w="owed"]')!;
      const chipTexts = v('chip-before');
      const amtEl = one('amt');
      const nameEl = one('name');
      const potAmt = v('pot-amt')[0];
      const potName = v('pot-name')[0];
      const eqTotal = one('eq-total');
      const ocrCount = one('ocr-count');
      const ocrStatus = one('ocr-status');
      const billTotal = one('bill-total');
      const bucketAmts = v('bucket-amt');
      const render = () => {
        const digits = EQUAL.typed.slice(0, Math.round(typed.amt));
        amtEl.textContent = digits ? Number(digits).toLocaleString('en-IN') : '100.00';
        amtEl.style.color = digits ? '#ffffff' : '#5c5d63';
        potAmt.textContent = digits ? Number(digits).toLocaleString('en-IN') : '0';
        const name = EQUAL.splitName.slice(0, Math.round(typed.name));
        nameEl.textContent = name || 'Enter Split Name';
        nameEl.style.color = name ? '#ffffff' : '#85868c';
        potName.textContent = name;
        eqTotal.textContent = count.eq.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const read = Math.round(count.ocr);
        ocrCount.textContent = `${read} of ${BILL.items.length} items`;
        ocrCount.style.color = read === BILL.items.length ? '#34d399' : '#85868c';
        ocrStatus.textContent = read === 0 ? 'Finding the bill…' : read < BILL.items.length ? 'Reading bill…' : 'Bill read';
        billTotal.textContent = Math.round(count.bill).toLocaleString('en-IN');
        bucketAmts.forEach((el, i) => (el.textContent = Math.round(owed[i].v).toLocaleString('en-IN')));
        spentEl.textContent = rupees(group.spent);
        groupOwedEl.textContent = rupees(group.owed);
        tabOwedEl.textContent = rupees(group.tab);
        const done = group.settled > 0.5;
        GROUP.members.forEach((id, i) => {
          const n = NET[id];
          chipTexts[i].textContent = done ? (n > 0 ? `+${rupees(n)} received` : n < 0 ? 'Paid ✓' : 'Settled') : n === 0 ? 'Settled' : `${n > 0 ? '+' : '−'}${rupees(Math.abs(n))}`;
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: render,
        scrollTrigger: { ...pinned(section, STEPS, 9), end: () => `+=${window.innerHeight * STEP_SCROLL * STEPS}` },
      });
      const press = (el: Element, at: number) => {
        tl.to(el, { scale: 0.93, filter: 'brightness(1.3)', duration: 0.05 }, at);
        tl.to(el, { scale: 1, filter: 'brightness(1)', duration: 0.1 }, at + 0.06);
      };
      const select = (el: Element, color: string, at: number) =>
        tl.to(el, { borderColor: color, backgroundColor: 'rgba(110,91,255,0.12)', duration: 0.15 }, at);
      for (let c = 0; c <= STEPS; c++) tl.addLabel(`s${c}`, c);


      // Step by step: the checklist ticks on, and the screen turns over to the next, or the whole
      // journey pans on to the next room
      for (let c = 1; c < STEPS; c++) {
        const at = c + 0.02;
        const r = roomOf(c);
        // The checklist: the step that's done ticks, the next opens and types out
        if (roomOf(c - 1) === r) {
          tl.to(dots[c - 1], { backgroundColor: '#34d399', borderColor: '#34d399', color: '#062a1c', duration: 0.12 }, at);
          tl.to(titles[c - 1], { color: '#8b8b94', duration: 0.12 }, at);
          tl.to(caps[c - 1], { autoAlpha: 0, height: 0, duration: 0.2, ease: 'power2.inOut' }, at);
          tl.to(caps[c], { autoAlpha: 1, height: 'auto', duration: 0.25, ease: 'power2.inOut' }, at + 0.12);
          tl.to(titles[c], { color: '#ffffff', duration: 0.12 }, at + 0.1);
          tl.to(dots[c], { borderColor: ring(r), duration: 0.12 }, at + 0.1);
        } else {
          // Leaving a room: its last step ticks too, and the new room opens its first
          tl.to(dots[c - 1], { backgroundColor: '#34d399', borderColor: '#34d399', color: '#062a1c', duration: 0.12 }, at);
          tl.to(caps[c], { autoAlpha: 1, height: 'auto', duration: 0.25, ease: 'power2.inOut' }, at + 0.55);
          tl.to(titles[c], { color: '#ffffff', duration: 0.12 }, at + 0.5);
          tl.to(dots[c], { borderColor: ring(r), duration: 0.12 }, at + 0.5);
        }
        if (ROOM_AT.includes(c)) {
          // On to the next room: the whole track slides, the rooms swing past each other
          tl.to(track, { x: () => -r * rooms[0].offsetWidth, duration: 0.7, ease: 'power3.inOut' }, at);
          tl.to(inners[r - 1], { rotationY: 16, scale: 0.9, autoAlpha: 0.35, duration: 0.6, ease: 'power2.inOut' }, at);
          tl.to(inners[r], { rotationY: 0, scale: 1, autoAlpha: 1, duration: 0.6, ease: 'power2.inOut' }, at + 0.1);
          tl.to(tints[r - 1], { autoAlpha: 0, duration: 0.5 }, at);
          tl.to(tints[r], { autoAlpha: 1, duration: 0.5 }, at + 0.1);
        } else if (cards[c]) {
          // Within a room: the screen turns over like a page
          tl.to(cards[c - 1], { rotationY: -95, autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, at);
          tl.fromTo(cards[c], { rotationY: 95, autoAlpha: 0 }, { rotationY: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', immediateRender: false }, at + 0.22);
        }
      }

      // ---- 01 Split equally ----
      const stack = (k: number) => ({ x: 0, y: -k * 8 });
      const pile = (k: number) => ({ x: ((k % 3) - 1) * 128, y: -Math.floor(k / 3) * 8 });
      // ₹25,000 is keyed in, coin by coin into the pot, then the name, then Split
      tl.to(typed, { amt: EQUAL.typed.length, duration: 0.35, ease: `steps(${EQUAL.typed.length})` }, 0.1);
      tl.to(coins, { autoAlpha: 1, y: (k: number) => stack(k).y, startAt: { y: (k: number) => stack(k).y - 160, autoAlpha: 0 }, duration: 0.2, ease: 'bounce.out', stagger: 0.025 }, 0.1);
      tl.to(typed, { name: EQUAL.splitName.length, duration: 0.3, ease: `steps(${EQUAL.splitName.length})` }, 0.5);
      press(one('split-btn'), 0.85);
      // Atharva and Parva are ticked, and join the pot
      const ticks = p('tick');
      const friendRows = p('friend-row');
      const potPeople = v('pot-person');
      [0, 1].forEach((i) => {
        const at = 1.5 + i * 0.2;
        tl.to(ticks[i], { backgroundColor: '#6E5BFF', borderColor: '#6E5BFF', color: '#ffffff', duration: 0.1 }, at);
        select(friendRows[i], '#6E5BFF', at);
        tl.to(potPeople[i + 1], { scale: 1, autoAlpha: 1, duration: 0.25, ease: 'back.out(2.5)' }, at + 0.05);
      });
      // You paid
      select(one('payer-row'), '#6E5BFF', 2.5);
      tl.to(one('payer-dot'), { scale: 1, duration: 0.15, ease: 'back.out(3)' }, 2.55);
      tl.to(v('pot-paid')[0], { opacity: 1, y: 0, startAt: { y: 6 }, duration: 0.2 }, 2.65);
      press(one('submit'), 2.85);
      // The receipt: everyone's share, and the pot splits three ways
      tl.to(count, { eq: EQUAL.amount, duration: 0.35, ease: 'power2.out' }, 3.45);
      tl.from(p('share-row'), { autoAlpha: 0, y: 12, duration: 0.2, stagger: 0.06, immediateRender: false }, 3.5);
      tl.to(coins, { x: (k: number) => pile(k).x, y: (k: number) => pile(k).y, duration: 0.3, ease: 'power3.inOut', stagger: 0.015 }, 3.5);
      tl.to([...v('pot-share'), ...v('pot-status')], { opacity: 1, duration: 0.15, stagger: 0.04 }, 3.8);

      // ---- 02 Go Dutch ----
      // Got a bill? Scan it
      tl.to(one('scan-btn'), { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1 }, DUTCH_AT + 0.6);
      press(one('scan-btn'), DUTCH_AT + 0.88);
      // The scanner reads it: on the phone, and on the bill on the table
      const scan = DUTCH_AT + 1.45;
      const beams = [one('scan-line'), v('beam')[0]];
      tl.to(beams, { opacity: 1, duration: 0.05 }, scan);
      tl.fromTo(beams, { y: 0 }, { y: (_: number, el: HTMLElement) => (el.parentElement?.offsetHeight ?? 300) - 40, duration: 0.42, ease: 'power1.inOut', immediateRender: false }, scan);
      tl.to(beams, { opacity: 0, duration: 0.06 }, scan + 0.44);
      [...scanRows, ...bigRows].forEach((row, i) => {
        const k = i % BILL.items.length;
        tl.to(row, { backgroundColor: 'rgba(110,91,255,0.22)', boxShadow: '0 0 0 1px rgba(110,91,255,0.8)', duration: 0.05 }, scan + 0.06 + k * 0.065);
      });
      tl.to(count, { ocr: BILL.items.length, duration: 0.38, ease: `steps(${BILL.items.length})` }, scan + 0.04);
      // Every line, entered: the lines check out green, the total adds up
      const review = DUTCH_AT + 2.45;
      tl.from(p('item-row'), { autoAlpha: 0, x: -16, duration: 0.15, stagger: 0.05, immediateRender: false }, review);
      tl.to(count, { bill: BILL.total, duration: 0.35, ease: 'power2.out' }, review + 0.05);
      tl.to(bigRows, { backgroundColor: 'rgba(52,211,153,0.16)', boxShadow: '0 0 0 1px rgba(52,211,153,0.6)', duration: 0.1, stagger: 0.04 }, review + 0.1);
      tl.to(bigTotal, { backgroundColor: 'rgba(110,91,255,0.2)', boxShadow: '0 0 0 1.5px #6E5BFF', duration: 0.12 }, review + 0.35);
      // Each item is tagged to whoever had it, and flies off the bill to them
      const tag = DUTCH_AT + 3.45;
      tl.from(p('tag'), { scale: 0, autoAlpha: 0, duration: 0.12, stagger: 0.06, ease: 'back.out(3)', immediateRender: false }, tag);
      const fit = visFits[1];
      const local = (el: Element) => {
        const f = fit.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const s = f.width / fit.offsetWidth || 1;
        return { x: (r.left - f.left) / s, y: (r.top - f.top) / s, w: r.width / s, h: r.height / s };
      };
      BILL.items.forEach((_, i) => {
        const owner = ITEM_OWNERS[i];
        const at = tag + 0.04 + i * 0.08;
        tl.to(bigRows[i], { backgroundColor: `${PERSON_COLORS[PEOPLE[owner].id]}33`, boxShadow: `0 0 0 1px ${PERSON_COLORS[PEOPLE[owner].id]}`, duration: 0.06 }, at);
        tl.fromTo(
          flies[i],
          { x: () => { const r = local(bigRows[i]); return r.x + r.w - 40; }, y: () => { const r = local(bigRows[i]); return r.y - 4; }, autoAlpha: 0, scale: 0.6 },
          { autoAlpha: 1, scale: 1, duration: 0.06, immediateRender: false },
          at
        );
        tl.to(flies[i], { x: () => { const r = local(buckets[owner]); return r.x + r.w / 2 - 34; }, y: () => { const r = local(buckets[owner]); return r.y + 6; }, duration: 0.2, ease: 'power2.in' }, at + 0.07);
        tl.to(flies[i], { autoAlpha: 0, scale: 0.5, duration: 0.05 }, at + 0.27);
        tl.to(owed[owner], { v: `+=${itemWithTax(i)}`, duration: 0.06 }, at + 0.26);
        tl.fromTo(buckets[owner], { scale: 1 }, { scale: 1.08, duration: 0.04, yoyo: true, repeat: 1, immediateRender: false }, at + 0.26);
      });
      press(one('request'), tag + 0.5);
      // Sent: the requests go out
      const sent = DUTCH_AT + 4.45;
      tl.to([one('sent-ring'), one('sent-tick')], { strokeDashoffset: 0, duration: 0.2, stagger: 0.1 }, sent);
      tl.from(p('sent-row'), { autoAlpha: 0, y: 14, duration: 0.15, stagger: 0.06, immediateRender: false }, sent + 0.1);
      tl.to(v('bucket-status'), { opacity: 1, duration: 0.1, stagger: 0.05 }, sent + 0.15);
      tl.to(buckets.slice(1), { borderColor: 'rgba(52,211,153,0.6)', duration: 0.12, stagger: 0.05 }, sent + 0.15);

      // ---- 03 Settle up ----
      const chips = v('chip');
      const rings = v('ring');
      // The trip's bills land in front of whoever paid
      const ledger = SETTLE_AT + 0.45;
      tl.to(group, { spent: GROUP.total, duration: 0.4, ease: 'power2.out' }, ledger);
      tl.fromTo(v('slip'), { z: 140, autoAlpha: 0 }, { z: 0, autoAlpha: 1, duration: 0.25, ease: 'bounce.out', stagger: 0.08, immediateRender: false }, ledger);
      tl.from(p('expense'), { autoAlpha: 0, x: -16, duration: 0.15, stagger: 0.06, immediateRender: false }, ledger);
      // Everyone's balance: rings round their feet, chips over their heads
      const balances = SETTLE_AT + 1.45;
      tl.to(v('slip'), { autoAlpha: 0, z: 40, duration: 0.15, stagger: 0.03 }, balances);
      tl.fromTo(rings, { scale: 0.2, autoAlpha: 0 }, { scale: (i: number) => 0.7 + Math.abs(NET[GROUP.members[i]]) / 8000, autoAlpha: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.06, immediateRender: false }, balances + 0.05);
      tl.fromTo(chips, { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.2, ease: 'back.out(3)', stagger: 0.06, immediateRender: false }, balances + 0.12);
      tl.to(v('board-spent'), { opacity: 0, duration: 0.12 }, balances + 0.1);
      tl.to(v('board-owed'), { opacity: 1, duration: 0.15 }, balances + 0.2);
      tl.to(group, { owed: NET.you, duration: 0.35, ease: 'power2.out' }, balances);
      tl.from(p('member'), { autoAlpha: 0, x: -16, duration: 0.15, stagger: 0.06, immediateRender: false }, balances);
      // Every payment between them, then netted down to two
      const netting = SETTLE_AT + 2.4;
      tl.to(v('raw'), { strokeDashoffset: 0, duration: 0.2, stagger: 0.04 }, netting);
      tl.to(v('raw-label'), { opacity: 1, duration: 0.1, stagger: 0.04 }, netting + 0.08);
      tl.to([...v('raw'), ...v('raw-label')], { opacity: 0, duration: 0.15 }, netting + 0.4);
      tl.to(v('net'), { strokeDashoffset: 0, duration: 0.2, stagger: 0.08 }, netting + 0.45);
      tl.to(v('net-label'), { opacity: 1, duration: 0.12, stagger: 0.08 }, netting + 0.55);
      tl.to(p('raw-list'), { autoAlpha: 0, y: -12, duration: 0.15 }, netting + 0.4);
      tl.to(p('net-arrow'), { opacity: 1, duration: 0.1 }, netting + 0.4);
      tl.to(p('net-after'), { opacity: 1, duration: 0.1 }, netting + 0.45);
      tl.to(p('net-row'), { autoAlpha: 1, duration: 0.15, stagger: 0.08 }, netting + 0.48);
      tl.to(p('net-note'), { opacity: 1, duration: 0.15 }, netting + 0.6);
      // Settle up over UPI: the coins travel, and everyone's square
      const pay = SETTLE_AT + 3.45;
      press(one('upi-btn'), pay);
      const coinEls = v('pay-coin');
      NET_DEBTS.forEach((d, i) => {
        const at = pay + 0.08 + i * 0.1;
        tl.to(coinEls[i], { autoAlpha: 1, duration: 0.04 }, at);
        tl.to(coinEls[i], { x: SPOT[d.to].x - SPOT[d.from].x, y: SPOT[d.to].y - SPOT[d.from].y, duration: 0.22, ease: 'power2.inOut' }, at);
        tl.to(coinEls[i], { autoAlpha: 0, duration: 0.05 }, at + 0.22);
      });
      tl.to(group, { settled: 1, duration: 0.01 }, pay + 0.35);
      tl.to(chips.slice(1, 3), { backgroundColor: '#34d399', duration: 0.1 }, pay + 0.35);
      tl.to(rings.slice(1, 3), { autoAlpha: 0, duration: 0.15 }, pay + 0.35);
      tl.to(v('net-label'), { opacity: 0, duration: 0.1 }, pay + 0.38);
      tl.to(p('upi-wait'), { opacity: 0, duration: 0.08, stagger: 0.1 }, pay + 0.3);
      tl.to(p('upi-paid'), { opacity: 1, duration: 0.08, stagger: 0.1 }, pay + 0.32);
      tl.to([one('settle-ring'), one('settle-tick')], { strokeDashoffset: 0, duration: 0.15, stagger: 0.08 }, pay + 0.38);
      tl.to(p('settle-done'), { opacity: 1, duration: 0.1 }, pay + 0.45);
      tl.to(v('board-owed'), { opacity: 0, duration: 0.1 }, pay + 0.4);
      tl.to(v('board-done'), { opacity: 1, duration: 0.12 }, pay + 0.45);

      // ---- 04 The Split tab: its cards fan in, and your overall balance counts up ----
      tl.to(fans, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.45, ease: 'back.out(1.3)', stagger: 0.1 }, TAB_AT + 0.35);
      tl.to(group, { tab: 8000, duration: 0.4, ease: 'power2.out' }, TAB_AT + 0.5);
      tl.set({}, {}, STEPS);

      render();
      // Coming into view: the first room's columns rise up into place, one after another, before
      // the section pins
      const firstCols = rooms[0].querySelectorAll<HTMLElement>('[data-x="col"]');
      const entrance = gsap.fromTo(
        firstCols,
        { y: 160, autoAlpha: 0, rotationX: 18, transformPerspective: 1200, transformOrigin: '50% 100%' },
        {
          y: 0,
          autoAlpha: 1,
          rotationX: 0,
          ease: 'power2.out',
          stagger: 0.18,
          scrollTrigger: { trigger: section, start: 'top 95%', end: 'top 80px', scrub: 0.6 },
        }
      );
      const unglide = glideBetweenLabels(tl);
      return () => {
        unglide();
        entrance.scrollTrigger?.kill();
        entrance.kill();
      };
    });
    return () => mm.revert();
  }, []);

  const screens = [...SplitScreens({ mono: plexMono.style.fontFamily }), ...SettleScreens()];
  const visuals = [
    { el: <Pot />, w: VIS_W, h: VIS_H },
    { el: <TableBill />, w: VIS_W, h: VIS_H },
    { el: <SettleTable />, w: VIS_W, h: VIS_H },
  ];

  return (
    <section ref={sectionRef} aria-label="How Split & Share works" className="relative h-[calc(100svh-72px)] w-full overflow-hidden select-none motion-reduce:h-auto">
      {/* It picks up where the opening shot fades out: the room's light rises out of the dark */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[22%] bg-gradient-to-b from-black to-transparent" />
      {/* Each room's light */}
      {ROOMS.map((r) => (
        <div key={r.key} data-x="tint" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 55% 55% at 62% 50%, ${r.tint}, transparent 70%)` }} />
      ))}

      <div data-x="track" className="absolute inset-0 flex motion-reduce:static motion-reduce:flex-col">
        {ROOMS.map((room, ri) => {
          const first = ROOM_AT[ri];
          return (
            <div key={room.key} data-x="room" className="relative h-full w-full shrink-0 motion-reduce:h-auto motion-reduce:py-16">
              <div data-x="inner" className="mx-auto grid h-full max-w-7xl grid-rows-[auto_1fr] gap-4 px-4 pb-6 pt-6 sm:px-8 md:grid-cols-[minmax(260px,0.85fr)_minmax(0,1fr)_minmax(0,1.1fr)] md:grid-rows-1 md:items-center md:gap-8 md:pb-4 md:pt-4">
                {/* The checklist */}
                <div data-x="col" className="relative z-10">
                  <div className="flex items-end gap-3">
                    <span className="text-[56px] font-bold leading-none text-transparent sm:text-[88px]" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.28)' }}>
                      {room.num}
                    </span>
                    <span className="pb-2 sm:pb-3">
                      <span className={EYEBROW}>Split &amp; Share</span>
                      <span className="block text-2xl font-semibold tracking-tight sm:text-[34px]">{room.name}</span>
                    </span>
                  </div>
                  <ol className="mt-4 space-y-2.5 sm:mt-7 sm:space-y-4">
                    {room.captions.map((c) => (
                      <li key={c.title} data-y="step" className="relative pl-9">
                        <span data-y="dot" className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/20 text-transparent">
                          <Check />
                        </span>
                        <h3 data-y="title" className="text-[14px] font-semibold leading-snug text-[#5f5f68] sm:text-[18px]">
                          {c.title}
                        </h3>
                        <div data-y="cap" className="overflow-hidden">
                          <p className="pt-1 text-[13px] leading-relaxed text-neutral-400 sm:text-[15px]">{c.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {room.key === 'tab' ? (
                  // The last room: the Split tab, fanned out across the screen and the picture both
                  <div className="relative min-h-0 md:col-span-2 md:h-full">
                    <div data-x="vis-fit" data-w="880" data-h="480" className="absolute left-1/2 top-1/2 [perspective:1400px]" style={{ width: 880, height: 480 }}>
                      <TabFan />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* The app's screen, turning over to the next */}
                    <div data-x="col" className="relative min-h-0 md:h-full [perspective:1600px]">
                      <div className="absolute inset-0" style={{ transform: 'rotateX(calc(var(--py, 0) * -3deg)) rotateY(calc(var(--px, 0) * 5deg))', transformStyle: 'preserve-3d' }}>
                        <div data-x="card-fit" className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]" style={{ width: DECK_W, height: DECK_H }}>
                          {screens.slice(first, first + room.captions.length).map((screen, k) => (
                            <div key={k} data-p="card" className="absolute inset-0 [backface-visibility:hidden]">
                              {screen}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* What it means */}
                    <div data-x="col" className="relative hidden min-h-0 md:block md:h-full [perspective:1600px]">
                      <div className="absolute inset-0" style={{ transform: 'rotateX(calc(var(--py, 0) * -3deg)) rotateY(calc(var(--px, 0) * 6deg))', transformStyle: 'preserve-3d' }}>
                        <div data-x="vis-fit" data-w={visuals[ri].w} data-h={visuals[ri].h} className="absolute left-1/2 top-1/2" style={{ width: visuals[ri].w, height: visuals[ri].h }}>
                          {visuals[ri].el}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <span className="sr-only">
        {inr(TO_COLLECT, 0)} to collect from {PEOPLE.length - 1} friends.
      </span>
    </section>
  );
}
