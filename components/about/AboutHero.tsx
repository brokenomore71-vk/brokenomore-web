'use client';

import { useRef, useEffect } from 'react';
import LogoMark from './LogoMark';
import gsap from 'gsap';

export default function AboutHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef(false);
  const allowScrollTime = useRef(0);

  useEffect(() => {
    const logo = logoRef.current;
    const text = textRef.current;
    if (!logo || !text) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.innerWidth >= 1024;

    // If reduced motion is preferred or already scrolled down on load, show final layout immediately
    if (isReduced || window.scrollY > 40) {
      revealedRef.current = true;
      gsap.set(logo, { xPercent: 0, yPercent: 0, scale: 1 });
      gsap.set(text, { opacity: 1, x: 0, y: 0 });
      return;
    }

    // Initial State:
    // Logo starts in the center, text is hidden
    if (isDesktop) {
      gsap.set(logo, { xPercent: 56, yPercent: 0, scale: 1.15 });
      gsap.set(text, { opacity: 0, x: 60, y: 0 });
    } else {
      gsap.set(logo, { xPercent: 0, yPercent: 12, scale: 1.05 });
      gsap.set(text, { opacity: 0, x: 0, y: 35 });
    }

    const triggerReveal = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      allowScrollTime.current = Date.now() + 650;

      const desktopNow = window.innerWidth >= 1024;

      gsap.to(logo, {
        xPercent: 0,
        yPercent: desktopNow ? 0 : -6,
        scale: desktopNow ? 1 : 0.88,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.to(text, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.7,
        delay: 0.15,
        ease: 'power3.out',
      });
    };

    // 1. Mouse wheel handler:
    // First scroll down reveals the text and absorbs the initial scroll momentum.
    // Subsequent scrolls scroll down to the rest of the page.
    const onWheel = (e: WheelEvent) => {
      if (window.scrollY > 40) return;

      if (!revealedRef.current) {
        if (e.deltaY > 0) {
          e.preventDefault();
          triggerReveal();
        }
      } else if (Date.now() < allowScrollTime.current) {
        if (e.deltaY > 0) {
          e.preventDefault();
        }
      }
      // When scrolling back up, nothing is prevented and revealedRef remains true,
      // so the logo stays on the left and the text remains visible.
    };

    // 2. Touch swipe handler for mobile:
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 40) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (!revealedRef.current) {
        if (deltaY > 8) {
          e.preventDefault();
          triggerReveal();
        }
      } else if (Date.now() < allowScrollTime.current) {
        if (deltaY > 0) {
          e.preventDefault();
        }
      }
    };

    // 3. Keyboard navigation (Down arrow, PageDown, Space):
    const onKeyDown = (e: KeyboardEvent) => {
      if (window.scrollY > 40) return;
      if (!revealedRef.current) {
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
          e.preventDefault();
          triggerReveal();
        }
      }
    };

    // 4. Fallback scroll handler (e.g. scrollbar dragged):
    const onScroll = () => {
      if (!revealedRef.current && window.scrollY > 10) {
        triggerReveal();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-12"
    >
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 pt-16 sm:pt-20 lg:grid-cols-2 lg:gap-14 lg:pt-0">
        {/* Logo container */}
        <div ref={logoRef} className="relative z-10 mx-auto flex w-full max-w-[520px] items-center justify-center">
          {/* The mark draws itself in: the loop, then the bars, the lock and the sparkles */}
          <LogoMark className="relative w-full" />
        </div>

        {/* Text container */}
        <div ref={textRef} className="relative z-10 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A890E6]">
            About us
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            One app for{' '}
            <span className="bg-gradient-to-r from-[#E33CF0] via-[#8B5CF6] to-[#22B8F0] bg-clip-text text-transparent">
              everything money.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg lg:mx-0">
            BrokeNoMore is a free personal finance app made in India. It brings everything you do with money into one simple place:
            tracking what you spend, splitting bills with friends, saving in digital gold, researching stocks with AI and planning
            your loans and bills, so staying on top of your finances never feels like a chore.
          </p>
        </div>
      </div>
    </section>
  );
}
