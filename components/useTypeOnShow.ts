'use client';

import React, { useEffect } from 'react';
import { typeText, type Typing } from './typewriter';

// Captions that a scroll timeline only fades in or out: each one types itself out whenever it
// comes up (its title, then the line under it), as long as its section is on screen. `selector`
// picks the caption groups inside `rootRef`; a group counts as showing when its inline visibility
// isn't hidden and its opacity is above zero (what GSAP's autoAlpha sets).
export function useTypeOnShow(rootRef: React.RefObject<HTMLElement | null>, selector: string, titleMs = 34) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const groups = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const section = root.closest('section') ?? root;
    let onScreen = false;
    const shown = new Map<HTMLElement, boolean>();
    const typing = new Map<HTMLElement, Typing[]>();
    const visible = (g: HTMLElement) => g.style.visibility !== 'hidden' && parseFloat(g.style.opacity || '1') > 0.02;

    const check = () =>
      groups.forEach((g) => {
        const now = onScreen && visible(g);
        if (now === (shown.get(g) ?? false)) return;
        shown.set(g, now);
        typing.get(g)?.forEach((t) => t.cancel());
        typing.delete(g);
        if (!now) return;
        const title = g.querySelector<HTMLElement>('h1, h2, h3');
        const body = g.querySelector<HTMLElement>('p');
        const list: Typing[] = [];
        if (title) list.push(typeText(title, { msPerChar: titleMs }));
        const titleTime = (title?.textContent?.length ?? 0) * titleMs;
        if (body) list.push(typeText(body, { msPerChar: 14, delay: titleTime + 150 }));
        typing.set(g, list);
      });

    const mo = new MutationObserver(check);
    groups.forEach((g) => mo.observe(g, { attributes: true, attributeFilter: ['style'] }));
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      check();
    });
    io.observe(section);
    check();
    return () => {
      mo.disconnect();
      io.disconnect();
      typing.forEach((list) => list.forEach((t) => t.cancel()));
    };
  }, [rootRef, selector, titleMs]);
}
