'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { FeaturePage } from '@/lib/featurePages';

gsap.registerPlugin(ScrollTrigger);

// A feature page's content, ending in a small "See more" button for the next feature. Pressing it
// carries on as if you'd kept scrolling: this page slides up and away, the next page loads, and
// its content rises up into place from below.
const ARRIVING = 'feature-scroll-arriving';

export default function FeatureScroll({ next, children }: { next: FeaturePage; children: React.ReactNode }) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    router.prefetch(next.href);
  }, [router, next.href]);

  // Arriving from the previous feature's button: rise in from below
  useLayoutEffect(() => {
    const el = contentRef.current;
    let arriving = false;
    const done = () => {
      try {
        sessionStorage.removeItem(ARRIVING);
      } catch {}
    };
    try {
      arriving = sessionStorage.getItem(ARRIVING) === '1';
    } catch {}
    if (!el || !arriving) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done();
      return;
    }
    // The flag is only cleared once it has risen in, so if this is run twice (as React does in
    // development) the second run still plays it
    const tween = gsap.fromTo(
      el,
      { y: () => window.innerHeight * 0.55, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
        onComplete: () => {
          done();
          ScrollTrigger.refresh();
        },
      }
    );
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: 'transform,opacity,visibility' });
    };
  }, []);

  const goNext = () => {
    const el = contentRef.current;
    if (leaving.current) return;
    leaving.current = true;
    try {
      sessionStorage.setItem(ARRIVING, '1');
    } catch {}
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(next.href);
      return;
    }
    // Slide this page up and out, the way it would go if you kept scrolling
    gsap.to(el, { y: -window.innerHeight * 0.55, autoAlpha: 0, duration: 0.55, ease: 'power2.in', onComplete: () => router.push(next.href) });
  };

  return (
    <div ref={contentRef} className="flex w-full flex-col items-center">
      {children}
      <button
        type="button"
        onClick={goNext}
        className="group mt-16 flex flex-col items-center gap-2.5 text-neutral-500 transition-colors hover:text-white sm:mt-24"
        aria-label={`See more: ${next.name}`}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.22em]">See more</span>
        <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition-colors group-hover:border-white/30 group-hover:bg-white/[0.08]">
          {next.name}
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </span>
      </button>
    </div>
  );
}
