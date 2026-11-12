'use client';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CardPocket3D from './CardPocket3D';

gsap.registerPlugin(ScrollTrigger);

// Details come from the app's card catalogue (assets/data/Credit_cards.json).
const CARD_PICKS = [
  {
    category: 'Cashback',
    name: 'Airtel Axis Bank',
    backColor: '#101014',
    backText: '#F3F2F7',
    image: '/assets/images/cards/airtel-axis.webp',
    perks: ['25% cashback on Airtel mobile, WiFi and DTH', '10% cashback on utility bills', '10% cashback on Swiggy, BigBasket and Zomato'],
    fees: '₹500 joining · ₹500 annual',
  },
  {
    category: 'Shopping',
    name: 'Flipkart Axis Bank',
    backColor: '#0F1020',
    backText: '#F3F2F7',
    image: '/assets/images/cards/flipkart-axis.webp',
    perks: ['7.5% cashback on Myntra', '5% cashback on Flipkart and Cleartrip', '4% cashback at partners like Swiggy and Uber'],
    fees: '₹500 joining · ₹500 annual',
  },
  {
    category: 'Dining',
    name: 'EazyDiner IndusInd Bank',
    backColor: '#17171B',
    backText: '#F3F2F7',
    image: '/assets/images/cards/eazydiner-indusind.webp',
    perks: ['25% off dining bills paid via PayEazy', '3X EazyPoints on PayEazy payments', 'Complimentary EazyDiner Prime membership'],
    fees: '₹2,999 joining · ₹2,999 annual',
  },
  {
    category: 'Travel',
    name: 'IDFC FIRST Wealth',
    backColor: '#0B1A3A',
    backText: '#F3F2F7',
    image: '/assets/images/cards/idfc-wealth.webp',
    perks: ['8 domestic + 8 international lounge visits a year', 'Low 1.5% forex fee', 'Up to 10X reward points on spends above ₹20,000 a cycle'],
    fees: 'Lifetime free',
  },
  {
    category: 'Fuel',
    name: 'IndianOil HDFC Bank',
    backColor: '#8A5A12',
    backText: '#FFF8EA',
    image: '/assets/images/cards/indianoil-hdfc.webp',
    perks: ['5% fuel points at IndianOil outlets', '5% fuel points on groceries and bills', 'Complimentary XTRAREWARDS membership'],
    fees: '₹500 joining · ₹500 annual',
  },
];

const STEPS = [
  { title: 'Pick what you spend on', body: 'Cashback, travel, dining, fuel and more.' },
  { title: 'Compare what matters', body: 'Perks, joining fees and annual fees, before you decide.' },
  { title: 'Apply with the bank', body: 'You apply directly with the bank. We never apply for you.' },
];

export default function CreditCardSection() {
  const [selection, setSelection] = useState({ index: 0, tick: 0 });
  const activeIndex = selection.index;
  const pickCard = useCallback((index: number) => {
    setSelection((current) => ({ index, tick: current.tick + 1 }));
  }, []);
  const sectionRef = useRef<HTMLElement | null>(null);
  const active = CARD_PICKS[activeIndex];

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(sectionRef.current!.querySelectorAll('[data-card-reveal]'), {
        y: 28,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.09,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', once: true },
      });
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-credit-cards
      className="relative w-full max-w-7xl mx-auto mt-16 lg:mt-24 lg:min-h-[calc(100svh-72px)] grid grid-cols-1 lg:grid-cols-[minmax(0,350px)_minmax(0,1fr)_minmax(0,240px)] items-center gap-8 lg:gap-4 pointer-events-auto select-none"
    >
      {/* Copy and card finder */}
      <div className="flex flex-col items-start order-0 lg:order-1">
        <p data-card-reveal className="text-xs sm:text-sm font-medium text-[#FF9FFC]">Credit Cards</p>
        <h2 data-card-reveal className="mt-1.5 sm:mt-2 text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight leading-[1.15]">
          Unlock more with every swipe.
        </h2>
        <p data-card-reveal className="mt-3 sm:mt-4 text-xs xs:text-sm sm:text-base text-neutral-300 tracking-tight">
          133 credit cards in one place. Pick what you spend on, and BrokeNoMore shows you the cards that give it back.
        </p>

        <div data-card-reveal className="mt-5 sm:mt-6 w-full">
          <p className="text-xs font-medium text-neutral-400">Find your fit</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CARD_PICKS.map((card, index) => (
              <button
                key={card.category}
                type="button"
                aria-pressed={index === activeIndex}
                onClick={() => pickCard(index)}
                className={`px-2.5 xs:px-3 py-1.5 rounded-full border text-xs xs:text-[13px] font-medium cursor-pointer transition-colors duration-200 ${
                  index === activeIndex
                    ? 'bg-white text-black border-white'
                    : 'text-white border-white/25 hover:bg-white/10'
                }`}
              >
                {card.category}
              </button>
            ))}
          </div>
        </div>

        <div data-card-reveal className="mt-4 sm:mt-5 w-full" aria-live="polite">
          <h3 className="text-base sm:text-[17px] font-semibold text-white tracking-tight">{active.name}</h3>
          <ul className="mt-2 space-y-1.5">
            {active.perks.map((perk) => (
              <li key={perk} className="flex gap-2 text-xs xs:text-[13px] leading-snug text-neutral-300">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#FF9FFC]" aria-hidden="true" />
                {perk}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 sm:mt-3 text-xs text-neutral-400">{active.fees}</p>
        </div>
      </div>

      {/* Wallet */}
      <div className="relative order-1 lg:order-2 w-full h-[320px] xs:h-[380px] sm:h-[480px] lg:h-[min(680px,calc(100svh-96px))]">
        <div
          className="absolute inset-[15%] rounded-full bg-[#5227FF]/10 blur-[90px] pointer-events-none"
          aria-hidden="true"
        />
        <CardPocket3D cards={CARD_PICKS} selection={selection} onPick={pickCard} className="w-full h-full" />
      </div>

      {/* How it works */}
      <div className="order-2 lg:order-3 flex flex-col gap-5 sm:gap-6">
        <ol className="flex flex-col gap-6">
          {STEPS.map((step, index) => (
            <li key={step.title} data-card-reveal className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-xs font-medium text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-snug text-neutral-300">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p data-card-reveal className="text-[11px] leading-snug text-neutral-400">
          Benefits and fees are set by each bank and can change. Check the bank&apos;s terms before you apply.
        </p>
      </div>
    </section>
  );
}
