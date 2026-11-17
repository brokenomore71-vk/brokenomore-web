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

// The playhead lives in playhead.ts; re-exported for the story sections that import it from here
export { createPlayhead, hurryWhenLeft } from './playhead';
