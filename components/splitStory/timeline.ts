import gsap from 'gsap';
import type { Chapter, ChapterContext } from '../journey';
import { BILL, EQUAL, EQUAL_MEMBERS, ITEM_OWNERS, PEOPLE, inr, itemWithTax } from './splitData';
import { initialSceneParams, PaymentScene, SLOT_PAPER_WIDTH, slotOnStage, type SceneParams } from './paymentScene';
import { OCR_ROWS, RECEIPT_H, RECEIPT_W } from './receipt';
import { drawPhoneScreen, initialScreenState, type ScreenAssets, type ScreenState } from './phoneScreen';

// Timeline positions below are in units, which journey.ts turns into scroll distance.
const OPENING_UNITS = 3.2;
const FRONT_ROT_Y = Math.PI * 2; // one full turn on from the slideshow, screen facing front
// The Dutch half, which starts with the payment machine, begins here in the story.
const DUTCH_AT = 16.5;
// The machine and its paper are finished with by this point after DUTCH_AT.
const SCENE_ENDS_AT = 12.7;
// During the opening's spin the phone's back is showing, so its screen can change unseen.
const SCREEN_TAKEOVER_AT = 1.3;
// Nearly square-on, so the app on the screen can be read while it still floats a little.
const READABLE = 0.92;

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
  };
}

type StoryOptions = Pick<ChapterContext, 'stage' | 'section' | 'phone' | 'motion'> & {
  tl: gsap.core.Timeline;
  runtime: SplitStoryRuntime;
};

// What each person owes in the Dutch split, counting only the items that have reached their card.
function dutchOwed(index: number, assign: number) {
  return ITEM_OWNERS.reduce((sum, owner, k) => (owner === index ? sum + itemWithTax(k) * clamp01(assign - k) : sum), 0);
}
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Fills the timeline with the split-bills story: an Equal split, then a Dutch one from a scanned
// bill. Returns a function that writes the live amounts into the people cards, to be called on
// every update.
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
  const coins = all('coin');
  const paidPill = one('paid-pill');
  const people = all('person');
  const peopleAmounts = people.map((el) => el.querySelector<HTMLElement>('[data-s="person-amount"]')!);
  const peopleSubs = people.map((el) => el.querySelector<HTMLElement>('[data-s="person-sub"]')!);
  const peopleBars = people.map((el) => el.querySelector<HTMLElement>('[data-s="person-bar"]')!);
  const lines = one('lines');
  const cone = one<SVGPolygonElement>('cone');

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
  gsap.set([...chips, ...coins, paidPill, ...people], { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  gsap.set([...chips, ...coins, paidPill], { autoAlpha: 0 });
  gsap.set(lines, { autoAlpha: 1 });
  gsap.set(captions, { autoAlpha: 0, y: 18 });
  gsap.set(cone, { autoAlpha: 0 });
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
  const showPerson = (i: number, start: number) => {
    tl.to(people[i], { autoAlpha: 1, y: L.cards[i].y, scale: 1, duration: 0.7, ease: 'back.out(1.5)' }, start);
  };
  const hidePerson = (i: number, start: number) => {
    tl.to(people[i], { autoAlpha: 0, y: L.cards[i].y + 24, scale: 0.86, duration: 0.45, ease: 'power2.in' }, start);
  };
  const bump = (el: HTMLElement, start: number) => {
    tl.fromTo(el, { scale: 1.09 }, { scale: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, start);
  };
  // Something small flies from one point to another and is absorbed there
  const fly = (el: HTMLElement, from: { x: number; y: number }, to: { x: number; y: number }, start: number, travel = 0.8) => {
    tl.set(el, { x: from.x, y: from.y, scale: 0.6 }, start);
    tl.to(el, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'back.out(2)' }, start);
    tl.to(el, { x: to.x, y: to.y, duration: travel, ease: 'power2.inOut' }, start + 0.22);
    tl.to(el, { scale: 0.4, autoAlpha: 0, duration: 0.25, ease: 'power1.in' }, start + 0.22 + travel - 0.15);
  };
  const phoneAt = (dy = 0) => ({ x: L.phoneSplit.x, y: L.phoneSplit.y + dy });

  // =========================== EQUAL ===========================

  // ---- Type the amount and name it ----
  screen({ create: 1 }, 0.2, 0.8, 'power2.inOut');
  movePhone(L.phoneSplit, 0.1, 1.2);
  tl.to(motion, { face: READABLE, rotY: FRONT_ROT_Y, duration: 1.2, ease: 'power2.inOut' }, 0.1);
  caption(0, 0.6, 3.9);
  tl.to(state, { amountChars: EQUAL.typed.length, duration: 1.3, ease: 'none' }, 1.1);
  tl.to(state, { nameChars: EQUAL.splitName.length, duration: 1, ease: 'none' }, 2.4);
  tap('tapSplit', 3.5);

  // ---- Pick friends ----
  screen({ friends: 1 }, 3.8, 0.7, 'none');
  caption(1, 4.1, 7.4);
  showPerson(0, 4.4);
  tap('tapPick1', 4.9);
  screen({ pick1: 1 }, 5.1, 0.4);
  showPerson(1, 5.2);
  tap('tapPick2', 5.8);
  screen({ pick2: 1 }, 6, 0.4);
  showPerson(2, 6.1);
  tap('tapNext', 6.9);

  // ---- Who paid: the money goes in from your card ----
  screen({ payer: 1 }, 7.2, 0.7, 'none');
  caption(2, 7.7, 10.6);
  tap('tapPayer', 8.2);
  screen({ payerPick: 1 }, 8.4, 0.4);
  bump(people[0], 8.6);
  fly(paidPill, L.cards[0], phoneAt(), 8.7, 0.9);
  tap('tapSubmit', 9.9);

  // ---- The receipt, and everyone's share flying out to them ----
  screen({ receipt: 1 }, 10.2, 1, 'none');
  caption(3, 10.9, 14.6);
  tl.to(state, { receiptRows: EQUAL_MEMBERS + 1, duration: 1.2, ease: 'none' }, 11);
  coins.forEach((coin, i) => {
    fly(coin, phoneAt(-20 + i * 20), L.cards[i], 11.3 + i * 0.25);
    bump(people[i], 12.2 + i * 0.25);
  });
  tl.to(state, { eqShare: 1, duration: 1.3, ease: 'power1.out' }, 11.6);
  // Paid and Unpaid land with a thump; the ones who owe give a shake
  tl.to(state, { eqStatus: 1, duration: 0.8, ease: 'none' }, 12.9);
  [1, 2].forEach((i) => {
    tl.to(people[i], { x: L.cards[i].x + 7, duration: 0.06, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 13.15 + (i - 1) * 0.15);
  });
  tap('tapBack', 14.3);

  // =========================== DUTCH ===========================

  // ---- Back to Create, and over to Dutch ----
  [0, 1, 2].forEach((i) => hidePerson(i, 14.5 + i * 0.06));
  screen({ back: 1 }, 14.6, 0.7, 'none');
  tl.to(state, { dutch: 1, duration: 0.01 }, 15.3);
  caption(4, 15.2, DUTCH_AT + 5.1);
  tap('tapMode', 15.5);
  screen({ mode: 1 }, 15.7, 0.7, 'power1.inOut');
  // Dutch means starting from the bill: the scan screen opens out of the toggle
  screen({ home: 1 }, 16.5, 0.9, 'power2.inOut');

  // The bill scene keeps its own clock, starting when the Dutch half does
  const D = DUTCH_AT;

  // ---- The machine prints the bill ----
  movePhone(L.phonePrint, D + 0.1, 1.5);
  tl.to(motion, { face: 0.8, rotY: FRONT_ROT_Y - 0.34, duration: 1.5, ease: 'power2.inOut' }, D + 0.1);
  // The machine swings round into view
  tl.to(machine, { x: L.machine.x, y: L.machine.y, ry: L.machine.ry, rz: L.machine.rz, duration: 1.5, ease: 'power3.out' }, D + 0.4);
  // The bill feeds out, with the machine shuddering only while it prints
  tl.set(paper, { visible: 1 }, D + 1.8);
  tl.to(machine, { shake: 1.1, duration: 0.2 }, D + 1.8);
  tl.to(paper, { printed: 1, duration: 3, ease: 'none' }, D + 1.8);
  tl.to(machine, { shake: 0, duration: 0.2 }, D + 4.6);

  // ---- Tear it off and scan it ----
  // Pulled free: it jolts up off the slot, and the snap travels along the sheet
  tl.to(paper, { y: slot.y - 26, ry: L.machine.ry - 0.1, rz: L.machine.rz - 0.16, duration: 0.45, ease: 'power2.out' }, D + 4.85);
  tl.to(paper, { anchored: 0, duration: 0.35, ease: 'power2.inOut' }, D + 4.85);
  tl.to(paper, { wave: 15, duration: 0.3, ease: 'power2.out' }, D + 4.85);
  tl.to(paper, { wave: 6, curl: 1.15, tail: 1, bow: 0.05, cup: 11, twist: 22, duration: 1.3, ease: 'power1.inOut' }, D + 5.2);
  // It sags as it's carried across, and settles when it stops
  tl.to(paper, { pivot: 1, x: L.receiptScan.x, y: L.receiptScan.y, z: 40, scale: L.receiptScan.scale, rx: 0.2, ry: L.narrow ? 0 : 0.26, rz: -0.035, duration: 1.3, ease: 'power2.inOut' }, D + 5.2);
  tl.to(machine, { x: L.machine.x - stage.offsetWidth * 0.5, y: L.machine.y + 720, ry: -0.9, rz: 0.55, duration: 1.3, ease: 'power2.in' }, D + 5.1);
  movePhone(L.phoneScan, D + 5.2, 1.3);
  tl.to(motion, { face: 1, rotY: FRONT_ROT_Y + (L.narrow ? 0 : 0.22), duration: 1.3, ease: 'power2.inOut' }, D + 5.2);

  caption(5, D + 5.6, D + 11.2);
  screen({ scanCta: 1 }, D + 6.1, 0.5);
  tap('tapScan', D + 6.7);
  screen({ camera: 1 }, D + 7, 0.7, 'power2.inOut');
  tl.to(cone, { autoAlpha: 1, duration: 0.5 }, D + 7.5);
  screen({ lock: 1 }, D + 7.5, 0.8, 'power2.out');

  const sweepStart = D + 8.3;
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

  // ---- Everything the OCR read is entered ----
  tl.to(cone, { autoAlpha: 0, duration: 0.4 }, D + 11.15);
  screen({ review: 1 }, D + 11.2, 0.8, 'power2.out');
  tl.to(paper, { overlay: 0, duration: 0.3 }, D + 11.3);
  // The bill curls up as it's drawn in behind the phone
  tl.to(paper, { x: L.phoneReview.x, y: L.phoneReview.y, z: -80, scale: 0.28, curl: 2.6, rz: 0.25, duration: 1.1, ease: 'power2.in' }, D + 11.4);
  tl.set(paper, { visible: 0 }, D + 12.5);
  movePhone(L.phoneReview, D + 11.4, 1.2);
  tl.to(motion, { rotY: FRONT_ROT_Y, duration: 1.2, ease: 'power2.inOut' }, D + 11.4);
  caption(6, D + 11.7, D + 14.2);
  tl.to(state, { reviewRows: BILL.items.length + 1, duration: 1.4, ease: 'none' }, D + 11.8);
  tl.to(state, { reviewTotal: BILL.total, duration: 0.9, ease: 'power1.out' }, D + 12.5);

  // ---- Each item goes to whoever had it ----
  const T = D + 13.6;
  tap('tapReview', T);
  movePhone(L.phoneSplit, T, 1);
  tl.to(motion, { face: READABLE, rotY: FRONT_ROT_Y, duration: 1, ease: 'power2.inOut' }, T);
  PEOPLE.forEach((_, i) => showPerson(i, T + 0.3 + i * 0.12));
  caption(7, T + 0.6, T + 5.5);
  BILL.items.forEach((_, k) => {
    const start = T + 1.1 + k * 0.65;
    const owner = ITEM_OWNERS[k];
    tl.to(state, { tagged: k + 1, duration: 0.35, ease: 'none' }, start);
    fly(chips[k], phoneAt(-60 + k * 30), L.cards[owner], start + 0.1, 0.7);
    tl.to(state, { assign: k + 1, duration: 0.3, ease: 'power1.out' }, start + 0.85);
    bump(people[owner], start + 0.85);
  });

  // ---- Send it ----
  const S = T + 1.1 + BILL.items.length * 0.65 + 0.6;
  tap('tapSend', S);
  screen({ sent: 1 }, S + 0.3, 1.7, 'none');
  caption(8, S + 0.6);
  PEOPLE.slice(1).forEach((_, i) => {
    tl.to(people[i + 1], { borderColor: 'rgba(52,211,153,0.6)', duration: 0.3 }, S + 1.2 + i * 0.25);
  });
  const storyUnits = S + 2.1;
  tl.to({}, { duration: 0.01 }, storyUnits - 0.01);

  // Only touches the DOM when something actually changes
  const setText = (el: HTMLElement, value: string) => {
    if (el.textContent !== value) el.textContent = value;
  };
  const setColor = (el: HTMLElement, value: string) => {
    if (el.style.color !== value) el.style.color = value;
  };
  const GREEN = 'rgb(52, 211, 153)';
  const RED = 'rgb(248, 113, 113)';
  const GREY = 'rgb(163, 163, 163)';
  const INDIGO = 'rgb(99, 102, 241)';
  const topDutch = Math.max(...PEOPLE.map((p) => p.dutch));

  return () => {
    PEOPLE.forEach((person, i) => {
      let value = '';
      let sub = '';
      let color = GREY;
      let bar = INDIGO;
      let fill = 0;
      if (state.dutch < 0.5) {
        if (i >= EQUAL_MEMBERS) return;
        const amount = EQUAL.shares[i] * state.eqShare;
        value = state.eqShare > 0.001 ? inr(amount) : '';
        fill = amount / EQUAL.shares[EQUAL_MEMBERS - 1];
        if (i === 0) sub = state.payerPick > 0.5 ? `Paid ${inr(EQUAL.amount, 0)}` : 'Started the split';
        else sub = 'Added to the split';
        if (state.eqStatus > 0.1 + i * 0.15) {
          sub = i === 0 ? 'Paid' : 'Unpaid';
          color = i === 0 ? GREEN : RED;
          bar = color;
        }
      } else {
        const owed = dutchOwed(i, state.assign);
        value = inr(Math.round(owed), 0);
        fill = owed / topDutch;
        const had = BILL.items.filter((_, k) => ITEM_OWNERS[k] === i && state.assign > k + 0.5).map((item) => item.name);
        sub = had.length ? had.join(' + ') : 'Waiting for items';
        if (state.sent > 0.5 + i * 0.05) {
          sub = i === 0 ? 'Your share' : 'Request sent';
          if (i > 0) color = GREEN;
        }
      }
      setText(peopleAmounts[i], value);
      setText(peopleSubs[i], sub);
      setColor(peopleSubs[i], color);
      if (peopleBars[i].style.backgroundColor !== bar) peopleBars[i].style.backgroundColor = bar;
      gsap.set(peopleBars[i], { scaleX: Math.min(1, fill) });
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

  // On its own (the split part), the feature's name is up from the start and types itself in
  // (see SplitStoryCaptions); after the orbit, it rises into place as the chapter begins
  const standalone = orbitPieces.length === 0;
  gsap.set(opening, { autoAlpha: 1 });
  gsap.set(name, { yPercent: standalone ? 0 : 110 });
  gsap.set(tagline, standalone ? { autoAlpha: 1, y: 0 } : { autoAlpha: 0, y: 14 });

  // Only the orbit part of the showcase has these
  if (orbitPieces.length) timeline.to(orbitPieces, { autoAlpha: 0, scale: 0.86, duration: 0.8, ease: 'power2.in' }, 0);
  timeline.to(header, { autoAlpha: 0, y: -16, duration: 0.5, ease: 'power2.in' }, 0);
  timeline.to(motion, { rotY: FRONT_ROT_Y, duration: 2.6, ease: 'power2.inOut' }, 0);
  timeline.to(phone, { y: 24, scale: 0.9, duration: 1.2, ease: 'power2.inOut' }, 0);
  if (!standalone) {
    timeline.to(name, { yPercent: 0, duration: 0.8, ease: 'power3.out' }, 0.5);
    timeline.to(tagline, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.9);
  }
  timeline.to(opening, { autoAlpha: 0, y: -18, duration: 0.35, ease: 'power2.in' }, OPENING_UNITS - 0.35);

  const story = gsap.timeline({ defaults: { ease: 'none' } });
  const syncStoryDom = addSplitStory({ tl: story, stage, section, phone, motion, runtime: splitRuntime });
  timeline.add(story, OPENING_UNITS);

  return {
    timeline,
    update: (localTime) => {
      splitRuntime.screen.dirty = true;
      splitRuntime.screen.active = localTime >= SCREEN_TAKEOVER_AT;
      splitRuntime.paymentScene?.setActive(localTime > OPENING_UNITS + DUTCH_AT - 0.2 && localTime < OPENING_UNITS + DUTCH_AT + SCENE_ENDS_AT);
      syncStoryDom();
    },
  };
}
