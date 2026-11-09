import gsap from 'gsap';
import type { Chapter, ChapterContext } from '../journey';
import type { PhoneScreenController } from '../splitStory/timeline';
import { AFTER_BUY, AFTER_COIN, GOLD } from './goldData';
import { drawGoldScreen, initialGoldState, type GoldAssets, type GoldState } from './goldScreen';

// Timeline positions are in units, which journey.ts turns into scroll distance.
const OPENING_UNITS = 2.4;
// One more full turn on from where the stock story left the phone
const START_ROT_Y = Math.PI * 4;
const END_ROT_Y = Math.PI * 6;
// Halfway round the phone's back is showing, so its screen can change unseen.
const SCREEN_TAKEOVER_AT = 1.1;
// Nearly square-on, so the app on the screen can be read while it still floats a little.
const READABLE = 0.92;
// How much of the phone's box its screen fills, measured off the model
const SCREEN_OF_BOX = { width: 0.526, height: 0.806 };
// The vault bar is drawn full at this many grams
const BAR_HOLDS = 1;

export interface GoldStoryRuntime {
  state: GoldState;
  assets: GoldAssets;
  screen: PhoneScreenController;
}

export function createGoldStoryRuntime(): GoldStoryRuntime {
  const runtime: GoldStoryRuntime = {
    state: initialGoldState(),
    assets: { hero: null, sans: 'sans-serif' },
    screen: {
      active: false,
      dirty: true,
      draw: (ctx, width, height) => drawGoldScreen(ctx, width, height, runtime.state, runtime.assets),
    },
  };
  return runtime;
}

type Point = { x: number; y: number };
type Pose = Point & { scale: number };

interface GoldLayout {
  narrow: boolean;
  phone: Pose;
  half: { w: number; h: number };
  bar: Point & { w: number; h: number; slant: number };
  vault: Point;
  box: Point & { w: number; h: number };
  coinPeak: Point;
}

function computeLayout(stage: HTMLElement, phoneBox: HTMLElement): GoldLayout {
  const W = Math.min(stage.offsetWidth, 1280);
  const H = Math.max(stage.offsetHeight, 600);
  const narrow = window.innerWidth < 768;
  const phone = narrow ? { x: 0, y: H * 0.24, scale: 0.68 } : { x: -W * 0.14, y: 0, scale: 1 };
  const half = {
    w: (phoneBox.offsetWidth * SCREEN_OF_BOX.width * phone.scale) / 2,
    h: (phoneBox.offsetHeight * SCREEN_OF_BOX.height * phone.scale) / 2,
  };

  if (narrow) {
    const top = -H / 2;
    return {
      narrow,
      phone,
      half,
      bar: { x: -W * 0.22, y: top + 168, w: 130, h: 58, slant: 14 },
      vault: { x: -W * 0.22, y: top + 222 },
      box: { x: W * 0.24, y: top + 186, w: 92, h: 66 },
      coinPeak: { x: 0, y: top + 104 },
    };
  }
  return {
    narrow,
    phone,
    half,
    bar: { x: W * 0.15, y: -30, w: 230, h: 100, slant: 22 },
    vault: { x: W * 0.15, y: 62 },
    box: { x: W * 0.35, y: 150, w: 132, h: 96 },
    coinPeak: { x: W * 0.26, y: -190 },
  };
}

type StoryOptions = Pick<ChapterContext, 'stage' | 'section' | 'phone'> & {
  tl: gsap.core.Timeline;
  runtime: GoldStoryRuntime;
};

// Fills the timeline with the gold story. Returns a function that fills the vault bar and writes
// the grams, to be called on every update.
function addGoldStory({ tl, stage, section, phone, runtime }: StoryOptions) {
  const root = stage.querySelector<HTMLElement>('[data-gold-story]');
  if (!root) return () => undefined;
  const one = <T extends Element = HTMLElement>(name: string) => root.querySelector<T>(`[data-g="${name}"]`)!;

  const L = computeLayout(stage, phone);
  const state = runtime.state;
  Object.assign(state, initialGoldState());

  const captions = Array.from(section.querySelectorAll<HTMLElement>('[data-gold-captions] [data-g="caption"]'));
  const props = one<SVGSVGElement>('props');
  const pour = one<SVGPathElement>('pour');
  const barClip = one<SVGPathElement>('bar-clip');
  const barBack = one<SVGPathElement>('bar-back');
  const barFill = one<SVGRectElement>('bar-fill');
  const barSurface = one<SVGRectElement>('bar-surface');
  const barMark = one<SVGTextElement>('bar-mark');
  const box = one<SVGGElement>('box');
  const boxBody = one<SVGRectElement>('box-body');
  const boxTape = one<SVGRectElement>('box-tape');
  const boxOpening = one<SVGRectElement>('box-opening');
  const boxLid = one<SVGRectElement>('box-lid');
  const vault = one('vault');
  const vaultGrams = one('vault-grams');
  const coin = one('coin');
  const label = one('label');

  // ---- Geometry ----
  const B = L.bar;
  const barTop = B.y - B.h / 2;
  const barBottom = B.y + B.h / 2;
  const bar = `M${B.x - B.w / 2} ${barBottom} L${B.x + B.w / 2} ${barBottom} L${B.x + B.w / 2 - B.slant} ${barTop} L${B.x - B.w / 2 + B.slant} ${barTop} Z`;
  barClip.setAttribute('d', bar);
  barBack.setAttribute('d', bar);
  barFill.setAttribute('x', String(B.x - B.w / 2));
  barFill.setAttribute('width', String(B.w));
  barSurface.setAttribute('x', String(B.x - B.w / 2));
  barSurface.setAttribute('width', String(B.w));
  barMark.setAttribute('x', String(B.x));
  barMark.setAttribute('y', String(B.y + 5));
  if (L.narrow) barMark.setAttribute('font-size', '9');

  const X = L.box;
  const boxTop = X.y - X.h / 2;
  boxBody.setAttribute('x', String(X.x - X.w / 2));
  boxBody.setAttribute('y', String(boxTop));
  boxBody.setAttribute('width', String(X.w));
  boxBody.setAttribute('height', String(X.h));
  boxTape.setAttribute('x', String(X.x - 10));
  boxTape.setAttribute('y', String(boxTop));
  boxTape.setAttribute('width', '20');
  boxTape.setAttribute('height', String(X.h));
  boxOpening.setAttribute('x', String(X.x - X.w / 2 + 6));
  boxOpening.setAttribute('y', String(boxTop + 4));
  boxOpening.setAttribute('width', String(X.w - 12));
  boxOpening.setAttribute('height', '10');
  // The lid fits just over the box's top, and waits above it until the coin is in
  const lidH = L.narrow ? 12 : 16;
  boxLid.setAttribute('x', String(X.x - X.w / 2 - 5));
  boxLid.setAttribute('y', String(boxTop - lidH + 4));
  boxLid.setAttribute('width', String(X.w + 10));
  boxLid.setAttribute('height', String(lidH));
  gsap.set(boxLid, { y: -70, rotation: -10, svgOrigin: `${X.x} ${boxTop}`, autoAlpha: 0 });

  // The pour leaves from the phone's side (or top, on small screens) and lands in the bar
  const edge = L.narrow
    ? { x: L.phone.x - 20, y: L.phone.y - L.half.h - 4 }
    : { x: L.phone.x + L.half.w + 4, y: L.phone.y - L.half.h * 0.45 };
  pour.setAttribute(
    'd',
    L.narrow
      ? `M${edge.x} ${edge.y} C${edge.x + 10} ${edge.y - 80} ${B.x + B.w / 2 + 40} ${barTop - 70} ${B.x + 16} ${barTop + 6}`
      : `M${edge.x} ${edge.y} C${edge.x + 110} ${edge.y - 50} ${B.x} ${barTop - 90} ${B.x} ${barTop + 6}`
  );

  // ---- Starting positions ----
  gsap.set(captions, { autoAlpha: 0, y: 18 });
  gsap.set(props, { autoAlpha: 0 });
  gsap.set(box, { autoAlpha: 0 });
  gsap.set([vault, coin, label], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
  gsap.set(vault, { x: L.vault.x, y: L.vault.y });
  gsap.set(coin, { x: B.x, y: B.y, scale: 0.6 });
  gsap.set(label, { x: X.x, y: X.y + 8, scale: 1.4, rotation: -6 });

  // ---- Helpers ----
  const caption = (i: number, inAt: number, outAt?: number) => {
    tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, inAt);
    if (outAt !== undefined) tl.to(captions[i], { autoAlpha: 0, y: -18, duration: 0.3, ease: 'power2.in' }, outAt);
  };
  const screen = (vars: Partial<GoldState>, start: number, duration: number, ease = 'power1.out') => {
    tl.to(state, { ...vars, duration, ease }, start);
  };
  const tap = (name: keyof GoldState, start: number) => {
    tl.fromTo(state, { [name]: 0 }, { [name]: 1, duration: 0.45, ease: 'none', immediateRender: false }, start);
  };

  // ================= Buy: rupees in, gold poured into your vault =================
  caption(0, 0.1, 4.4);
  tl.to(props, { autoAlpha: 1, duration: 0.4 }, 0.1);
  tl.to(vault, { autoAlpha: 1, duration: 0.4 }, 0.2);
  tap('tapBuy', 0.4);
  screen({ buy: 1 }, 0.6, 0.5, 'none');
  tl.to(state, { typed: GOLD.typed.length, duration: 0.6, ease: 'none' }, 1);
  tap('tapBuyGold', 1.85);
  screen({ summary: 1 }, 2.1, 0.45, 'none');
  tap('tapPay', 2.75);
  screen({ summary: 0, buy: 0 }, 3, 0.45, 'power1.in');
  tl.to(pour, { strokeDashoffset: 0, duration: 0.35, ease: 'power1.in' }, 3.05);
  tl.to(state, { grams: AFTER_BUY, duration: 0.8, ease: 'power1.inOut' }, 3.3);
  tl.to(pour, { strokeDashoffset: -1, duration: 0.35, ease: 'power1.out' }, 4.05);

  // ================= Deliver: a coin out of the vault, into a box =================
  caption(1, 4.6);
  tap('tapWithdraw', 4.55);
  screen({ delivery: 1 }, 4.75, 0.5, 'none');
  tl.to(box, { autoAlpha: 1, duration: 0.35 }, 4.9);
  tap('tapGet', 5.55);
  screen({ success: 1 }, 5.8, 0.5, 'power2.in');
  screen({ check: 1 }, 6.2, 0.4);
  // The coin lifts out of the bar, which drops by what it took, then flips over into the box
  tl.to(coin, { autoAlpha: 1, scale: 1, y: barTop - 30, duration: 0.4, ease: 'back.out(1.6)' }, 6.1);
  tl.to(state, { grams: AFTER_COIN, duration: 0.45, ease: 'power1.inOut' }, 6.1);
  tl.to(coin, { x: L.coinPeak.x, y: L.coinPeak.y, duration: 0.45, ease: 'power1.out' }, 6.5);
  tl.to(coin, { scaleX: -1, duration: 0.25, ease: 'none', yoyo: true, repeat: 1 }, 6.5);
  tl.to(coin, { x: X.x, y: boxTop + 10, scale: 0.8, duration: 0.4, ease: 'power2.in' }, 6.95);
  tl.set(coin, { autoAlpha: 0 }, 7.35);
  tl.to(boxLid, { autoAlpha: 1, duration: 0.1 }, 7.3);
  tl.to(boxLid, { y: 0, rotation: 0, duration: 0.35, ease: 'bounce.out' }, 7.3);
  tl.to(label, { autoAlpha: 1, scale: 1, rotation: -3, duration: 0.25, ease: 'power3.in' }, 7.75);
  tl.to({}, { duration: 0.01 }, 8.6);

  // Fills the bar to however much gold is in the vault
  let lastGrams = -1;
  return () => {
    if (state.grams === lastGrams) return;
    lastGrams = state.grams;
    const level = Math.max(0, Math.min(1, state.grams / BAR_HOLDS)) * B.h;
    barFill.setAttribute('y', String(barBottom - level));
    barFill.setAttribute('height', String(level));
    barSurface.setAttribute('y', String(barBottom - level));
    vaultGrams.textContent = state.grams.toFixed(4);
  };
}

// The Gold Savings chapter: the stock story clears, the phone turns once more, and its story follows.
export function createGoldChapter({ stage, section, phone, motion, goldRuntime }: ChapterContext): Chapter {
  const timeline = gsap.timeline({ defaults: { ease: 'none' } });

  const before = [stage.querySelector<HTMLElement>('[data-stock-story]'), section.querySelector<HTMLElement>('[data-stock-captions]')].filter(
    (el): el is HTMLElement => !!el
  );
  const opening = section.querySelector<HTMLElement>('[data-gold-captions] [data-g="chapter-opening"]');
  const name = section.querySelector<HTMLElement>('[data-gold-captions] [data-g="chapter-name"]');
  const tagline = section.querySelector<HTMLElement>('[data-gold-captions] [data-g="chapter-tagline"]');
  const L = computeLayout(stage, phone);

  gsap.set(opening, { autoAlpha: 1 });
  gsap.set(name, { yPercent: 110 });
  gsap.set(tagline, { autoAlpha: 0, y: 14 });

  timeline.to(before, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 0);
  timeline.fromTo(motion, { rotY: START_ROT_Y }, { rotY: END_ROT_Y, duration: 2.2, ease: 'power2.inOut', immediateRender: false }, 0);
  timeline.to(motion, { face: 0.5, duration: 1.1, ease: 'power2.out' }, 0);
  timeline.to(motion, { face: READABLE, duration: 1.1, ease: 'power2.inOut' }, 1.1);
  timeline.to(phone, { ...L.phone, duration: 1.2, ease: 'power2.inOut' }, 0.6);
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
      goldRuntime.screen.active = localTime >= SCREEN_TAKEOVER_AT;
      syncStoryDom();
    },
  };
}
