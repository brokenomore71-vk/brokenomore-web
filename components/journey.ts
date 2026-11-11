import gsap from 'gsap';
import { createSplitChapter, type SplitStoryRuntime } from './splitStory/timeline';
// The stock and gold phone chapters are switched off for now (SafeGold has its own section).
// import { createStockChapter, type StockStoryRuntime } from './stockStory/timeline';
// import { createGoldChapter, type GoldStoryRuntime } from './goldStory/timeline';

// How far the user scrolls, in pixels, per unit of chapter timeline.
export const SCROLL_PER_UNIT = 280;

// However hard the user scrolls, the animation plays no faster than this: one unit per 0.6
// seconds, the pace the story was designed to be watched at.
const WATCHING_SPEED = 1 / 0.6;
// Except that a long fling across the page catches up within about this many seconds, rather
// than playing on for ages after the user has stopped.
const LONGEST_CATCH_UP = 1.8;
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

// Moves a timeline towards wherever the scroll position says it should be, at a limited speed,
// forwards or backwards. Stops once it has got there.
export function createPlayhead(timeline: gsap.core.Timeline) {
  let target = timeline.time();
  let speed = WATCHING_SPEED;

  const tick = (_time: number, deltaMs: number) => {
    const current = timeline.time();
    const distance = Math.abs(target - current);
    if (distance === 0) return;
    if (distance < 0.0005) {
      timeline.time(target);
      speed = WATCHING_SPEED;
      return;
    }
    const seconds = Math.min(deltaMs / 1000, 0.25);
    // Speeds up only as far as a long fling needs, and holds that speed until it has arrived
    speed = Math.max(speed, distance / LONGEST_CATCH_UP);
    const step = Math.min(distance, Math.min(distance * SETTLE, speed) * seconds);
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
    kill: () => gsap.ticker.remove(tick),
  };
}
