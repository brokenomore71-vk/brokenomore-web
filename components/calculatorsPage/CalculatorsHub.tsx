'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { CalcArt } from './calcArt';
import { CALCULATORS, inr, type CalcKey, type Field, type Result } from '@/lib/calculators';

// Financial Calculators: a grid of cards, one per calculator, each with a small illustration in
// its corner. Opening one shows its inputs on the left and the result on the right, as a donut
// and a summary. The open calculator is kept in the URL's hash (#sip), so Back returns to the grid.

const A = '#6E5BFF'; // invested / principal
const B = '#1A9BBD'; // returns / interest (checked against A for colour-blind separation)

const DESCRIPTIONS: Record<CalcKey, string> = {
  emi: 'Calculate your monthly EMI and the total interest on a home, car or personal loan',
  sip: 'Calculate how much you will accumulate with a monthly SIP',
  lumpsum: 'Calculate returns on a one-time investment over time',
  swp: 'Calculate your final amount with a Systematic Withdrawal Plan (SWP)',
  fd: 'Check returns on your fixed deposits (FDs), compounded quarterly',
  ppf: 'Calculate your returns on Public Provident Fund (PPF)',
};

// What each calculator does and how, shown under it
const ABOUT: Record<CalcKey, { what: string; formula: string[] }> = {
  emi: {
    what: 'An EMI is the fixed amount you pay your lender every month until the loan is repaid. Early EMIs are mostly interest; later ones are mostly principal.',
    formula: ['EMI = P × r × (1 + r)ⁿ / ((1 + r)ⁿ − 1)', 'P = loan amount, r = yearly rate ÷ 12 ÷ 100, n = months'],
  },
  sip: {
    what: 'A SIP invests a fixed amount every month. Each instalment compounds for as long as it stays invested, so time matters as much as the amount.',
    formula: ['FV = M × ((1 + r)ⁿ − 1) / r × (1 + r)', 'M = monthly amount, r = effective monthly rate, n = months'],
  },
  lumpsum: {
    what: 'A lumpsum is a single investment made once. It grows with compounding every year for the whole period.',
    formula: ['FV = P × (1 + R/100)ʸ', 'P = amount invested, R = yearly return, Y = years'],
  },
  swp: {
    what: 'An SWP withdraws a fixed amount every month from an invested corpus, while what’s left keeps earning.',
    formula: ['Each month: balance grows by the monthly rate, then the withdrawal is taken out', 'Monthly rate = (1 + R/100)^(1/12) − 1'],
  },
  fd: {
    what: 'A fixed deposit locks in an amount at a fixed rate. Most banks compound FD interest every quarter.',
    formula: ['FV = P × (1 + R/400)^(4 × Y)', 'P = deposit, R = yearly rate, Y = years'],
  },
  ppf: {
    what: 'PPF is a government-backed savings scheme with a 15-year lock-in. Deposits of up to ₹1.5 lakh a year earn tax-free interest, compounded yearly.',
    formula: ['Each year: balance = (balance + deposit) × (1 + R/100)', 'Deposit at the start of each year'],
  },
};

// ---------------------------------------------------------------------------------------------
// One input: its value in a box on the right, a slider below

const fmt = (f: Field, v: number) => (f.unit === 'inr' ? Math.round(v).toLocaleString('en-IN') : f.unit === 'pct' ? String(+v.toFixed(2)) : String(Math.round(v)));
const toT = (f: Field, v: number) => (f.log ? Math.log(v / f.min) / Math.log(f.max / f.min) : (v - f.min) / (f.max - f.min));
const fromT = (f: Field, t: number) => {
  const raw = f.log ? f.min * Math.pow(f.max / f.min, t) : f.min + t * (f.max - f.min);
  const tidy = f.log ? Math.max(f.step, Math.pow(10, Math.floor(Math.log10(raw)) - 1) * (raw >= 1e5 ? 5 : 1)) : f.step;
  return Math.min(f.max, Math.max(f.min, Math.round(raw / tidy) * tidy));
};
const clampTo = (f: Field, v: number) => Math.min(f.max, Math.max(f.min, v));

function FieldInput({ f, value, onChange }: { f: Field; value: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const id = `ch-${f.key}`;
  const t = toT(f, clampTo(f, value));
  const typed = draft === null ? NaN : parseFloat(draft.replace(/[^0-9.]/g, ''));
  const off = !Number.isNaN(typed) && (typed > f.max || typed < f.min);
  const unitText = (n: number) => (f.unit === 'pct' ? '%' : f.unit === 'yrs' ? (n === 1 ? 'yr' : 'yrs') : '');
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[15px] text-white/75">
          {f.label}
        </label>
        <div className={`flex h-9 items-center rounded-md px-2.5 transition-colors focus-within:ring-1 focus-within:ring-[#6E5BFF] ${off ? 'bg-[#F5A524]/15' : 'bg-[#6E5BFF]/15'}`}>
          {f.unit === 'inr' && <span className="mr-0.5 text-[15px] font-semibold text-[#A99DFF]">₹</span>}
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            size={1}
            className="bg-transparent text-right text-[15px] font-semibold tabular-nums text-[#C9C1FF] outline-none"
            style={{ width: f.unit === 'inr' ? 92 : 40 }}
            value={draft ?? fmt(f, value)}
            onFocus={(e) => {
              setDraft(fmt(f, value));
              e.currentTarget.select();
            }}
            onBlur={() => setDraft(null)}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
              if (!Number.isNaN(n)) onChange(clampTo(f, n));
            }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          {unitText(value) && <span className="ml-1 text-[14px] font-semibold text-[#A99DFF]">{unitText(value)}</span>}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={1000}
        aria-label={`${f.label} slider`}
        className="ch-range mt-4 w-full"
        style={{ ['--fill' as string]: `${(t * 100).toFixed(2)}%` }}
        value={Math.round(t * 1000)}
        onChange={(e) => {
          setDraft(null);
          onChange(fromT(f, +e.target.value / 1000));
        }}
      />
      {off && <p className="mt-1 text-[12px] text-[#F5A524]">{typed > f.max ? `Maximum is ${f.unit === 'inr' ? inr(f.max) : f.max}` : `Minimum is ${f.unit === 'inr' ? inr(f.min) : f.min}`}</p>}
    </div>
  );
}

// A figure that counts to its new value
function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = inr(value);
      shown.current = value;
      return;
    }
    const p = { v: shown.current };
    const tw = gsap.to(p, {
      v: value,
      duration: 0.9,
      ease: 'power3.out',
      onUpdate: () => {
        shown.current = p.v;
        el.textContent = inr(p.v);
      },
    });
    return () => {
      tw.kill();
    };
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {inr(value)}
    </span>
  );
}

// Tilt towards the pointer: sets --rx / --ry (degrees) and --mx / --my (for the shine) on the element
function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width;
      const y = (e.clientY - b.top) / b.height;
      el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    };
    const leave = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [max]);
  return ref;
}

function CalcCard({ c, i }: { c: (typeof CALCULATORS)[number]; i: number }) {
  const ref = useTilt<HTMLAnchorElement>(7);
  return (
    <div data-card className="[perspective:1000px]">
      <a
        ref={ref}
        href={`#${c.key}`}
        className="group relative block h-[200px] rounded-2xl border border-white/[0.08] bg-[linear-gradient(160deg,#111017_0%,#0a0a0d_100%)] p-6 transition-[transform,border-color,box-shadow] duration-300 ease-out [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] hover:border-white/20 hover:shadow-[0_30px_60px_-30px_rgba(110,91,255,0.45)] sm:h-[216px]"
      >
        {/* A soft light that follows the pointer */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(320px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.06), transparent 60%)' }} />
        <span className="block [transform:translateZ(24px)]">
          <h2 className="text-[20px] font-semibold">{c.short}</h2>
          <p className="mt-3 max-w-[210px] text-[14px] leading-relaxed text-white/50">{DESCRIPTIONS[c.key]}</p>
        </span>
        {/* The illustration stands off the card, with its shadow on it */}
        <span className="pointer-events-none absolute bottom-3 right-3 h-[100px] w-[120px] transition-transform duration-500 ease-out [transform-style:preserve-3d] [transform:translateZ(46px)] group-hover:[transform:translateZ(64px)_scale(1.08)]">
          <span className="absolute inset-x-3 -bottom-1 h-4 rounded-[50%] bg-black/70 blur-md [transform:translateZ(-46px)]" />
          <span className="ch-float absolute inset-0" style={{ animationDelay: `${i * -0.8}s` }}>
            <CalcArt k={c.key} />
          </span>
        </span>
      </a>
    </div>
  );
}

// The donut, given depth: stacked rings make its thickness, and it leans back, following the pointer
function Donut3D({ r }: { r: Result }) {
  const ref = useTilt<HTMLDivElement>(10);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const R = 64;
  const C = 2 * Math.PI * R;
  const total = r.split.a.value + r.split.b.value;
  const fa = total > 0 ? r.split.a.value / total : 1;
  const gap = fa > 0.01 && fa < 0.99 ? 3 : 0;
  const la = drawn ? Math.max(0, fa * C - gap) : 0;
  const lb = drawn ? Math.max(0, (1 - fa) * C - gap) : 0;
  const ease = 'stroke-dasharray 1s cubic-bezier(.2,.8,.2,1), stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)';
  const layers = 12;
  return (
    <div ref={ref} className="relative h-[230px] w-[230px] [perspective:900px] sm:h-[260px] sm:w-[260px]" role="img" aria-label={`${r.split.a.label} ${Math.round(fa * 100)}%, ${r.split.b.label} ${Math.round((1 - fa) * 100)}%`}>
      <div className="absolute inset-x-6 bottom-2 h-10 rounded-[50%] bg-[#6E5BFF]/20 blur-2xl" />
      <div className="absolute inset-0 transition-transform duration-500 ease-out [transform-style:preserve-3d]" style={{ transform: 'rotateX(calc(38deg + var(--rx, 0deg))) rotateZ(calc(var(--ry, 0deg) * 1.5))' }}>
        {Array.from({ length: layers }, (_, i) => {
          const top = i === layers - 1;
          const dim = top ? 1 : 0.42 + (i / layers) * 0.25;
          return (
            <svg key={i} viewBox="0 0 160 160" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${i * 1.6}px) rotate(-90deg)`, filter: top ? undefined : `brightness(${dim})` }} aria-hidden="true">
              {top && <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="22" />}
              <circle cx="80" cy="80" r={R} fill="none" stroke={A} strokeWidth="22" style={{ strokeDasharray: `${la} ${C}`, strokeDashoffset: -gap / 2, transition: ease }} />
              <circle cx="80" cy="80" r={R} fill="none" stroke={B} strokeWidth="22" style={{ strokeDasharray: `${lb} ${C}`, strokeDashoffset: -(fa * C + gap / 2), transition: ease }} />
              {top && <circle cx="80" cy="80" r={R + 11} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />}
            </svg>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function CalculatorView({ k, onBack }: { k: CalcKey; onBack: () => void }) {
  const calc = CALCULATORS.find((c) => c.key === k)!;
  const [v, setV] = useState(() => Object.fromEntries(calc.fields.map((f) => [f.key, f.value])) as Record<string, number>);
  const r = useMemo(() => calc.run(v), [calc, v]);
  const about = ABOUT[k];
  const summary = calc.key === 'emi' ? [{ label: 'Monthly EMI', value: r.headline.value }, ...r.stats] : r.stats;
  const rootRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      gsap.fromTo(q('[data-in]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' });
      gsap.fromTo(q('[data-field]'), { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, delay: 0.2, clearProps: 'transform,opacity' });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="select-text">
      <nav data-in className="flex items-center gap-2 text-[13px] text-white/45" aria-label="Breadcrumb">
        <button type="button" onClick={onBack} className="transition hover:text-white">
          Calculators
        </button>
        <span aria-hidden="true">›</span>
        <span className="text-white/80">{calc.name}</span>
      </nav>
      <h1 data-in className="mt-3 text-[30px] font-semibold tracking-tight sm:text-[36px]">{calc.name}</h1>

      <div data-in className="mt-6 grid gap-10 rounded-[20px] border border-white/10 bg-[#0b0b0f] p-5 sm:p-8 lg:grid-cols-[1fr_340px] lg:gap-14">
        <div>
          <div className="space-y-8">
            {calc.fields.map((f) => (
              <div key={f.key} data-field>
                <FieldInput f={f} value={v[f.key]} onChange={(x) => setV((s) => ({ ...s, [f.key]: x }))} />
              </div>
            ))}
          </div>
          <dl className="mt-10 space-y-4 text-[15px]">
            {summary.map((s, i) => (
              <div key={s.label} className={`flex items-center justify-between gap-3 ${i === summary.length - 1 ? 'border-t border-white/10 pt-4' : ''}`}>
                <dt className="text-white/55">{s.label}</dt>
                <dd className={`tabular-nums ${i === summary.length - 1 ? 'text-[18px] font-semibold text-white' : 'font-medium text-white/90'}`}>
                  <Counter value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="mb-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-white/60">
            {[
              [A, r.split.a.label],
              [B, r.split.b.label],
            ].map(([c, l]) => (
              <span key={l} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
          <Donut3D r={r} />
          <p className="mt-6 text-center text-[13px] text-white/45">
            {r.split.b.label}: <span className="font-semibold text-white">{Math.round((r.split.b.value / Math.max(1, r.split.a.value + r.split.b.value)) * 100)}%</span> of the total
          </p>
        </div>
      </div>

      <section data-in className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-14">
        <div>
          <h2 className="text-[20px] font-semibold">What is the {calc.name}?</h2>
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-white/60">{about.what}</p>
          <h3 className="mt-6 text-[15px] font-semibold">How it’s worked out</h3>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="font-mono text-[14px] text-[#C9C1FF]">{about.formula[0]}</p>
            <p className="mt-2 text-[13px] text-white/50">{about.formula[1]}</p>
          </div>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-white/80">Other calculators</h2>
          <div className="mt-3 divide-y divide-white/[0.06] rounded-xl border border-white/10">
            {CALCULATORS.filter((c) => c.key !== k).map((c) => (
              <a key={c.key} href={`#${c.key}`} className="flex items-center justify-between px-4 py-3 text-[14px] text-white/70 transition hover:bg-white/[0.03] hover:text-white">
                {c.name}
                <span aria-hidden="true">›</span>
              </a>
            ))}
          </div>
        </div>
      </section>
      <p className="mt-10 text-[12px] leading-relaxed text-white/30">Estimates for planning, using the same formulas as the BrokeNoMore app. Returns aren’t guaranteed.</p>
    </div>
  );
}

export default function CalculatorsHub() {
  const [open, setOpen] = useState<CalcKey | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // The grid coming in: the heading, then the cards one by one, tipping up into place
  useLayoutEffect(() => {
    const root = gridRef.current;
    if (!root || open) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      gsap.fromTo(q('[data-head]'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' });
      gsap.fromTo(q('[data-card]'), { y: 40, opacity: 0, rotateX: -18, transformPerspective: 900, transformOrigin: '50% 100%' }, { y: 0, opacity: 1, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, delay: 0.15, clearProps: 'transform,opacity' });
    });
    return () => mm.revert();
  }, [open]);

  // The open calculator lives in the URL's hash, so Back and links work
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1) as CalcKey;
      setOpen(CALCULATORS.some((c) => c.key === h) ? h : null);
      window.scrollTo({ top: 0 });
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  return (
    <div className="relative bg-black text-[#F5F5F5]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_45%_55%_at_50%_0%,rgba(110,91,255,0.10),transparent_70%)]" />
      <div ref={gridRef} className="relative mx-auto max-w-[1120px] px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
        {open ? (
          <CalculatorView key={open} k={open} onBack={() => history.back()} />
        ) : (
          <>
            <h1 data-head className="text-[30px] font-semibold tracking-tight sm:text-[36px]">Calculators</h1>
            <p data-head className="mt-2 text-[15px] text-white/45">Plan with your own numbers, using the same formulas as the app.</p>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {CALCULATORS.map((c, i) => (
                <CalcCard key={c.key} c={c} i={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

