'use client';

/**
 * Instantly navigates to the Partner sponsorship section (#partner):
 * - Signals all in-between animated sections (SafeGold, Quicko, etc.) to skip directly to their end states
 * - Signals SponsorshipSection to render completely revealed immediately without delays
 * - Instantly scrolls and centers #partner in the viewport
 */
export function jumpToPartner() {
  if (typeof window === 'undefined') return;

  // Signal all sections to skip animations and immediately reveal partner section
  window.dispatchEvent(new CustomEvent('reveal-partner'));

  // Immediately hide site navbar
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  if (nav) {
    nav.style.opacity = '0';
    nav.style.visibility = 'hidden';
  }

  // Ensure solid black background
  const bgFade = document.querySelector<HTMLElement>('[data-bg-fade]');
  if (bgFade) {
    bgFade.style.opacity = '1';
  }

  // Update URL hash cleanly
  try {
    history.pushState(null, '', '#partner');
  } catch {}

  const el = document.getElementById('partner');
  if (el) {
    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    el.scrollIntoView({ behavior: 'instant', block: 'center' });

    html.style.scrollBehavior = prevScrollBehavior;

    // After GSAP updates scroll states, keep it centered
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, 50);
    });
  }
}
