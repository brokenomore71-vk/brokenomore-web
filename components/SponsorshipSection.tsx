'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';

// Partner with Us. The pitch sits on the left: a headline, three ways to partner, and the email.
// On the right the partnership is drawn up as a receipt, in keeping with the bills and statements
// elsewhere on the site: it prints out top to bottom as the section arrives, its lines fill in one
// by one, and a "Let's talk" stamp lands on it last. Its "× Your brand" line keeps cycling through
// the kinds of partner we work with. Flat and dark like the Quicko section, with deep purple accents.

const PURPLE_TEXT = '#A890E6'; // the brand's deep purple (#6B46C1), lifted so it reads on black
const EMAIL = 'admin@brokenomore.in';
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Partnering with BrokeNoMore')}`;
const EASE = [0.16, 1, 0.3, 1] as const;

const PARTNER_KINDS = ['Your brand', 'Your channel', 'Your college fest', 'Your community', 'Your startup'];

const WAYS = [
  { n: '01', title: 'Brand sponsorships', body: 'Featured placements inside the app and across our socials.' },
  { n: '02', title: 'Creator collabs', body: 'Get sponsored to make money content that actually helps people.' },
  { n: '03', title: 'Community programs', body: 'Workshops, college fests and meetups, backed by BrokeNoMore.' },
];

const LINES = [
  { label: 'Audience', value: 'Money-smart India' },
  { label: 'Placements', value: 'In-app · Socials · Events' },
  { label: 'Format', value: 'Sponsorship / Affiliate' },
  { label: 'Partner support', value: 'Dedicated team' },
];

const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE, delay } }),
};

export default function SponsorshipSection() {
  const reduce = useReducedMotion();
  const [kind, setKind] = useState(0);
  const [copied, setCopied] = useState(false);

  // "× Your brand" cycles through the kinds of partner
  useEffect(() => {
    const id = setInterval(() => setKind((k) => (k + 1) % PARTNER_KINDS.length), 2400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      window.location.href = MAILTO;
    }
  };

  return (
    <section id="partner" aria-labelledby="partner-heading" className="relative w-full overflow-hidden bg-black px-4 sm:px-6 py-24 sm:py-32">
      {/* A faint grid, like ruled paper, fading out towards the edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1c1c1c 1px, transparent 1px), linear-gradient(to bottom, #1c1c1c 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)',
        }}
      />

      <motion.div
        initial={reduce ? false : 'hidden'}
        whileInView="shown"
        viewport={{ once: true, amount: 0.15 }}
        className="relative mx-auto grid max-w-6xl items-center gap-y-10 lg:gap-y-0 lg:gap-x-20 lg:grid-cols-[1.1fr_1fr] lg:grid-rows-[auto_auto] lg:content-center"
      >
        {/* ---- The pitch: headline and copy (first on phones, top left on desktop) ---- */}
        <div className="order-1 lg:order-none text-center lg:text-left lg:self-end">
          <motion.h2
            id="partner-heading"
            variants={rise}
            custom={0.08}
            className="text-[2.2rem] sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.05] tracking-tight text-white"
          >
            Put your brand where India <span style={{ color: PURPLE_TEXT }}>manages its money.</span>
          </motion.h2>

          <motion.p variants={rise} custom={0.16} className="mx-auto lg:mx-0 mt-4 sm:mt-5 max-w-md sm:max-w-xl text-[15px] sm:text-lg leading-relaxed tracking-tight text-neutral-400">
            Collaborate with BrokeNoMore to reach India&apos;s most connected audience focused on smart money
            management, whether you&apos;re a brand, a creator or a community.
          </motion.p>
        </div>

        {/* ---- The pitch: ways to partner and the ask (after the receipt on phones, bottom left on desktop) ---- */}
        <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2 lg:self-start">
          {/* Three ways to partner */}
          <ul className="lg:mt-10 border-t border-[#1F1F1F]">
            {WAYS.map((way, i) => (
              <motion.li
                key={way.n}
                variants={rise}
                custom={0.24 + i * 0.08}
                className="group flex gap-4 sm:gap-5 border-b border-[#1F1F1F] py-3.5 sm:py-5"
              >
                <span className="pt-0.5 font-mono text-xs text-neutral-600 transition-colors group-hover:text-[#A890E6]">{way.n}</span>
                <div>
                  <h3 className="text-[15px] sm:text-base font-semibold tracking-tight text-white">{way.title}</h3>
                  <p className="mt-0.5 text-[13px] sm:text-sm tracking-tight text-neutral-500">{way.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* The ask */}
          <motion.div variants={rise} custom={0.5} className="mt-8 sm:mt-10 flex gap-2.5 sm:gap-3">
            <a
              href={MAILTO}
              className="group inline-flex items-center justify-center gap-2 flex-1 sm:flex-none rounded-full bg-white px-5 sm:px-6 py-3 text-sm font-medium whitespace-nowrap text-black transition-[background-color,transform] hover:bg-neutral-200 active:scale-[0.98]"
            >
              Become a partner
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current transition-transform group-hover:translate-x-0.5">
                <path d="M11.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4l3.3-3.3H3a1 1 0 1 1 0-2h11.6l-3.3-3.3a1 1 0 0 1 0-1.4Z" />
              </svg>
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full border border-[#2A2A2A] bg-[#111] px-4 sm:px-5 py-3 text-sm tracking-tight text-neutral-300 transition-colors hover:border-[#3a3a3a] hover:text-white"
              aria-live="polite"
            >
              <span className="hidden sm:inline font-mono text-[13px]">{EMAIL}</span>
              <span className="text-xs font-medium" style={{ color: copied ? '#4ADE80' : PURPLE_TEXT }}>
                {copied ? 'Copied' : <><span className="sm:hidden">Copy email</span><span className="hidden sm:inline">Copy</span></>}
              </span>
            </button>
          </motion.div>
        </div>

        {/* ---- The receipt ---- */}
        <motion.div variants={rise} custom={0.2} className="order-2 lg:order-none relative mx-auto w-[calc(100%-16px)] max-w-[360px] sm:max-w-[420px] lg:col-start-2 lg:row-start-1 lg:row-span-2">
          {/* The slot it prints out of */}
          <div aria-hidden="true" className="relative z-10 mx-[-10px] h-3 rounded-full border border-[#2A2A2A] bg-[#0d0d0d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]" />

          <motion.div
            className="relative -mt-1.5"
            variants={{
              hidden: { clipPath: 'inset(0 0 100% 0)' },
              shown: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 1.6, ease: [0.65, 0, 0.35, 1], delay: 0.35 } },
            }}
          >
            <div className="rounded-b-sm bg-[#111] border-x border-[#232323] px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 font-mono">
              <div className="flex items-start justify-between gap-4 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                <span>Partnership proposal</span>
                <span>No. 0001</span>
              </div>

              {/* BrokeNoMore × (whoever's next) */}
              <div className="mt-5 sm:mt-6 font-sans">
                <div className="text-2xl sm:text-[1.7rem] font-semibold tracking-tight text-white">BrokeNoMore</div>
                <div className="flex items-center gap-2 overflow-hidden text-2xl sm:text-[1.7rem] font-semibold leading-[1.35] tracking-tight">
                  <span className="text-neutral-600">×</span>
                  <span className="grid">
                    <AnimatePresence initial={false}>
                      <motion.span
                        key={kind}
                        className="[grid-area:1/1] whitespace-nowrap"
                        initial={reduce ? false : { y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={reduce ? undefined : { y: -14, opacity: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        style={{ color: PURPLE_TEXT }}
                      >
                        {PARTNER_KINDS[kind]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>
              </div>

              <div className="my-5 sm:my-6 border-t border-dashed border-[#2E2E2E]" />

              <dl className="space-y-3 sm:space-y-3.5 text-[12px] sm:text-[13px]">
                {LINES.map((line, i) => (
                  <motion.div
                    key={line.label}
                    className="flex items-baseline gap-3"
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      shown: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE, delay: 1.1 + i * 0.14 } },
                    }}
                  >
                    <dt className="shrink-0 text-neutral-500">{line.label}</dt>
                    <span aria-hidden="true" className="flex-1 translate-y-[-3px] border-b border-dotted border-[#333]" />
                    <dd className="text-right text-neutral-200">{line.value}</dd>
                  </motion.div>
                ))}
              </dl>

              <div className="my-5 sm:my-6 border-t border-dashed border-[#2E2E2E]" />

              <motion.div
                className="flex items-baseline justify-between gap-4"
                variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.6, delay: 1.75 } } }}
              >
                <span className="text-xs uppercase tracking-[0.14em] text-neutral-500">Total</span>
                <span className="font-sans text-lg sm:text-xl font-semibold tracking-tight text-white">Something awesome</span>
              </motion.div>

              <div className="mt-6 sm:mt-7 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  {/* A barcode, for the look of it */}
                  <div aria-hidden="true" className="flex h-10 items-stretch gap-[3px] overflow-hidden opacity-70">
                    {[2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1].map((w, i) => (
                      <span key={i} className="shrink-0 bg-neutral-400" style={{ width: w }} />
                    ))}
                  </div>
                  <div className="mt-2 truncate text-[10px] tracking-[0.2em] text-neutral-600">{EMAIL.toUpperCase()}</div>
                </div>

                {/* The stamp lands last */}
                <motion.a
                  href={MAILTO}
                  aria-label={`Let's talk: email ${EMAIL}`}
                  className="relative shrink-0 flex h-[5.5rem] w-[5.5rem] sm:h-24 sm:w-24 flex-col items-center justify-center rounded-full border-2 text-center font-sans uppercase transition-transform hover:scale-105"
                  style={{ borderColor: '#F5F5F5', color: '#F5F5F5' }}
                  variants={{
                    hidden: { opacity: 0, scale: 1.8, rotate: -24 },
                    shown: { opacity: 1, scale: 1, rotate: -12, transition: { type: 'spring', stiffness: 420, damping: 18, delay: 2.15 } },
                  }}
                >
                  <span className="absolute inset-1.5 rounded-full border border-dashed" style={{ borderColor: 'rgba(245,245,245,0.6)' }} />
                  <span className="text-[9px] tracking-[0.2em] opacity-80">Approved</span>
                  <span className="text-sm sm:text-base font-bold leading-tight tracking-tight">Let&apos;s talk</span>
                  <span className="text-[9px] tracking-[0.2em] opacity-80">Email us</span>
                </motion.a>
              </div>
            </div>

            {/* Torn-off edge */}
            <svg aria-hidden="true" className="block h-3 w-full" preserveAspectRatio="none" viewBox="0 0 100 6">
              <path d="M0 0 H100 V0 L97.5 6 L95 0 L92.5 6 L90 0 L87.5 6 L85 0 L82.5 6 L80 0 L77.5 6 L75 0 L72.5 6 L70 0 L67.5 6 L65 0 L62.5 6 L60 0 L57.5 6 L55 0 L52.5 6 L50 0 L47.5 6 L45 0 L42.5 6 L40 0 L37.5 6 L35 0 L32.5 6 L30 0 L27.5 6 L25 0 L22.5 6 L20 0 L17.5 6 L15 0 L12.5 6 L10 0 L7.5 6 L5 0 L2.5 6 L0 0 Z" fill="#111" />
            </svg>

          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
