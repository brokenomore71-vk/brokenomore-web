import gsap from 'gsap';
import type { Chapter, ChapterContext } from '../journey';
import { BILL, PEOPLE } from './splitData';
import { initialSceneParams, PaymentScene, SLOT_PAPER_WIDTH, slotOnStage, type SceneParams } from './paymentScene';
import { OCR_ROWS, RECEIPT_H, RECEIPT_W } from './receipt';
import { drawPhoneScreen, initialScreenState, personAmount, type ScreenAssets, type ScreenState } from './phoneScreen';

// Timeline positions below are in units, which journey.ts turns into scroll distance.
const OPENING_UNITS = 3.2;
const STORY_UNITS = 27.5;
const FRONT_ROT_Y = Math.PI * 2; // one full turn on from the slideshow, screen facing front
// The machine and its paper are finished with by this point in the story.
const SCENE_ENDS_AT = 12.7;
// During the opening's spin the phone's back is showing, so its screen can change unseen.
const SCREEN_TAKEOVER_AT = 1.3;

export interface PhoneScreenController {
  active: boolean;
  dirty: boolean;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export interface SplitStoryRuntime {
  state: ScreenState;
  assets: ScreenAssets;
  screen: PhoneScreenController;
  sceneParams: SceneParams;
  paymentScene: PaymentScene | null;
}

export function createSplitStoryRuntime(): SplitStoryRuntime {
  const runtime: SplitStoryRuntime = {
    state: initialScreenState(),
    assets: { hero: null, logo: null, avatars: {}, receipt: null, sans: 'sans-serif' },
    sceneParams: initialSceneParams(),
    paymentScene: null,
    screen: {
      active: false,
      dirty: true,
      draw: (ctx, width, height) => drawPhoneScreen(ctx, width, height, runtime.state, runtime.assets),
    },
  };
  return runtime;
}

interface StoryLayout {
  narrow: boolean;
  phonePrint: { x: number; y: number; scale: number };
  phoneScan: { x: number; y: number; scale: number };
  phoneReview: { x: number; y: number; scale: number };
  phoneSplit: { x: number; y: number; scale: number };
  machine: { x: number; y: number; pxPerUnit: number; ry: number; rz: number };
  receiptScan: { x: number; y: number; scale: number };
  cards: { x: number; y: number }[];
  ring: { rx: number; ry: number };
}

// Positions are offsets from the middle of the stage.
function computeLayout(stage: HTMLElement): StoryLayout {
  const W = Math.min(stage.offsetWidth, 1280);
  const H = Math.max(stage.offsetHeight, 600);
  const narrow = window.innerWidth < 768;

  if (narrow) {
    const cardX = 80;
    const cardTop = -H / 2 + 62;
    return {
      narrow,
      phonePrint: { x: W * 0.27, y: H * 0.2, scale: 0.46 },
      phoneScan: { x: 0, y: H * 0.25, scale: 0.58 },
      phoneReview: { x: 0, y: H * 0.04, scale: 0.96 },
      phoneSplit: { x: 0, y: H * 0.17, scale: 0.8 },
      machine: { x: -W * 0.19, y: H * 0.22, pxPerUnit: H * 0.036, ry: 0.32, rz: 0.08 },
      receiptScan: { x: 0, y: -H * 0.2, scale: 0.68 },
      cards: [
        { x: -cardX, y: cardTop },
        { x: cardX, y: cardTop },
        { x: -cardX, y: cardTop + 74 },
        { x: cardX, y: cardTop + 74 },
      ],
      ring: { rx: 0, ry: 0 },
    };
  }

  const side = Math.max(W * 0.19, 196);
  const cardX = Math.max(W * 0.31, 276);
  return {
    narrow,
    phonePrint: { x: Math.max(W * 0.22, 200), y: 0, scale: 0.88 },
    phoneScan: { x: side, y: 0, scale: 0.98 },
    phoneReview: { x: 0, y: 0, scale: 1 },
    phoneSplit: { x: 0, y: 0, scale: 1 },
    machine: { x: -Math.max(W * 0.2, 180), y: H * 0.14, pxPerUnit: H * 0.056, ry: 0.36, rz: 0.1 },
    receiptScan: { x: -side, y: 0, scale: 1.14 },
    cards: [
      { x: -cardX, y: -130 },
      { x: cardX, y: -130 },
      { x: -cardX, y: 110 },
      { x: cardX, y: 110 },
    ],
    ring: { rx: cardX, ry: 200 },
  };
}

type StoryOptions = Pick<ChapterContext, 'stage' | 'section' | 'phone' | 'motion'> & {
  tl: gsap.core.Timeline;
  runtime: SplitStoryRuntime;
};

// Fills the timeline with the split-bills story. Returns a function that writes the live
// amounts into the people cards, to be called on every update.
function addSplitStory({ tl, stage, section, phone, motion, runtime }: StoryOptions) {
  const root = stage.querySelector<HTMLElement>('[data-split-story]');
  if (!root) return () => undefined;

  const one = <T extends Element = HTMLElement>(name: string) => root.querySelector<T>(`[data-s="${name}"]`)!;
  const all = <T extends Element = HTMLElement>(name: string) => Array.from(root.querySelectorAll<T>(`[data-s="${name}"]`));

  const L = computeLayout(stage);
  const state = runtime.state;
  Object.assign(state, initialScreenState());

  const captions = Array.from(section.querySelectorAll<HTMLElement>('[data-s="caption"]'));

  const chips = all('chip');
  const people = all('person');
  const peopleAmounts = people.map((el) => el.querySelector<HTMLElement>('[data-s="person-amount"]')!);
  const peopleSubs = people.map((el) => el.querySelector<HTMLElement>('[data-s="person-sub"]')!);
  const peopleBars = people.map((el) => el.querySelector<HTMLElement>('[data-s="person-bar"]')!);
  const lines = one('lines');
  const cone = one<SVGPolygonElement>('cone');
  const ring = one<SVGEllipseElement>('ring');
  const arcs = all<SVGPathElement>('arc');

  // Everything about the machine and paper happens in their 3D layer, through these numbers
  Object.assign(runtime.sceneParams.machine, initialSceneParams().machine);
  Object.assign(runtime.sceneParams.paper, initialSceneParams().paper);
  const { machine, paper } = runtime.sceneParams;
  const printScale = (L.machine.pxPerUnit * SLOT_PAPER_WIDTH) / RECEIPT_W;
  const machineRest = { ...L.machine, rx: -0.4, shake: 0 };
  const slot = slotOnStage(machineRest);
  Object.assign(machine, {
    x: L.machine.x - stage.offsetWidth * 0.75,
    y: L.machine.y + 60,
    pxPerUnit: L.machine.pxPerUnit,
    ry: -1.5,
    rz: 0.5,
  });
  Object.assign(paper, { x: slot.x, y: slot.y, z: slot.z, scale: printScale, rx: -0.2, ry: L.machine.ry, rz: L.machine.rz });

  const scanVisualH = RECEIPT_H * L.receiptScan.scale;
  const scanBottom = L.receiptScan.y + scanVisualH / 2;

  // ---- Starting positions ----
  gsap.set([...chips, ...people], { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  gsap.set(chips, { autoAlpha: 0 });
  gsap.set(lines, { autoAlpha: 1 });
  gsap.set(captions, { autoAlpha: 0, y: 18 });
  gsap.set(cone, { autoAlpha: 0 });
  gsap.set(ring, { autoAlpha: 0, attr: { cx: 0, cy: 0, rx: L.ring.rx, ry: L.ring.ry } });
  gsap.set(arcs, { strokeDashoffset: 1, opacity: 1 });
  L.cards.forEach((card, i) => {
    gsap.set(people[i], { x: card.x, y: card.y + 24, scale: 0.86, autoAlpha: 0 });
  });

  // Light cast from the phone's camera across the paper
  const coneRight = L.receiptScan.x + (RECEIPT_W / 2) * L.receiptScan.scale;
  if (L.narrow) {
    cone.setAttribute(
      'points',
      `0,${L.phoneScan.y - 70} ${(-RECEIPT_W / 2) * L.receiptScan.scale},${scanBottom} ${(RECEIPT_W / 2) * L.receiptScan.scale},${scanBottom}`
    );
  } else {
    cone.setAttribute(
      'points',
      `${L.phoneScan.x - 70},${L.phoneScan.y} ${coneRight},${L.receiptScan.y - scanVisualH / 2} ${coneRight},${L.receiptScan.y + scanVisualH / 2}`
    );
  }

  // Each request line runs from the phone out to that friend's card
  arcs.forEach((arc, i) => {
    const card = L.cards[i + 1];
    const sx = L.phoneSplit.x;
    const sy = L.phoneSplit.y;
    const mx = (sx + card.x) / 2;
    const my = (sy + card.y) / 2 - 46;
    arc.setAttribute('d', `M${sx} ${sy} Q${mx} ${my} ${card.x} ${card.y}`);
  });

  // ---- Helpers ----
  const caption = (i: number, inAt: number, outAt?: number) => {
    tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, inAt);
    if (outAt !== undefined) tl.to(captions[i], { autoAlpha: 0, y: -18, duration: 0.35, ease: 'power2.in' }, outAt);
  };
  const screen = (vars: Partial<ScreenState>, start: number, duration: number, ease = 'power1.out') => {
    tl.to(state, { ...vars, duration, ease }, start);
  };
  const tap = (name: keyof ScreenState, start: number) => {
    tl.fromTo(state, { [name]: 0 }, { [name]: 1, duration: 0.5, ease: 'none', immediateRender: false }, start);
  };
  const movePhone = (pose: { x: number; y: number; scale: number }, start: number, duration: number) => {
    tl.to(phone, { ...pose, duration, ease: 'power2.inOut' }, start);
  };

  // ---- Act 1: the machine prints the bill ----
  tl.to(state, { home: 1, duration: 0.8 }, 0.2);
  movePhone(L.phonePrint, 0.1, 1.5);
  tl.to(motion, { face: 0.8, rotY: FRONT_ROT_Y - 0.34, duration: 1.5, ease: 'power2.inOut' }, 0.1);

  caption(0, 0.8, 5.1);
  // The machine swings round into view
  tl.to(machine, { x: L.machine.x, y: L.machine.y, ry: L.machine.ry, rz: L.machine.rz, duration: 1.5, ease: 'power3.out' }, 0.4);
  // The bill feeds out, with the machine shuddering only while it prints
  tl.set(paper, { visible: 1 }, 1.8);
  tl.to(machine, { shake: 1.1, duration: 0.2 }, 1.8);
  tl.to(paper, { printed: 1, duration: 3, ease: 'none' }, 1.8);
  tl.to(machine, { shake: 0, duration: 0.2 }, 4.6);

  // ---- Act 2: tear it off and scan it ----
  // Pulled free: it jolts up off the slot, and the snap travels along the sheet
  tl.to(paper, { y: slot.y - 26, ry: L.machine.ry - 0.1, rz: L.machine.rz - 0.16, duration: 0.45, ease: 'power2.out' }, 4.85);
  tl.to(paper, { anchored: 0, duration: 0.35, ease: 'power2.inOut' }, 4.85);
  tl.to(paper, { wave: 15, duration: 0.3, ease: 'power2.out' }, 4.85);
  tl.to(paper, { wave: 6, curl: 1.15, tail: 1, bow: 0.05, cup: 11, twist: 22, duration: 1.3, ease: 'power1.inOut' }, 5.2);
  // It sags as it's carried across, and settles when it stops
  tl.to(paper, { pivot: 1, x: L.receiptScan.x, y: L.receiptScan.y, z: 40, scale: L.receiptScan.scale, rx: 0.2, ry: L.narrow ? 0 : 0.26, rz: -0.035, duration: 1.3, ease: 'power2.inOut' }, 5.2);
  tl.to(machine, { x: L.machine.x - stage.offsetWidth * 0.5, y: L.machine.y + 720, ry: -0.9, rz: 0.55, duration: 1.3, ease: 'power2.in' }, 5.1);
  movePhone(L.phoneScan, 5.2, 1.3);
  tl.to(motion, { face: 1, rotY: FRONT_ROT_Y + (L.narrow ? 0 : 0.22), duration: 1.3, ease: 'power2.inOut' }, 5.2);

  caption(1, 5.6, 11.2);
  screen({ scanCta: 1 }, 6.1, 0.5);
  tap('tapScan', 6.7);
  screen({ camera: 1 }, 7, 0.7, 'power2.inOut');
  tl.to(cone, { autoAlpha: 1, duration: 0.5 }, 7.5);
  screen({ lock: 1 }, 7.5, 0.8, 'power2.out');

  const sweepStart = 8.3;
  const sweepDuration = 2.8;
  tl.to(state, { sweep: 1, duration: sweepDuration, ease: 'none' }, sweepStart);

  // As the line passes each row: the row lights up and that item flies into the phone
  const rowWorldY = (rowY: number) => scanBottom - (RECEIPT_H - rowY) * L.receiptScan.scale;
  OCR_ROWS.forEach((rowY, i) => {
    const hit = sweepStart + (rowY / RECEIPT_H) * sweepDuration;
    const chip = chips[i];
    if (!chip) return;
    // Starts off to the side of the row, so it doesn't hide the words it came from
    const chipX = L.narrow ? 70 : L.receiptScan.x + (RECEIPT_W / 2) * L.receiptScan.scale;
    tl.set(chip, { x: chipX, y: rowWorldY(rowY), scale: 0.72 }, hit);
    tl.to(chip, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'power2.out' }, hit);
    tl.to(chip, { x: L.phoneScan.x, y: L.phoneScan.y, duration: 0.95, ease: 'power2.in' }, hit + 0.2);
    tl.to(chip, { scale: 0.45, autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, hit + 0.85);
  });

  // ---- Act 3: everything the OCR read is entered ----
  tl.to(cone, { autoAlpha: 0, duration: 0.4 }, 11.15);
  screen({ review: 1 }, 11.2, 0.8, 'power2.out');
  tl.to(paper, { overlay: 0, duration: 0.3 }, 11.3);
  // The bill curls up as it's drawn in behind the phone
  tl.to(paper, { x: L.phoneReview.x, y: L.phoneReview.y, z: -80, scale: 0.28, curl: 2.6, rz: 0.25, duration: 1.1, ease: 'power2.in' }, 11.4);
  tl.set(paper, { visible: 0 }, 12.5);
  movePhone(L.phoneReview, 11.4, 1.2);
  tl.to(motion, { rotY: FRONT_ROT_Y, duration: 1.2, ease: 'power2.inOut' }, 11.4);
  caption(2, 11.7, 14.2);
  tl.to(state, { reviewRows: BILL.items.length + 1, duration: 1.4, ease: 'none' }, 11.8);
  tl.to(state, { reviewTotal: BILL.total, duration: 0.9, ease: 'power1.out' }, 12.5);

  // ---- Act 4: on to splitting it ----
  tap('tapReview', 13.6);
  screen({ create: 1 }, 13.9, 0.8, 'power2.inOut');
  tl.to(state, { amount: BILL.total, duration: 0.8, ease: 'power1.out' }, 14.2);
  tl.to(state, { nameChars: BILL.splitName.length, duration: 0.8, ease: 'none' }, 14.5);
  movePhone(L.phoneSplit, 14.3, 1);
  tl.to(ring, { autoAlpha: 1, duration: 0.8 }, 14.8);

  // With one friend
  caption(3, 14.9, 17.7);
  tap('tapFriend', 15.5);
  screen({ friend: 1 }, 15.7, 0.6);
  const showPerson = (i: number, start: number) => {
    tl.to(people[i], { autoAlpha: 1, y: L.cards[i].y, scale: 1, duration: 0.7, ease: 'back.out(1.5)' }, start);
  };
  showPerson(0, 15.9);
  showPerson(1, 16.05);

  // With the whole group, Equal
  caption(4, 18, 20.7);
  tap('tapGroups', 17.9);
  screen({ groups: 1 }, 18.1, 0.9, 'none');
  showPerson(2, 18.5);
  showPerson(3, 18.65);

  // Dutch: each person's own amount
  caption(5, 21, 24);
  tap('tapMode', 20.9);
  screen({ mode: 1 }, 21.2, 1.3, 'power1.inOut');

  // Send it
  caption(6, 24.3);
  tap('tapSplit', 23.7);
  screen({ sent: 1 }, 24.1, 1.7, 'none');
  arcs.forEach((arc, i) => {
    tl.to(arc, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 24.3 + i * 0.25);
    tl.to(arc, { opacity: 0.3, duration: 0.5 }, 25.3 + i * 0.25);
    tl.to(people[i + 1], { borderColor: 'rgba(52,211,153,0.6)', duration: 0.3 }, 25 + i * 0.25);
  });
  tl.to({}, { duration: 0.01 }, STORY_UNITS - 0.01);

  // Only touches the DOM when the text actually changes
  const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const setText = (el: HTMLElement, value: string) => {
    if (el.textContent !== value) el.textContent = value;
  };
  return () => {
    PEOPLE.forEach((_, i) => {
      const amount = personAmount(i, state);
      setText(peopleAmounts[i], money(amount));
      gsap.set(peopleBars[i], { scaleX: Math.min(1, amount / 1092) });
      const sent = state.sent > 0.5 + i * 0.05;
      let sub = 'Half the bill';
      if (state.groups > 0.5) sub = state.mode > 0.5 ? 'Dutch share' : 'Equal share';
      if (sent) sub = i === 0 ? 'Your share' : 'Request sent';
      setText(peopleSubs[i], sub);
    });
  };
}

// The Split & Share chapter: the slideshow clears, the phone spins as the feature's name comes
// up, and the story follows.
export function createSplitChapter({ stage, section, header, phone, motion, splitRuntime }: ChapterContext): Chapter {
  const timeline = gsap.timeline({ defaults: { ease: 'none' } });

  const orbitPieces = stage.querySelectorAll<HTMLElement>('[data-orbit-fade]');
  const opening = section.querySelector<HTMLElement>('[data-s="chapter-opening"]');
  const name = section.querySelector<HTMLElement>('[data-s="chapter-name"]');
  const tagline = section.querySelector<HTMLElement>('[data-s="chapter-tagline"]');

  gsap.set(opening, { autoAlpha: 1 });
  gsap.set(name, { yPercent: 110 });
  gsap.set(tagline, { autoAlpha: 0, y: 14 });

  timeline.to(orbitPieces, { autoAlpha: 0, scale: 0.86, duration: 0.8, ease: 'power2.in' }, 0);
  timeline.to(header, { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' }, 0);
  timeline.to(motion, { rotY: FRONT_ROT_Y, duration: 2.6, ease: 'power2.inOut' }, 0);
  timeline.to(phone, { y: 24, scale: 0.9, duration: 1.2, ease: 'power2.inOut' }, 0);
  timeline.to(name, { yPercent: 0, duration: 0.8, ease: 'power3.out' }, 0.5);
  timeline.to(tagline, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.9);
  timeline.to(opening, { autoAlpha: 0, y: -18, duration: 0.35, ease: 'power2.in' }, OPENING_UNITS - 0.35);

  const story = gsap.timeline({ defaults: { ease: 'none' } });
  const syncStoryDom = addSplitStory({ tl: story, stage, section, phone, motion, runtime: splitRuntime });
  timeline.add(story, OPENING_UNITS);

  return {
    timeline,
    update: (localTime) => {
      splitRuntime.screen.dirty = true;
      splitRuntime.screen.active = localTime >= SCREEN_TAKEOVER_AT;
      splitRuntime.paymentScene?.setActive(localTime > OPENING_UNITS + 0.3 && localTime < OPENING_UNITS + SCENE_ENDS_AT);
      syncStoryDom();
    },
  };
}
