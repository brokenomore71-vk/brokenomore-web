import gsap from 'gsap';
import type { Chapter, ChapterContext } from '../journey';
import type { PhoneScreenController } from '../splitStory/timeline';
import { drawGoldScreen, initialGoldState, type GoldAssets, type GoldState } from './goldScreen';

// Timeline units for Gold Savings
const OPENING_UNITS = 2.4;
// The phone carries on from where the stock story left it: one more full 360° turn
const START_ROT_Y = Math.PI * 4;
const END_ROT_Y = Math.PI * 6;
// Halfway round the phone's back is showing, so its screen changes unseen
const SCREEN_TAKEOVER_AT = 1.1;
// High readability face factor for clear screen viewing
const READABLE = 0.92;

export interface GoldStoryRuntime {
  state: GoldState;
  assets: GoldAssets;
  screen: PhoneScreenController;
}

export function createGoldStoryRuntime(): GoldStoryRuntime {
  const runtime: GoldStoryRuntime = {
    state: initialGoldState(),
    assets: { homeImg: null, buyImg: null, sellImg: null, deliveryImg: null, sans: 'sans-serif' },
    screen: {
      active: false,
      dirty: true,
      draw: (ctx, width, height) => drawGoldScreen(ctx, width, height, runtime.state, runtime.assets),
    },
  };
  return runtime;
}

interface GoldLayout {
  narrow: boolean;
  phoneCenter: { x: number; y: number; scale: number };
  phoneSide: { x: number; y: number; scale: number };
  objectSide: { x: number; y: number; scale: number };
}

function computeLayout(stage: HTMLElement): GoldLayout {
  const W = Math.min(stage.offsetWidth, 1280);
  const H = Math.max(stage.offsetHeight, 600);
  const narrow = window.innerWidth < 768;

  if (narrow) {
    return {
      narrow,
      phoneCenter: { x: 0, y: H * 0.18, scale: 0.72 },
      phoneSide: { x: 0, y: H * 0.22, scale: 0.64 },
      objectSide: { x: 0, y: -H * 0.2, scale: 0.8 },
    };
  }

  return {
    narrow,
    phoneCenter: { x: 0, y: 0, scale: 1 },
    phoneSide: { x: -Math.max(W * 0.16, 180), y: 0, scale: 0.98 },
    objectSide: { x: Math.max(W * 0.22, 220), y: 0, scale: 1 },
  };
}

type StoryOptions = Pick<ChapterContext, 'stage' | 'section' | 'phone'> & {
  tl: gsap.core.Timeline;
  runtime: GoldStoryRuntime;
};

function addGoldStory({ tl, stage, section, phone, runtime }: StoryOptions) {
  const root = stage.querySelector<HTMLElement>('[data-gold-story]');
  if (!root) return () => undefined;

  const L = computeLayout(stage);
  const state = runtime.state;
  Object.assign(state, initialGoldState());

  const captions = Array.from(section.querySelectorAll<HTMLElement>('[data-gold-captions] [data-g="caption"]'));
  const ticker = root.querySelector<HTMLElement>('[data-g="ticker"]');
  const barGroup = root.querySelector<HTMLElement>('[data-g="bar-group"]');
  const coinGroup = root.querySelector<HTMLElement>('[data-g="coin-group"]');
  const payoutGroup = root.querySelector<HTMLElement>('[data-g="payout-group"]');

  // Initial states
  gsap.set(captions, { autoAlpha: 0, y: 18 });
  if (ticker) gsap.set(ticker, { autoAlpha: 0, y: -10, scale: 0.9 });
  if (barGroup) gsap.set(barGroup, { autoAlpha: 0, x: L.objectSide.x, y: L.objectSide.y, scale: 0.75, rotate: -6 });
  if (coinGroup) gsap.set(coinGroup, { autoAlpha: 0, x: L.objectSide.x, y: L.objectSide.y, scale: 0.75, rotate: 10 });
  if (payoutGroup) gsap.set(payoutGroup, { autoAlpha: 0, x: L.objectSide.x, y: L.objectSide.y + 20, scale: 0.85 });

  const caption = (i: number, inAt: number, outAt?: number) => {
    if (captions[i]) {
      tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, inAt);
      if (outAt !== undefined) {
        tl.to(captions[i], { autoAlpha: 0, y: -18, duration: 0.35, ease: 'power2.in' }, outAt);
      }
    }
  };

  const movePhone = (pose: { x: number; y: number; scale: number }, start: number, duration: number) => {
    tl.to(phone, { ...pose, duration, ease: 'power2.inOut' }, start);
  };

  // ---- Act 1: Live Vault & Price Ticker (Time 0 - 3.4) ----
  caption(0, 0.4, 3.2);
  tl.to(state, { home: 1, duration: 0.6 }, 0.2);
  movePhone(L.phoneCenter, 0.1, 1);
  if (ticker) {
    tl.to(ticker, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)' }, 0.5);
  }

  // ---- Act 2: Buying 24K Pure Gold & Bullion Bar (Time 3.4 - 7.0) ----
  tl.to(state, { tapBuy: 1, duration: 0.4 }, 3.4);
  caption(1, 3.8, 6.8);
  tl.to(state, { buyScreen: 1, duration: 0.7, ease: 'power2.inOut' }, 3.7);
  movePhone(L.phoneSide, 3.7, 1);

  // Gold bar materializes on the side
  if (barGroup) {
    tl.to(barGroup, { autoAlpha: 1, scale: L.objectSide.scale, rotate: 0, duration: 0.9, ease: 'back.out(1.5)' }, 3.9);
  }

  // Type in ₹2,500
  tl.to(state, { typedAmount: 1, duration: 1.2, ease: 'power1.inOut' }, 4.4);
  // Tap Confirm Buy
  tl.to(state, { tapConfirmBuy: 1, duration: 0.4 }, 5.6);
  // Buy success pop
  tl.to(state, { buySuccess: 1, duration: 0.7, ease: 'back.out(1.5)' }, 5.9);

  // ---- Act 3: Physical Minted Gold Delivery to Doorstep (Time 7.0 - 10.4) ----
  if (barGroup) {
    tl.to(barGroup, { autoAlpha: 0, scale: 0.7, duration: 0.45, ease: 'power2.in' }, 6.9);
  }
  caption(2, 7.3, 10.2);
  tl.to(state, { deliveryScreen: 1, duration: 0.7, ease: 'power2.inOut' }, 7.1);

  // 24K Minted Gold Coin glides in on the side
  if (coinGroup) {
    tl.to(coinGroup, { autoAlpha: 1, scale: L.objectSide.scale, rotate: 0, duration: 0.9, ease: 'back.out(1.4)' }, 7.4);
    // Subtle float / gleam rotation
    tl.to(coinGroup, { rotate: -4, duration: 1.8, ease: 'sine.inOut' }, 8.3);
  }

  // ---- Act 4: Instant Liquidity & UPI Sell (Time 10.4 - 13.8) ----
  if (coinGroup) {
    tl.to(coinGroup, { autoAlpha: 0, scale: 0.7, duration: 0.45, ease: 'power2.in' }, 10.3);
  }
  if (ticker) {
    tl.to(ticker, { autoAlpha: 0, duration: 0.3 }, 10.4);
  }
  caption(3, 10.7);
  tl.to(state, { sellScreen: 1, duration: 0.7, ease: 'power2.inOut' }, 10.5);

  // Payout card arrives
  if (payoutGroup) {
    tl.to(payoutGroup, { autoAlpha: 1, y: L.objectSide.y, scale: 1, duration: 0.7, ease: 'back.out(1.5)' }, 10.9);
  }
  tl.to(state, { sellSuccess: 1, duration: 0.6 }, 11.2);

  // Ending pose: phone glides back to center
  movePhone(L.phoneCenter, 12.8, 1);

  return () => {
    // Sync function called on each tick
  };
}

// The Gold Savings chapter: after the stocks analysis, rotates the phone once more,
// reveals the Gold Savings feature, and plays its interactive story.
export function createGoldChapter({ stage, section, phone, motion, goldRuntime }: ChapterContext): Chapter {
  const timeline = gsap.timeline({ defaults: { ease: 'none' } });

  const stockPieces = [
    stage.querySelector<HTMLElement>('[data-stock-story]'),
    section.querySelector<HTMLElement>('[data-stock-captions]'),
  ].filter((el): el is HTMLElement => !!el);

  const opening = section.querySelector<HTMLElement>('[data-gold-captions] [data-g="chapter-opening"]');
  const name = section.querySelector<HTMLElement>('[data-gold-captions] [data-g="chapter-name"]');
  const tagline = section.querySelector<HTMLElement>('[data-gold-captions] [data-g="chapter-tagline"]');
  const L = computeLayout(stage);

  gsap.set(opening, { autoAlpha: 1 });
  gsap.set(name, { yPercent: 110 });
  gsap.set(tagline, { autoAlpha: 0, y: 14 });

  // Fade out stock story pieces
  timeline.to(stockPieces, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 0);

  // Full 360° phone rotation: from START_ROT_Y (4 * PI) to END_ROT_Y (6 * PI)
  timeline.fromTo(
    motion,
    { rotY: START_ROT_Y },
    { rotY: END_ROT_Y, duration: 2.2, ease: 'power2.inOut', immediateRender: false },
    0
  );

  // Face adjusts to readable as it arrives
  timeline.to(motion, { face: 0.5, duration: 1.1, ease: 'power2.out' }, 0);
  timeline.to(motion, { face: READABLE, duration: 1.1, ease: 'power2.inOut' }, 1.1);
  timeline.to(phone, { ...L.phoneCenter, duration: 1.2, ease: 'power2.inOut' }, 0);

  // Chapter name & tagline reveal
  timeline.to(name, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 0.35);
  timeline.to(tagline, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.7);
  timeline.to(opening, { autoAlpha: 0, y: -18, duration: 0.3, ease: 'power2.in' }, OPENING_UNITS - 0.3);

  const story = gsap.timeline({ defaults: { ease: 'none' } });
  const syncStoryDom = addGoldStory({ tl: story, stage, section, phone, runtime: goldRuntime });
  timeline.add(story, OPENING_UNITS);

  return {
    timeline,
    update: (localTime) => {
      goldRuntime.screen.dirty = true;
      // Screen takeover happens halfway through the 360° turn when the back of the phone is facing viewer
      goldRuntime.screen.active = localTime >= SCREEN_TAKEOVER_AT;
      syncStoryDom();
    },
  };
}
