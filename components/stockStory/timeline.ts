import gsap from 'gsap';
import type { Chapter, ChapterContext } from '../journey';
import type { PhoneScreenController } from '../splitStory/timeline';
import { SEARCH, WEIGHTS } from './stockData';
import { drawStockScreen, initialStockState, type StockAssets, type StockState } from './stockScreen';

// Timeline positions are in units, which journey.ts turns into scroll distance.
const OPENING_UNITS = 2.4;
// The phone carries on from where the split story left it: one more full turn
const START_ROT_Y = Math.PI * 2;
const END_ROT_Y = Math.PI * 4;
// Halfway round the phone's back is showing, so its screen can change unseen.
const SCREEN_TAKEOVER_AT = 1.1;
// Nearly square-on, so the app on the screen can be read while it still floats a little.
const READABLE = 0.92;
// How much of the phone's box its screen fills, measured off the model
const SCREEN_OF_BOX = { width: 0.526, height: 0.806 };
// Degrees the beam tips for each weight's worth of difference between the pans
const TILT_PER_WEIGHT = 6;

export interface StockStoryRuntime {
  state: StockState;
  assets: StockAssets;
  screen: PhoneScreenController;
}

export function createStockStoryRuntime(): StockStoryRuntime {
  const runtime: StockStoryRuntime = {
    state: initialStockState(),
    assets: { logo: null, sans: 'sans-serif' },
    screen: {
      active: false,
      dirty: true,
      draw: (ctx, width, height) => drawStockScreen(ctx, width, height, runtime.state, runtime.assets),
    },
  };
  return runtime;
}

type Point = { x: number; y: number };
type Pose = Point & { scale: number };

interface StockLayout {
  narrow: boolean;
  phone: Pose; // where the phone sits once the scale is out
  center: Pose; // where it sits on its own
  half: { w: number; h: number }; // half the phone screen's size at `phone`
  scale: { pivot: Point; arm: number; string: number; pan: number; foot: number; weightH: number };
}

// Positions are offsets from the middle of the stage.
function computeLayout(stage: HTMLElement, phoneBox: HTMLElement): StockLayout {
  const W = Math.min(stage.offsetWidth, 1280);
  const H = Math.max(stage.offsetHeight, 600);
  const narrow = window.innerWidth < 768;
  const half = (p: Pose) => ({
    w: (phoneBox.offsetWidth * SCREEN_OF_BOX.width * p.scale) / 2,
    h: (phoneBox.offsetHeight * SCREEN_OF_BOX.height * p.scale) / 2,
  });

  if (narrow) {
    const top = -H / 2;
    const phone = { x: 0, y: H * 0.24, scale: 0.68 };
    return {
      narrow,
      phone,
      center: { x: 0, y: H * 0.17, scale: 0.8 },
      half: half(phone),
      scale: { pivot: { x: 0, y: top + 150 }, arm: Math.min(W * 0.3, 120), string: 116, pan: 112, foot: top + 292, weightH: 26 },
    };
  }

  const phone = { x: -W * 0.14, y: 0, scale: 1 };
  return {
    narrow,
    phone,
    center: { x: 0, y: 0, scale: 1 },
    half: half(phone),
    scale: { pivot: { x: W * 0.2, y: -120 }, arm: 170, string: 130, pan: 170, foot: 210, weightH: 34 },
  };
}

type StoryOptions = Pick<ChapterContext, 'stage' | 'section' | 'phone'> & {
  tl: gsap.core.Timeline;
  runtime: StockStoryRuntime;
};

// Fills the timeline with the stock story. Returns a function that lays out the scale, to be
// called on every update.
function addStockStory({ tl, stage, section, phone, runtime }: StoryOptions) {
  const root = stage.querySelector<HTMLElement>('[data-stock-story]');
  if (!root) return () => undefined;
  const all = <T extends Element = HTMLElement>(name: string) => Array.from(root.querySelectorAll<T>(`[data-k="${name}"]`));
  const one = <T extends Element = HTMLElement>(name: string) => root.querySelector<T>(`[data-k="${name}"]`)!;

  const L = computeLayout(stage, phone);
  const S = L.scale;
  const state = runtime.state;
  Object.assign(state, initialStockState());
  // The scale's own numbers: how far in it is, and how far each weight has travelled
  const scale = { shown: 0, weights: WEIGHTS.map(() => ({ t: 0 })) };

  const captions = Array.from(section.querySelectorAll<HTMLElement>('[data-stock-captions] [data-k="caption"]'));
  const svg = one<SVGSVGElement>('scale');
  const stand = one<SVGPathElement>('stand');
  const strings = one<SVGPathElement>('strings');
  const beam = one<SVGLineElement>('beam');
  const pivot = one<SVGCircleElement>('pivot');
  const pans = [one<SVGPathElement>('pan-left'), one<SVGPathElement>('pan-right')];
  const panLabels = all('pan-label');
  const weights = all('weight');
  const verdict = one('verdict');

  // ---- Helpers ----
  const caption = (i: number, inAt: number, outAt?: number) => {
    tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, inAt);
    if (outAt !== undefined) tl.to(captions[i], { autoAlpha: 0, y: -18, duration: 0.3, ease: 'power2.in' }, outAt);
  };
  const screen = (vars: Partial<StockState>, start: number, duration: number, ease = 'power1.out') => {
    tl.to(state, { ...vars, duration, ease }, start);
  };
  const tap = (name: keyof StockState, start: number) => {
    tl.fromTo(state, { [name]: 0 }, { [name]: 1, duration: 0.45, ease: 'none', immediateRender: false }, start);
  };

  // ---- Starting positions ----
  gsap.set(captions, { autoAlpha: 0, y: 18 });
  gsap.set([...weights, ...panLabels, verdict], { xPercent: -50, yPercent: -50, x: 0, y: 0, autoAlpha: 0 });
  gsap.set(svg, { autoAlpha: 0 });

  // ================= Find it =================
  screen({ explore: 1 }, 0, 0.4, 'none');
  caption(0, 0.1, 3.1);
  tap('tapSearch', 0.2);
  screen({ search: 1 }, 0.35, 0.4, 'none');
  tl.to(state, { typed: SEARCH.query.length, duration: 0.8, ease: 'none' }, 0.6);
  screen({ results: 1 }, 1.35, 0.35, 'none');
  tap('tapResult', 1.75);
  screen({ detail: 1 }, 2, 0.5, 'none');
  screen({ chart: 1 }, 2.3, 0.8, 'none');

  // ================= Weighed: the facts go on the scale =================
  tl.to(phone, { ...L.phone, duration: 0.6, ease: 'power2.inOut' }, 3);
  tl.to(scale, { shown: 1, duration: 0.6, ease: 'power2.out' }, 3.2);
  tl.to(svg, { autoAlpha: 1, duration: 0.3 }, 3.2);
  tl.to(panLabels, { autoAlpha: 1, duration: 0.3 }, 3.5);
  caption(1, 3.4, 6.6);
  screen({ scroll: 0.36 }, 3.5, 0.6, 'power2.inOut');
  weights.forEach((el, i) => {
    tl.to(el, { autoAlpha: 1, duration: 0.12 }, 3.9 + i * 0.5);
    tl.to(scale.weights[i], { t: 1, duration: 0.6, ease: 'none' }, 3.9 + i * 0.5);
  });

  // ================= The verdict =================
  tap('tapRun', 6.4);
  screen({ report: 1 }, 6.6, 0.5, 'power2.in');
  caption(2, 6.9);
  screen({ dial: 1 }, 6.9, 0.9, 'power1.out');
  screen({ pillars: 1 }, 7.1, 1, 'none');
  tl.set(verdict, { x: S.pivot.x, y: S.pivot.y - (L.narrow ? 32 : 44), scale: 0.6 }, 7.5);
  tl.to(verdict, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, 7.5);
  tl.to({}, { duration: 0.01 }, 8.6);

  // ---- Every update: lay out the scale from how much weight has landed ----
  const phoneEdge = { x: L.phone.x + L.half.w - 20, y: L.phone.y - L.half.h * 0.2 };
  const phoneTop = { x: L.phone.x, y: L.phone.y - L.half.h + 10 };
  const sideOf = (i: number) => (WEIGHTS[i].side === 'strength' ? 0 : 1);
  const slotOf = WEIGHTS.map((_, i) => WEIGHTS.slice(0, i).filter((w) => w.side === WEIGHTS[i].side).length);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

  return () => {
    const rise = (1 - scale.shown) * 40;
    const P = { x: S.pivot.x, y: S.pivot.y + rise };
    // Landed weight on each side tips the beam: the heavier side goes down
    let torque = 0;
    scale.weights.forEach(({ t }, i) => {
      torque += (sideOf(i) === 0 ? -1 : 1) * smooth(clamp01((t - 0.8) / 0.2));
    });
    const angle = (torque * TILT_PER_WEIGHT * Math.PI) / 180;
    const ends = [-1, 1].map((d) => ({ x: P.x + d * S.arm * Math.cos(angle), y: P.y + d * S.arm * Math.sin(angle) }));
    const panTop = ends.map((e) => ({ x: e.x, y: e.y + S.string }));

    beam.setAttribute('x1', ends[0].x.toFixed(1));
    beam.setAttribute('y1', ends[0].y.toFixed(1));
    beam.setAttribute('x2', ends[1].x.toFixed(1));
    beam.setAttribute('y2', ends[1].y.toFixed(1));
    pivot.setAttribute('cx', P.x.toFixed(1));
    pivot.setAttribute('cy', P.y.toFixed(1));
    const foot = S.foot + rise;
    stand.setAttribute('d', `M${P.x - 4} ${P.y} L${P.x + 4} ${P.y} L${P.x + 6} ${foot - 12} L${P.x + 46} ${foot} L${P.x - 46} ${foot} L${P.x - 6} ${foot - 12} Z`);
    const w = S.pan / 2;
    strings.setAttribute(
      'd',
      panTop.map((p, i) => `M${ends[i].x} ${ends[i].y} L${p.x - w + 8} ${p.y} M${ends[i].x} ${ends[i].y} L${p.x + w - 8} ${p.y}`).join(' ')
    );
    pans.forEach((pan, i) => {
      const p = panTop[i];
      pan.setAttribute('d', `M${p.x - w} ${p.y} L${p.x + w} ${p.y} Q${p.x + w - 10} ${p.y + 18} ${p.x} ${p.y + 18} Q${p.x - w + 10} ${p.y + 18} ${p.x - w} ${p.y} Z`);
      gsap.set(panLabels[i], { x: p.x, y: p.y + 34 });
    });

    // Each weight leaves the phone and arcs onto its pan, then rides it
    weights.forEach((el, i) => {
      const pan = panTop[sideOf(i)];
      const target = { x: pan.x, y: pan.y - (slotOf[i] + 0.5) * (S.weightH + 4) };
      const from = L.narrow ? phoneTop : { x: phoneEdge.x, y: phoneEdge.y + i * 24 };
      const k = smooth(clamp01(scale.weights[i].t));
      gsap.set(el, {
        x: from.x + (target.x - from.x) * k,
        y: from.y + (target.y - from.y) * k - Math.sin(Math.PI * k) * (L.narrow ? 50 : 90),
        scale: 0.7 + 0.3 * k,
      });
    });
  };
}

// The Stock Analysis chapter: the split story clears, the phone turns once more and comes round
// showing the stock planner, and its story follows.
export function createStockChapter({ stage, section, phone, motion, stockRuntime }: ChapterContext): Chapter {
  const timeline = gsap.timeline({ defaults: { ease: 'none' } });

  const splitPieces = [
    stage.querySelector<HTMLElement>('[data-split-story]'),
    section.querySelector<HTMLElement>('[data-split-captions]'),
  ].filter((el): el is HTMLElement => !!el);
  const opening = section.querySelector<HTMLElement>('[data-stock-captions] [data-k="chapter-opening"]');
  const name = section.querySelector<HTMLElement>('[data-stock-captions] [data-k="chapter-name"]');
  const tagline = section.querySelector<HTMLElement>('[data-stock-captions] [data-k="chapter-tagline"]');
  const L = computeLayout(stage, phone);

  gsap.set(opening, { autoAlpha: 1 });
  gsap.set(name, { yPercent: 110 });
  gsap.set(tagline, { autoAlpha: 0, y: 14 });

  timeline.to(splitPieces, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 0);
  timeline.fromTo(motion, { rotY: START_ROT_Y }, { rotY: END_ROT_Y, duration: 2.2, ease: 'power2.inOut', immediateRender: false }, 0);
  timeline.to(motion, { face: 0.5, duration: 1.1, ease: 'power2.out' }, 0);
  timeline.to(motion, { face: READABLE, duration: 1.1, ease: 'power2.inOut' }, 1.1);
  timeline.to(phone, { ...L.center, duration: 1.2, ease: 'power2.inOut' }, 0);
  timeline.to(name, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 0.35);
  timeline.to(tagline, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.7);
  timeline.to(opening, { autoAlpha: 0, y: -18, duration: 0.3, ease: 'power2.in' }, OPENING_UNITS - 0.3);

  const story = gsap.timeline({ defaults: { ease: 'none' } });
  const syncStoryDom = addStockStory({ tl: story, stage, section, phone, runtime: stockRuntime });
  timeline.add(story, OPENING_UNITS);

  return {
    timeline,
    update: (localTime) => {
      stockRuntime.screen.dirty = true;
      stockRuntime.screen.active = localTime >= SCREEN_TAKEOVER_AT;
      syncStoryDom();
    },
  };
}
