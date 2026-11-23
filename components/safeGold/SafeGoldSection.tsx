'use client';

import { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import handsImage from '@/assets/digitalgold_image/Hands_Holding_a_Dark_Smartphone-removebg-preview.png';
import phoneFrame from '@/assets/digitalgold_image/phone_frame.png';
import { FEATURES, GoldFeatureCard, Sparkle } from './GoldFeatureCards';
import GoldVault, { VAULT } from './GoldVault';
import GoldWord from './GoldWord';
import { createPlayhead } from '../playhead';
import { PX_PER_SECOND, stepScroll } from '../stepScroll';
import { STEPS, StepScene, StepText, StepToast, animateStepScene } from './GoldSteps';

gsap.registerPlugin(ScrollTrigger);

// The gold "DIGITAL GOLD" starts in, and the dimmer gold it settles to once it is on the phone
const GOLD = '#D4AF37';
const GOLD_ON_SCREEN = '#9C7C2E';

// Frame 1: where the text sits on the phone's screen: how much of the screen's width it spans, and
// how far down the screen its middle is
const TEXT_WIDTH_ON_SCREEN = 0.7;
const TEXT_CENTRE_ON_SCREEN = 0.5;

// The phone's screen in the photo (728 x 343): left, top, width and height, as shares of the photo
const SCREEN = { left: 0.2527, top: 0.1603, width: 0.5, height: 0.4373 };
// Its corners, as shares of its width / height, so they match at any size (the zoomed phone uses
// the same, so the two line up exactly when one takes over from the other)
const SCREEN_RADIUS = '6.5% / 15.8%';

// Frame 2's phone: phone_frame.png (phone.png, 1880 x 836, with its screen cut out) and where its
// screen sits in it, in the image's pixels
const PHONE = { w: 1880, h: 836, screen: { x: 113, y: 71, w: 1658, h: 678 } };
// The cut-out's corners (128px), as shares of the screen's width / height
const PHONE_SCREEN_RADIUS = `${(128 / PHONE.screen.w) * 100}% / ${(128 / PHONE.screen.h) * 100}%`;

// When frame 2 (the zoom into the phone) starts, in timeline units
const ZOOM_AT = 1.15;

// How fast the story plays towards a checkpoint, in timeline units a second
const WATCHING_SPEED = 1 / 0.7;

// An element's layout position inside `root`, ignoring any transforms on the way (so it can be
// measured while things are mid-animation)
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}
function rectIn(el: HTMLElement, root: HTMLElement) {
  const { x, y } = offsetIn(el, root);
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

export default function SafeGoldSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (k: string) => section.querySelector<HTMLElement>(`[data-g="${k}"]`)!;
    const qa = (k: string) => Array.from(section.querySelectorAll<HTMLElement>(`[data-g="${k}"]`));
    const logo = q('logo');
    const word = q('word');
    const letters = qa('letter');
    const shine = q('shine');
    const hands = q('hands');
    const sharp = q('sharp');
    const blurred = q('blurred');
    const screen = q('screen');
    const headline = q('headline');
    const device = q('device');
    const bezel = q('bezel');
    const content = q('content');
    const panel = q('panel');
    const list = q('list');
    const listView = q('list-view');
    const vault = q('vault');
    const screenTitle = q('screen-title');
    const door = section.querySelector<SVGGElement>('[data-g="vault-door"]')!;
    const openDoor = section.querySelector<SVGGElement>('[data-g="vault-open-door"]')!;
    const wheel = section.querySelector<SVGGElement>('[data-g="vault-wheel"]')!;
    // Frame 3's pieces
    const stepScreens = qa('step-screen');
    const stepToasts = qa('step-toast');
    const stepTexts = qa('step-text');
    const toastBars = stepToasts.map((t) => t.querySelector<HTMLElement>('[data-g="toast-bar"]')!);
    const panelCards = Array.from(panel.querySelectorAll<HTMLElement>('[data-g="card"]'));
    const mgrid = q('mgrid');

    // Frame 1: where the logo has to go (from the middle of the section) to sit on the photo's screen
    const toScreen = () => {
      const s = rectIn(screen, section);
      const l = rectIn(logo, section);
      return {
        x: s.cx - l.cx,
        y: s.y + s.h * TEXT_CENTRE_ON_SCREEN - l.cy,
        scale: (s.w * TEXT_WIDTH_ON_SCREEN) / word.offsetWidth,
      };
    };
    // Frame 2: the logo stays where it is on the screen as the phone zooms, growing with it
    const toZoomed = () => {
      const d = rectIn(device, section);
      const s = rectIn(screen, section);
      const l = rectIn(logo, section);
      return {
        x: d.cx - l.cx,
        y: d.y + d.h * TEXT_CENTRE_ON_SCREEN - l.cy,
        scale: ((s.w * TEXT_WIDTH_ON_SCREEN) / word.offsetWidth) * (d.w / s.w),
      };
    };
    // The zoomed phone, put back over the photo's screen
    const deviceOnScreen = () => {
      const d = rectIn(device, section);
      const s = rectIn(screen, section);
      return { x: s.cx - d.cx, y: s.cy - d.cy, scale: s.w / d.w };
    };
    // The photo, grown about its screen's middle so its phone grows with the zoomed one
    const handsZoomed = () => {
      const d = rectIn(device, section);
      const s = rectIn(screen, section);
      return { x: d.cx - s.cx, y: d.cy - s.cy, scale: (d.w / s.w) * 1.04 };
    };
    // How far the card list scrolls: up by exactly one card (so none is left cut off under the
    // heading), or less if the list already fits
    // Frame 3: the phone shrinks a little and slides left, so its right edge sits at 54% of the
    // width and its Dynamic Island end runs off the screen (on small screens it stays put, and the
    // words go below it)
    const SIDE_SCALE = 0.78;
    const toSide = () => {
      if (window.innerWidth < 640) {
        // Small screens: the phone grows a little and slides left too, its right edge near the
        // screen's edge and its Dynamic Island end running off the left (the words stay below it)
        const d = rectIn(device, section);
        const scale = 1.35;
        return { x: section.clientWidth * 0.97 - d.cx - (d.w * scale) / 2, scale };
      }
      const d = rectIn(device, section);
      return { x: section.clientWidth * 0.54 - d.cx - (d.w * SIDE_SCALE) / 2, scale: SIDE_SCALE };
    };
    const listTravel = () => {
      const second = list.children[1] as HTMLElement | undefined;
      return Math.min(second?.offsetTop ?? 0, Math.max(0, list.scrollHeight - listView.clientHeight));
    };

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // ---- 1. Arriving from the credit cards: the title rises in, letter by letter, once ----
      gsap.set(letters, { yPercent: 110, autoAlpha: 0 });
      gsap.set(shine, { xPercent: -120 });
      gsap.set(hands, {
        autoAlpha: 0,
        scale: 0.94,
        y: 30,
        transformOrigin: `${(SCREEN.left + SCREEN.width / 2) * 100}% ${(SCREEN.top + SCREEN.height / 2) * 100}%`,
      });
      gsap.set(blurred, { autoAlpha: 0 });
      gsap.set(headline, { autoAlpha: 0, y: 24 });
      gsap.set([device, bezel, content], { autoAlpha: 0 });
      gsap.set(device, { transformOrigin: '50% 50%' });

      const intro = gsap.timeline({ paused: true });
      intro
        .to(letters, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power4.out', stagger: 0.05 })
        .to(shine, { xPercent: 120, duration: 1.1, ease: 'power2.inOut' }, '-=0.2');
      const arrival = ScrollTrigger.create({ trigger: section, start: 'top 75%', once: true, onEnter: () => intro.play() });

      // The vault's door swings about its hinge and its wheel turns about its middle. Tweened as
      // plain numbers and written to the SVG's own transform attributes, with the pivots spelled
      // out, rather than left to GSAP to work out from the drawing.
      const { cx, cy } = VAULT.door;
      // shut: how far the shut door is still across the opening (1) before folding in to its hinge;
      // open: how far the open door has swung out from the hinge (0 to 1)
      const pose = { shut: 1, open: 0, turn: 0 };
      const drawVault = () => {
        const h = VAULT.hingeX;
        door.setAttribute('transform', `translate(${h} 0) scale(${Math.max(pose.shut, 0.001)} 1) translate(${-h} 0)`);
        openDoor.setAttribute('transform', `translate(${h} 0) scale(${Math.max(pose.open, 0.001)} 1) translate(${-h} 0)`);
        wheel.setAttribute('transform', `rotate(${pose.turn} ${cx} ${cy})`);
      };
      drawVault();
      gsap.set(screenTitle, { autoAlpha: 0, y: 16 });
      gsap.set(vault, { autoAlpha: 0, y: 24, scale: 0.92 });
      // It floats gently, all the time (on a wrapper, so the scroll's own moves stay separate)
      gsap.to(vault.firstElementChild, { y: -6, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

      // The whole story, paused: the scroll doesn't scrub it directly. It is played by a playhead
      // towards the checkpoint the scroll has reached (see the end of this block).
      const tl = gsap.timeline({ paused: true });

      // ---- 2. Frame 1: the phone comes up, the title goes into it, the headline comes in above ----
      tl
        .to({}, { duration: 0.15 }, 0)
        .to(hands, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.15)
        .to(logo, { x: () => toScreen().x, y: () => toScreen().y, scale: () => toScreen().scale, duration: 0.45, ease: 'power2.inOut' }, 0.3)
        .to(word, { color: GOLD_ON_SCREEN, duration: 0.45, ease: 'none' }, 0.3)
        .to(headline, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.65)
        .to({}, { duration: 0.25 }, 0.9);

      // ---- 3. Frame 2: into the phone. It fills the view, the hands blur away behind it, the
      // vault and the headline come up on the screen and the features come in down the side ----
      const Z = ZOOM_AT;
      tl
        // The sharp phone takes over from the photo's screen, in exactly the same place
        .set(device, { autoAlpha: 1 }, Z)
        .fromTo(
          device,
          { x: () => deviceOnScreen().x, y: () => deviceOnScreen().y, scale: () => deviceOnScreen().scale },
          { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power2.inOut', immediateRender: true },
          Z
        )
        .to(bezel, { autoAlpha: 1, duration: 0.3, ease: 'none' }, Z + 0.1)
        // The photo's blacked-out screen, now hidden behind the zoomed phone, goes, so it doesn't
        // show once the phone moves aside in frame 3
        .set(screen, { autoAlpha: 0 }, Z + 0.6)
        .to(hands, { x: () => handsZoomed().x, y: () => handsZoomed().y, scale: () => handsZoomed().scale, duration: 0.6, ease: 'power2.inOut' }, Z)
        .to(sharp, { autoAlpha: 0, duration: 0.45, ease: 'none' }, Z + 0.05)
        .to(blurred, { autoAlpha: 1, duration: 0.45, ease: 'none' }, Z + 0.05)
        .to(headline, { autoAlpha: 0, y: -24, duration: 0.25, ease: 'power1.in' }, Z)
        // "DIGITAL GOLD" grows with the phone, then gives way to the screen's own headline
        .to(logo, { x: () => toZoomed().x, y: () => toZoomed().y, scale: () => toZoomed().scale, duration: 0.6, ease: 'power2.inOut' }, Z)
        .to(logo, { autoAlpha: 0, duration: 0.2, ease: 'none' }, Z + 0.35)
        // The screen lights up, the headline comes in at its top and the vault rises below it
        .to(content, { autoAlpha: 1, duration: 0.3, ease: 'none' }, Z + 0.4)
        .to(screenTitle, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, Z + 0.5)
        .to(vault, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }, Z + 0.55)
        // Its wheel turns, then its door swings open on the gold inside: squashing to edge-on,
        // then on past the hinge, showing its back
        .to(pose, { turn: 270, duration: 0.35, ease: 'power1.inOut', onUpdate: drawVault }, Z + 0.8)
        .to(pose, { shut: 0, duration: 0.22, ease: 'power2.in', onUpdate: drawVault }, Z + 1.12)
        .to(pose, { open: 1, duration: 0.22, ease: 'power2.out', onUpdate: drawVault }, Z + 1.32)
        // The features come in down the side, then the list moves up to show the last of them
        .fromTo(panel, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out', immediateRender: true }, Z + 0.5)
        .fromTo(
          qa('card'),
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.07, immediateRender: true },
          Z + 0.58
        )
        .to(list, { y: () => -listTravel(), duration: 0.5, ease: 'power1.inOut' }, Z + 1.05)
        // Holds on the finished frame a moment
        .to({}, { duration: 0.2 }, Z + 1.55);

      // ---- 4. Frame 3: what the app does, one step per scroll. The phone slides left, and each
      // step (buy, sell, withdraw) brings its screen, its toast, its card in the side panel and its
      // words beside the phone ----
      const F = Z + 1.75;
      const STEP = 0.9;
      const ring = (on: boolean) => `inset 0 0 0 1.5px rgba(212,175,55,${on ? 0.9 : 0})`;
      gsap.set([...stepScreens, ...stepToasts, ...stepTexts], { autoAlpha: 0 });
      gsap.set(toastBars, { scaleX: 0 });
      gsap.set(panelCards, { boxShadow: ring(false) });
      tl
        .to([screenTitle, vault], { autoAlpha: 0, y: -16, duration: 0.25, ease: 'power1.in' }, F)
        .to(mgrid, { autoAlpha: 0, duration: 0.2, ease: 'none' }, F)
        // The blurred hands behind go, leaving plain black
        .to(hands, { autoAlpha: 0, duration: 0.35, ease: 'none' }, F)
        .to(device, { x: () => toSide().x, scale: () => toSide().scale, duration: 0.55, ease: 'power2.inOut' }, F);
      STEPS.forEach((step, i) => {
        const at = F + 0.35 + i * STEP;
        tl
          .fromTo(stepScreens[i], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out', immediateRender: false }, at)
          .fromTo(stepTexts[i], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out', immediateRender: false }, at + 0.05)
          .fromTo(stepToasts[i], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out', immediateRender: false }, at + 0.1)
          .to(toastBars[i], { scaleX: 1, duration: 0.5, ease: 'none' }, at + 0.15)
          // Its card in the side panel lights up; the others dim
          .to(
            panelCards,
            {
              opacity: (k: number) => (k === step.card ? 1 : 0.4),
              boxShadow: (k: number) => ring(k === step.card),
              duration: 0.2,
              ease: 'none',
            },
            at
          );
        // Its illustration plays out on the screen
        animateStepScene(tl, stepScreens[i], i, at);
        // ...and goes again for the next one (the last one stays)
        if (i < STEPS.length - 1) {
          tl.to([stepScreens[i], stepToasts[i], stepTexts[i]], { autoAlpha: 0, y: -16, duration: 0.18, ease: 'power1.in' }, at + STEP - 0.2);
        }
      });
      // Holds on the last step a moment
      const E = F + 0.35 + STEPS.length * STEP + 0.3;

      // ---- 5. Frame 4: G O L D. The phone and its words go; a heading comes up, then four tiles,
      // one letter in each, with a feature under each ----
      const f4 = q('f4');
      const f4Heading = q('f4-heading');
      const f4Tiles = qa('f4-tile');
      const f4Letters = qa('f4-letter');
      gsap.set(f4, { autoAlpha: 0 });
      gsap.set(f4Heading, { autoAlpha: 0, y: 24 });
      gsap.set(f4Tiles, { autoAlpha: 0, y: 60 });
      gsap.set(f4Letters, { scale: 0.55, autoAlpha: 0, transformOrigin: '50% 60%' });
      tl.to(device, { autoAlpha: 0, x: () => toSide().x - 160, duration: 0.35, ease: 'power2.in' }, E)
        .to(stepTexts[STEPS.length - 1], { autoAlpha: 0, y: -16, duration: 0.2, ease: 'power1.in' }, E)
        .set(f4, { autoAlpha: 1 }, E + 0.2)
        .to(f4Heading, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, E + 0.2)
        .to(f4Tiles, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.1 }, E + 0.35)
        .to(f4Letters, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)', stagger: 0.1 }, E + 0.45)
        // Holds on the word before the page moves on
        .to({}, { duration: 0.35 }, E + 1.0);

      // ---- Checkpoints: where the story comes to rest ----
      // Each one is a finished frame or step: frame 1 (hands, phone and headline), frame 2 (the
      // open vault), each of frame 3's steps (buy, sell, withdraw) and frame 4 (G O L D). The scroll
      // maps straight onto the story, so a longer stretch of story takes more scrolling.
      const stepDone = (i: number) => F + 0.35 + i * STEP + (i === STEPS.length - 1 ? 0.8 : 0.68);
      const marks = [0, ZOOM_AT, F, ...STEPS.map((_, i) => stepDone(i)), tl.duration()];
      const watchSeconds = (units: number) => units / WATCHING_SPEED;

      // The playhead plays the story towards the scroll's position at a steady watching pace,
      // however fast the scroll, so every frame is seen through
      const playhead = createPlayhead(tl, { watchingSpeed: WATCHING_SPEED });
      const pin = ScrollTrigger.create({
        trigger: section,
        start: 'top 72px',
        // As long as the story takes to watch
        end: () => `+=${Math.round(watchSeconds(tl.duration()) * PX_PER_SECOND)}`,
        pin: true,
        anticipatePin: 1,
        // Pinned sections work out their positions top to bottom (Hubble 3, this 2, Quicko 1)
        refreshPriority: 2,
        onUpdate: (self) => playhead.follow(self.progress),
      });
      // The story's measured moves (where the phone goes, how big the title gets) are worked out
      // again when the page is re-measured, from the story's start, then it goes back to where it was
      const remeasure = () => {
        const time = tl.time();
        tl.time(0);
        tl.invalidate();
        tl.time(time);
      };
      ScrollTrigger.addEventListener('refresh', remeasure);

      // One checkpoint per gesture, played through before the next (see stepScroll.ts)
      const unstep = stepScroll({
        pin,
        stops: () => marks.map((m) => m / tl.duration()),
        seconds: (from, to) => watchSeconds((to - from) * tl.duration()),
        settled: () => Math.abs(tl.time() - pin.progress * tl.duration()) < 0.02,
      });

      // The partner link jumps past the section: the story finishes at once
      const onRevealPartner = () => playhead.jump(1);
      window.addEventListener('reveal-partner', onRevealPartner);

      ScrollTrigger.sort();
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => {
        unstep();
        window.removeEventListener('reveal-partner', onRevealPartner);
        ScrollTrigger.removeEventListener('refresh', remeasure);
        playhead.kill();
        pin.kill();
        arrival.kill();
        intro.kill();
      };
    });

    // Reduced motion: the finished frame (inside the phone, the vault open), without the animation
    mm.add('(prefers-reduced-motion: reduce)', () => {
      // (the open door is drawn open by default; only the shut one has to go)
      gsap.set([hands, headline, logo, door], { autoAlpha: 0 });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="digital-gold"
      data-safegold
      aria-label="Digital Gold"
      className="relative w-full h-[calc(100svh-72px)] overflow-hidden bg-black text-white select-none"
    >
      {/* The headline, above the phone (comes in once the title is on the screen) */}
      <div data-g="headline" className="absolute inset-x-0 top-5 sm:top-8 z-40 px-3 xs:px-4 text-center">
        <h2 className="text-2xl xs:text-[28px] font-semibold tracking-tight leading-[1.1] text-[#E5E5E5] sm:text-4xl md:text-5xl">
          Your money deserves to grow.
        </h2>
        <p className="mx-auto mt-2 sm:mt-3 max-w-xl text-xs xs:text-sm sm:text-base tracking-tight text-neutral-400">
          Start your journey with digital gold. Invest in 24K gold, one purchase at a time.
        </p>
      </div>

      {/* The hands holding the phone, below the headline (blurred behind the zoomed phone later) */}
      <div className="absolute inset-x-0 bottom-0 top-[110px] xs:top-[120px] sm:top-[150px] md:top-[170px] z-10 flex items-center justify-center px-3">
        <div
          data-g="hands"
          className="relative shrink-0 aspect-[728/343] will-change-[transform,opacity]"
          // The phone is only the middle half of the photo, so on narrow screens the photo runs
          // past the sides (cropping the hands) to keep the phone a good size
          style={{ width: 'min(1040px, 130vw, calc((100svh - 72px - 190px) * 2.12))' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 98%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 98%)',
            }}
          >
            <div data-g="sharp" className="absolute inset-0">
              <Image src={handsImage} alt="Hands holding a phone" fill sizes="(max-width: 800px) 130vw, 1040px" className="object-contain object-center" />
            </div>
            {/* The same photo, blurred and dimmed, for behind the zoomed phone */}
            <div data-g="blurred" className="absolute inset-0 blur-[6px] brightness-[0.55]" aria-hidden="true">
              <Image src={handsImage} alt="" fill sizes="(max-width: 800px) 130vw, 1040px" className="object-contain object-center" />
            </div>
          </div>

          {/* The phone's screen, blacked out */}
          <div
            data-g="screen"
            className="absolute bg-black pointer-events-none"
            style={{
              left: `${SCREEN.left * 100}%`,
              top: `${SCREEN.top * 100}%`,
              width: `${SCREEN.width * 100}%`,
              height: `${SCREEN.height * 100}%`,
              borderRadius: SCREEN_RADIUS,
            }}
          />
        </div>
      </div>

      {/* Frame 2: the phone, zoomed in. Laid out at its full size (so it stays sharp) and shrunk
          onto the photo's screen until the zoom starts. */}
      <div className="pointer-events-none absolute inset-0 z-[25] flex flex-col items-center justify-center gap-9 px-3">
        <div
          data-g="device"
          className="relative shrink-0 will-change-transform"
          // The frame image runs 13% wider and 23% taller than the screen, so the screen is sized
          // to leave room for it
          style={{ width: 'min(84vw, 1400px, calc((100svh - 144px) * 1.98))', aspectRatio: `${PHONE.screen.w} / ${PHONE.screen.h}` }}
        >
          <div className="absolute inset-0 overflow-hidden bg-black" style={{ borderRadius: PHONE_SCREEN_RADIUS }}>
            <div data-g="content" className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_38%_58%,#18130a,#070707_75%)]">
              {/* The free part of the screen (clear of the Dynamic Island and the side panel): the
                  headline at the top, and the vault below it */}
              <div className="absolute bottom-[4%] left-[8%] right-[6%] top-[6%] flex flex-col items-center sm:right-[27%]">
                <div data-g="screen-title" className="shrink-0 text-center">
                  <h3 className="text-[12px] sm:text-[20px] md:text-[26px] lg:text-[34px] font-semibold tracking-tight leading-[1.1] text-[#F5F5F5]">
                    Start small. Build something <span className="text-[#F5D76E]">golden.</span>
                  </h3>
                  <p className="mx-auto mt-1 lg:mt-2 hidden max-w-[34em] text-[10px] md:text-[12px] lg:text-[15px] leading-snug tracking-tight text-neutral-400 sm:block">
                    Buy digital gold, track your holdings, withdraw physical gold or sell when you need to. Your gold
                    journey starts here.
                  </p>
                </div>
                <div data-g="vault" className="mt-[2%] min-h-0 w-full flex-1">
                  <div className="flex h-full w-full items-center justify-center">
                    {/* Its wall fades out at the edges, into the screen */}
                    <GoldVault
                      className="h-full max-w-full"
                      style={{
                        maskImage: 'radial-gradient(ellipse 50% 50% at 50% 48%, black 72%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 48%, black 72%, transparent 100%)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Frame 3: in the same free part of the screen, the app's screens, one per step,
                  with a toast along the bottom */}
              <div className="absolute bottom-[4%] left-[8%] right-[6%] top-[6%] sm:right-[27%]">
                {STEPS.map((s, i) => (
                  <div key={s.key} data-g="step-screen" className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center sm:bottom-[22%]" style={{ visibility: 'hidden' }}>
                    <StepScene step={i} />
                  </div>
                ))}
                {STEPS.map((s, i) => (
                  <div key={s.key} data-g="step-toast" className="absolute bottom-0 left-1/2 hidden w-[72%] max-w-[460px] -translate-x-1/2 sm:block" style={{ visibility: 'hidden' }}>
                    <StepToast step={i} />
                  </div>
                ))}
              </div>

              {/* What digital gold lets you do, down the right (moved below the phone on small screens) */}
              <div
                data-g="panel"
                className="absolute inset-y-0 right-0 hidden w-[24%] flex-col bg-[#090909]/95 px-[1.1%] pt-[2.2%] sm:flex"
              >
                <p className="flex items-start gap-1.5 lg:gap-2 px-1 pb-[5%] text-[10px] md:text-[12px] lg:text-[15px] font-semibold leading-snug text-[#F5F5F5]">
                  <Sparkle className="mt-0.5 h-3.5 w-3.5 lg:h-5 lg:w-5 shrink-0" />
                  What you can do with digital gold
                </p>
                <div
                  data-g="list-view"
                  className="relative min-h-0 flex-1 overflow-hidden"
                  // The next card peeks in at the bottom, fading out
                  style={{
                    maskImage: 'linear-gradient(to bottom, black 92%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 92%, transparent)',
                  }}
                >
                  <div data-g="list" className="flex flex-col gap-2 lg:gap-3 pb-3 will-change-transform">
                    {FEATURES.map((_, i) => (
                      <GoldFeatureCard key={i} step={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The phone's frame (phone.png with its screen cut out, keeping the Dynamic Island), over
              the screen and lined up with it */}
          <div
            data-g="bezel"
            className="pointer-events-none absolute"
            style={{
              left: `${(-PHONE.screen.x / PHONE.screen.w) * 100}%`,
              top: `${(-PHONE.screen.y / PHONE.screen.h) * 100}%`,
              width: `${(PHONE.w / PHONE.screen.w) * 100}%`,
              height: `${(PHONE.h / PHONE.screen.h) * 100}%`,
            }}
          >
            <Image src={phoneFrame} alt="" fill sizes="(max-width: 640px) 96vw, 1600px" className="object-fill" />
          </div>
        </div>

        {/* Small screens: the features, below the phone */}
        <div data-g="mgrid" className="grid w-full max-w-[420px] grid-cols-2 gap-2 sm:hidden">
          {FEATURES.map((_, i) => (
            <GoldFeatureCard key={i} step={i} compact />
          ))}
        </div>
      </div>

      {/* Frame 3: what each step does, beside the phone (below it on small screens) */}
      <div className="pointer-events-none absolute inset-x-5 bottom-[14%] z-30 sm:inset-x-auto sm:bottom-0 sm:left-[59%] sm:right-[5%] sm:top-0 sm:flex sm:items-center">
        <div className="relative w-full">
          {STEPS.map((s, i) => (
            <div key={s.key} data-g="step-text" className={i === 0 ? 'relative' : 'absolute inset-x-0 top-0'} style={{ visibility: 'hidden' }}>
              <StepText step={i} />
            </div>
          ))}
        </div>
      </div>

      {/* Frame 4: G O L D, four tiles with a feature under each, and a heading above */}
      <div data-g="f4" className="pointer-events-none absolute inset-0 z-30" style={{ visibility: 'hidden' }}>
        <GoldWord />
      </div>

      {/* "DIGITAL GOLD": big in the middle at first, then on the phone's screen, then its title */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
        <div data-g="logo" className="relative overflow-hidden px-3 xs:px-4 py-2 will-change-transform">
          <span
            data-g="word"
            className="flex text-[30px] xs:text-[36px] sm:text-[60px] lg:text-[84px] font-bold uppercase leading-none tracking-[0.08em] whitespace-nowrap"
            style={{ color: GOLD }}
            aria-label="Digital Gold"
            role="img"
          >
            {'DIGITAL GOLD'.split('').map((letter, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.1em]">
                <span data-g="letter" className="inline-block" aria-hidden="true">
                  {letter === ' ' ? ' ' : letter}
                </span>
              </span>
            ))}
          </span>
          {/* A light that sweeps across it once, as on Offers */}
          <span
            data-g="shine"
            className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/25 to-transparent mix-blend-overlay"
          />
        </div>
      </div>
    </section>
  );
}
