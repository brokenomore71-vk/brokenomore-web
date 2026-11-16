import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSplitChapter, type SplitStoryRuntime } from './splitStory/timeline';
// The stock and gold phone chapters are switched off for now (SafeGold has its own section).
// import { createStockChapter, type StockStoryRuntime } from './stockStory/timeline';
// import { createGoldChapter, type GoldStoryRuntime } from './goldStory/timeline';

gsap.registerPlugin(ScrollTrigger);
// On phones the address bar shows and hides as the page scrolls, resizing the window; re-measuring
// every pinned section each time made the page jump mid-scroll
ScrollTrigger.config({ ignoreMobileResize: true });

// How far the user scrolls, in pixels, per unit of chapter timeline.
export const SCROLL_PER_UNIT = 280;

// However hard the user scrolls, the animation plays no faster than this: one unit per 0.6
// seconds, the pace the story was designed to be watched at.
const WATCHING_SPEED = 1 / 0.6;
// How gently it eases to a stop as it reaches the scroll position. Higher stops more abruptly.
const SETTLE = 8;

export interface ChapterContext {
  stage: HTMLElement;
  section: HTMLElement;
  header: HTMLElement;
  phone: HTMLElement;
  motion: { rotY: number; face: number };
  splitRuntime: SplitStoryRuntime;
  // stockRuntime: StockStoryRuntime;
  // goldRuntime: GoldStoryRuntime;
}

export interface Chapter {
  timeline: gsap.core.Timeline;
  /** Called on every scroll update with the time inside this chapter. */
  update: (localTime: number) => void;
}

// The website's order of features. Each chapter starts where the last one ended, so a new
// feature joins the journey by being added to this list.
const CHAPTERS: ((context: ChapterContext) => Chapter)[] = [
  createSplitChapter,
  // createStockChapter,
  // createGoldChapter,
];

// Strings the chapters into one timeline for scrolling to drive, forwards and backwards.
export function buildJourney(context: ChapterContext) {
  const timeline = gsap.timeline({ paused: true });
  const placed: { chapter: Chapter; start: number }[] = [];

  CHAPTERS.forEach((create) => {
    const chapter = create(context);
    const start = timeline.duration();
    timeline.add(chapter.timeline, start);
    placed.push({ chapter, start });
  });

  const update = () => {
    const time = timeline.time();
    placed.forEach(({ chapter, start }) => chapter.update(time - start));
  };

  return { timeline, update };
}

// Moves a timeline towards wherever the scroll position says it should be, at a steady normal speed,
// forwards or backwards. It never speeds up on fast scrolls, and stops once it has got there.
export function createPlayhead(
  timeline: gsap.core.Timeline,
  // A section can set its own pace: how fast it plays (units per second)
  // `paceAt` slows (below 1) or quickens (above 1) the playback at a given point on the timeline,
  // for stretches where a lot happens in a short time
  {
    watchingSpeed = WATCHING_SPEED,
    longestCatchUp,
    paceAt,
  }: { watchingSpeed?: number; longestCatchUp?: number; paceAt?: (time: number) => number } = {}
) {
  let target = timeline.time();

  const tick = (_time: number, deltaMs: number) => {
    const current = timeline.time();
    const distance = Math.abs(target - current);
    if (distance === 0) return;
    if (distance < 0.0005) {
      timeline.time(target);
      return;
    }
    const seconds = Math.min(deltaMs / 1000, 0.1);
    // Never speeds up on fast scrolls; always plays at normal watching pace
    const pace = paceAt ? paceAt(current) : 1;
    const step = Math.min(distance, Math.min(distance * SETTLE, watchingSpeed * pace) * seconds);
    timeline.time(current + Math.sign(target - current) * step);
  };
  gsap.ticker.add(tick);

  return {
    follow: (progress: number) => {
      target = progress * timeline.duration();
    },
    /** Goes straight there, for when the layout has been rebuilt rather than scrolled. */
    jump: (progress: number) => {
      target = progress * timeline.duration();
      timeline.time(target);
    },
    /** Catches up at normal watching speed without rushing. */
    hurry: () => {},
    kill: () => gsap.ticker.remove(tick),
  };
}

const HURRY_SECONDS = 0.35;

// Once the visitor has scrolled past a pinned section while its animation is still catching up,
// `hurry` finishes it off quickly. The page is never pulled back to the section's edge:
// fighting the browser's own scrolling, a frame at a time, is what made the page shake.
// `played` is how far the animation has actually got, 0 to 1.
export function hurryWhenLeft(
  getPin: () => ScrollTrigger | null | undefined,
  played: () => number,
  hurry: () => void
) {
  const tick = () => {
    const pin = getPin();
    if (!pin) return;
    const y = window.scrollY;
    const p = played();
    if ((y > pin.end + 1 && p < 0.999) || (y < pin.start - 1 && p > 0.001)) hurry();
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
