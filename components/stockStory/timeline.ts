import gsap from 'gsap';
import type { Chapter, ChapterContext } from '../journey';
import type { PhoneScreenController } from '../splitStory/timeline';
import { SCORE, SEARCH, VERDICT_RING, WEIGHTS } from './stockData';
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
const TILT_PER_WEIGHT = 7;
// The beam is a damped spring: how fast it swings (radians per timeline unit) and how quickly it
// settles. It overshoots a little each time a fact lands, then comes to rest.
const SWING = 8;
const DAMPING = 3.4;
// How long each fact takes to fly from the phone to its pan, and when the first one leaves
const FLIGHT = 0.6;
const FIRST_WEIGHT_AT = 3.9;
const WEIGHT_GAP = 0.5;
const VERDICT_AT = 7.5;

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
  const scale = { shown: 0, verdict: 0, weights: WEIGHTS.map(() => ({ t: 0 })) };

  const captions = Array.from(section.querySelectorAll<HTMLElement>('[data-stock-captions] [data-k="caption"]'));
  const svg = one<SVGSVGElement>('scale');
  const panLabels = all('pan-label');
  const weights = all('weight');
  const verdict = one('verdict');
  const verdictRing = one<SVGCircleElement>('verdict-ring');
  const verdictNum = one('verdict-num');
  const verdictText = one('verdict-text');

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
  gsap.set(verdictText, { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 0 });
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
  // The scale builds itself: the pillar rises, the beam unfolds, the pans drop onto their chains
  tl.to(phone, { ...L.phone, duration: 0.6, ease: 'power2.inOut' }, 3);
  tl.to(svg, { autoAlpha: 1, duration: 0.2 }, 3.1);
  tl.to(scale, { shown: 1, duration: 0.8, ease: 'power1.out' }, 3.1);
  tl.to(panLabels, { autoAlpha: 1, duration: 0.3 }, 3.6);
  caption(1, 3.4, 6.6);
  screen({ scroll: 0.36 }, 3.5, 0.6, 'power2.inOut');
  weights.forEach((el, i) => {
    const leave = FIRST_WEIGHT_AT + i * WEIGHT_GAP;
    tl.to(el, { autoAlpha: 1, duration: 0.12 }, leave);
    tl.to(scale.weights[i], { t: 1, duration: FLIGHT, ease: 'none' }, leave);
  });

  // ================= The verdict =================
  tap('tapRun', 6.4);
  screen({ report: 1 }, 6.6, 0.5, 'power2.in');
  caption(2, 6.9);
  screen({ dial: 1 }, 6.9, 0.9, 'power1.out');
  screen({ pillars: 1 }, 7.1, 1, 'none');
  // The needle locks, a ring of light spreads from the pivot, and the score rises out of it
  tl.to(scale, { verdict: 1, duration: 1, ease: 'power2.out' }, VERDICT_AT);
  tl.set(verdict, { x: S.pivot.x, y: S.pivot.y - S.arm * 0.24 - (L.narrow ? 34 : 46), scale: 0.4 }, VERDICT_AT + 0.1);
  tl.to(verdict, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, VERDICT_AT + 0.1);
  tl.to(verdictText, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power2.out' }, VERDICT_AT + 0.4);
  tl.to({}, { duration: 0.01 }, 8.6);

  // ---- The scale's fixed geometry, drawn once around the pivot ----
  const f = S.arm / 170; // everything is designed at the desktop size and scaled from it
  const pillarH = S.foot - S.pivot.y;
  const panW = S.pan / 2;
  const bowl = panW * 0.34;
  const rimRy = panW * 0.16;
  const gaugeR = S.arm * 0.24;
  const set = (el: Element, attrs: Record<string, string | number>) => {
    for (const k in attrs) el.setAttribute(k, typeof attrs[k] === 'number' ? (attrs[k] as number).toFixed(2) : (attrs[k] as string));
  };
  set(one('pillar'), { d: `M${-3.5 * f} 10 L${3.5 * f} 10 L${7 * f} ${pillarH - 18 * f} L${-7 * f} ${pillarH - 18 * f} Z` });
  set(one('plinth'), {
    d: `M${-16 * f} ${pillarH - 18 * f} L${16 * f} ${pillarH - 18 * f} L${50 * f} ${pillarH - 4 * f} L${50 * f} ${pillarH + 2 * f} L${-50 * f} ${pillarH + 2 * f} L${-50 * f} ${pillarH - 4 * f} Z`,
  });
  set(one('plinth-top'), { cx: 0, cy: pillarH - 18 * f, rx: 16 * f, ry: 3.5 * f });
  set(one('core'), { x1: 0, y1: 16, x2: 0, y2: pillarH - 24 * f });
  set(one('shadow'), { cx: 0, cy: pillarH + 6 * f, rx: 70 * f, ry: 8 * f });
  const arcPoint = (deg: number, r: number) => {
    const t = (deg * Math.PI) / 180;
    return `${(Math.sin(t) * r).toFixed(2)} ${(-Math.cos(t) * r).toFixed(2)}`;
  };
  set(one('gauge-arc'), { d: `M${arcPoint(-60, gaugeR)} A${gaugeR} ${gaugeR} 0 0 1 ${arcPoint(60, gaugeR)}` });
  set(one('gauge-ticks'), {
    d: [-60, -40, -20, 0, 20, 40, 60].map((deg) => `M${arcPoint(deg, gaugeR + 3)} L${arcPoint(deg, gaugeR + (deg === 0 ? 10 : 7))}`).join(' '),
  });
  set(one('needle-line'), { x1: 0, y1: -6, x2: 0, y2: -(gaugeR - 5) });
  set(one('needle-tip'), { cx: 0, cy: -(gaugeR - 5), r: 2.2 });
  set(one('beam-bar'), {
    d: `M${-S.arm} ${-2.2 * f} Q0 ${-7 * f} ${S.arm} ${-2.2 * f} L${S.arm} ${2.2 * f} Q0 ${7 * f} ${-S.arm} ${2.2 * f} Z`,
  });
  all('finial').forEach((el, i) => set(el, { cx: (i === 0 ? -1 : 1) * S.arm, cy: 0, r: 5 * f }));
  set(one('hub'), { cx: 0, cy: 0, r: 11 * f });
  set(one('hub-dot'), { cx: 0, cy: 0, r: 3.5 * f });
  set(one('spot'), { cx: 0, cy: 0, r: S.arm * 1.9 });
  const pans = all<SVGGElement>('pan');
  pans.forEach((pan) => {
    const q = (name: string) => pan.querySelector(`[data-k="${name}"]`)!;
    set(q('chains'), { d: `M0 0 L${-panW + 8 * f} ${S.string} M0 0 L0 ${S.string - rimRy} M0 0 L${panW - 8 * f} ${S.string}` });
    set(q('hook'), { cx: 0, cy: 0, r: 3 * f });
    set(q('pan-inner'), { cx: 0, cy: S.string, rx: panW, ry: rimRy });
    set(q('pan-bowl'), {
      d: `M${-panW} ${S.string} A${panW} ${rimRy} 0 0 0 ${panW} ${S.string} Q${panW * 0.82} ${S.string + bowl} 0 ${S.string + bowl} Q${-panW * 0.82} ${S.string + bowl} ${-panW} ${S.string} Z`,
    });
    set(q('pan-shine'), { d: `M${-panW * 0.62} ${S.string + bowl * 0.45} Q${-panW * 0.3} ${S.string + bowl * 0.85} 0 ${S.string + bowl * 0.88}` });
  });
  const rig = one<SVGGElement>('rig');
  const stand = one<SVGGElement>('stand');
  const gauge = one<SVGGElement>('gauge');
  const needle = one<SVGGElement>('needle');
  const beamGroup = one<SVGGElement>('beam');
  const hub = [one('hub'), one('hub-dot')];
  const shockwave = one<SVGCircleElement>('shockwave');
  const spot = one('spot');
  const pools = all<SVGEllipseElement>('pool');
  const ripples = all<SVGEllipseElement>('ripple');
  const trails = all<SVGGElement>('trail').map((g) => ({
    g,
    glow: g.querySelector<SVGPathElement>('[data-k="trail-glow"]')!,
    core: g.querySelector<SVGPathElement>('[data-k="trail-core"]')!,
  }));

  // ---- Every update: the scale's motion, worked out from the story's time ----
  const phoneEdge = { x: L.phone.x + L.half.w - 20, y: L.phone.y - L.half.h * 0.2 };
  const phoneTop = { x: L.phone.x, y: L.phone.y - L.half.h + 10 };
  const sideOf = (i: number) => (WEIGHTS[i].side === 'strength' ? 0 : 1);
  const slotOf = WEIGHTS.map((_, i) => WEIGHTS.slice(0, i).filter((w) => w.side === WEIGHTS[i].side).length);
  const landAt = WEIGHTS.map((_, i) => FIRST_WEIGHT_AT + i * WEIGHT_GAP + FLIGHT);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
  const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
  const easeOutBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
  // A damped spring's response to a step, and how fast it is moving
  const step = (tau: number) => (tau <= 0 ? 0 : 1 - Math.exp(-DAMPING * tau) * (Math.cos(SWING * tau) + (DAMPING / SWING) * Math.sin(SWING * tau)));
  const stepSpeed = (tau: number) => (tau <= 0 ? 0 : Math.exp(-DAMPING * tau) * (DAMPING ** 2 / SWING + SWING) * Math.sin(SWING * tau));
  const arc = L.narrow ? 60 : 110;

  return () => {
    const T = tl.time();
    if (T < 3) return; // nothing of the scale is on screen yet

    // ---- Building itself ----
    const shown = scale.shown;
    const pillarP = easeOutBack(seg(shown, 0, 0.5));
    const beamP = smooth(seg(shown, 0.3, 0.75));
    const panP = seg(shown, 0.55, 1);
    const P = S.pivot;
    rig.setAttribute('transform', `translate(${P.x.toFixed(1)} ${P.y.toFixed(1)})`);
    stand.setAttribute('transform', `translate(0 ${pillarH}) scale(1 ${Math.max(0.001, pillarP).toFixed(3)}) translate(0 ${-pillarH})`);
    gsap.set([gauge, ...hub], { opacity: seg(shown, 0.4, 0.7) });
    spot.setAttribute('opacity', (shown * (0.8 + 0.4 * scale.verdict)).toFixed(3));

    // ---- The beam: each landed fact nudges it, and it springs towards its new balance ----
    let deg = 0;
    let speed = 0;
    WEIGHTS.forEach((_, i) => {
      const dir = sideOf(i) === 0 ? -1 : 1;
      deg += dir * TILT_PER_WEIGHT * step(T - landAt[i]);
      speed += dir * TILT_PER_WEIGHT * stepSpeed(T - landAt[i]);
    });
    const angle = (deg * Math.PI) / 180;
    beamGroup.setAttribute('transform', `rotate(${deg.toFixed(2)}) scale(${Math.max(0.001, beamP).toFixed(3)} 1)`);
    const needleDeg = Math.max(-58, Math.min(58, deg * 4.5));
    needle.setAttribute('transform', `rotate(${needleDeg.toFixed(2)})`);

    // ---- The pans: hanging from the beam's ends, swaying behind its movement ----
    const sway = Math.max(-14, Math.min(14, -speed * 0.16));
    const panTops = [-1, 1].map((d, side) => {
      const end = { x: P.x + d * S.arm * beamP * Math.cos(angle), y: P.y + d * S.arm * beamP * Math.sin(angle) };
      // The pan that just took a fact dips under it and bobs back
      let dip = 0;
      let glow = 0;
      WEIGHTS.forEach((_, i) => {
        if (sideOf(i) !== side) return;
        const tau = T - landAt[i];
        if (tau > 0) {
          dip += 7 * f * Math.exp(-5 * tau) * Math.sin(12 * tau);
          glow += 0.22 + 0.5 * Math.exp(-4 * tau);
        }
      });
      const drop = (1 - smooth(panP)) * -40;
      const pan = pans[side];
      pan.setAttribute('transform', `translate(${end.x.toFixed(1)} ${(end.y + drop).toFixed(1)}) rotate(${sway.toFixed(2)}) translate(0 ${dip.toFixed(2)})`);
      pan.setAttribute('opacity', panP.toFixed(3));
      const t = (sway * Math.PI) / 180;
      const top = { x: end.x - Math.sin(t) * (S.string + dip), y: end.y + drop + Math.cos(t) * (S.string + dip) };
      set(pools[side], { cx: top.x, cy: S.foot + 4, rx: panW * 1.3, ry: 16 * f, opacity: Math.min(1, glow + scale.verdict * (side === 0 ? 0.3 : 0)) * panP });
      gsap.set(panLabels[side], { x: top.x, y: top.y + bowl + 20 * f });
      return top;
    });

    // ---- The facts: flying from the phone on a light trail, landing in their pans ----
    const fromOf = (i: number) => (L.narrow ? phoneTop : { x: phoneEdge.x, y: phoneEdge.y + i * 24 });
    const pathAt = (i: number, k: number) => {
      const pan = panTops[sideOf(i)];
      const target = { x: pan.x, y: pan.y - rimRy * 0.4 - (slotOf[i] + 0.5) * (S.weightH + 4) };
      const from = fromOf(i);
      return { x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k - Math.sin(Math.PI * k) * arc };
    };
    weights.forEach((el, i) => {
      const t = clamp01(scale.weights[i].t);
      const k = smooth(t);
      const p = pathAt(i, k);
      const tau = T - landAt[i];
      // A small squash as it lands
      const squash = tau > 0 ? 0.1 * Math.exp(-7 * tau) * Math.sin(16 * tau + Math.PI / 2) : 0;
      const spin = Math.sin(Math.PI * k) * (sideOf(i) === 0 ? -14 : 12);
      gsap.set(el, {
        x: p.x,
        y: p.y,
        rotation: spin + (t >= 1 ? sway : 0),
        scaleX: (0.6 + 0.4 * k) * (1 + squash),
        scaleY: (0.6 + 0.4 * k) * (1 - squash),
      });

      // The trail: the last stretch of the flight path, fading as the fact settles
      const { g, glow, core } = trails[i];
      const fade = t <= 0 ? 0 : 1 - smooth(seg(t, 0.78, 1));
      g.setAttribute('opacity', fade.toFixed(3));
      if (fade > 0) {
        const k0 = Math.max(0, k - 0.32);
        const pts: string[] = [];
        for (let n = 0; n <= 12; n++) {
          const q = pathAt(i, k0 + ((k - k0) * n) / 12);
          pts.push(`${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
        }
        const d = `M${pts.join(' L')}`;
        glow.setAttribute('d', d);
        core.setAttribute('d', d);
      }

      // The ring that spreads across the pan where it landed
      const u = seg(tau, 0, 0.55);
      const pan = panTops[sideOf(i)];
      set(ripples[i], { cx: pan.x, cy: pan.y, rx: panW * (0.35 + 0.95 * u), ry: rimRy * (0.35 + 0.95 * u) + 2, opacity: tau > 0 && u < 1 ? (1 - u) * 0.9 : 0 });
    });

    // ---- The verdict: a ring of light from the pivot, and the score counting up ----
    const v = scale.verdict;
    const wave = seg(v, 0, 0.55);
    set(shockwave, { cx: 0, cy: 0, r: 11 * f + S.arm * 1.3 * smooth(wave), opacity: v > 0 && wave < 1 ? (1 - wave) * 0.9 : 0, 'stroke-width': 2 + 6 * (1 - wave) });
    const fill = smooth(seg(v, 0.15, 0.85));
    verdictRing.setAttribute('stroke-dashoffset', (VERDICT_RING * (1 - (fill * SCORE) / 10)).toFixed(2));
    verdictNum.textContent = String(Math.round(fill * SCORE));
  };
}

// The Stock Analysis chapter: the split story clears, the phone turns once more and comes round
// showing the stock planner, and its story follows.
export function createStockChapter({ stage, section, phone, motion, stockRuntime }: ChapterContext & { stockRuntime: StockStoryRuntime }): Chapter {
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
