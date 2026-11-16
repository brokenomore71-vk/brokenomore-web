'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { CALCULATORS, compact, inr, inWords, type CalcKey, type Calculator, type Field, type Result } from '@/lib/calculators';
import { usePointerVars } from '../scrollSteps';
import { Gradient } from '../IntroHero';

// Financial Calculators: a 3D deck of the app's six calculators, and below it a working bench
// where you key in your own amounts and see the result, how it splits, and how it builds up year
// by year. Same formulas as the app.

// The two series: what you put in (or borrowed) and what it earns (or costs). Checked for
// colour-blind separation on this dark surface.
const A = '#6E5BFF';
const B = '#D9549F';

function Icon({ k, className = '' }: { k: CalcKey; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {k === 'emi' && <path {...p} d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5" />}
      {k === 'sip' && <path {...p} d="M3 19h4v-4h4v-4h4V7h6M17 3h4v4" />}
      {k === 'lumpsum' && <path {...p} d="M12 3 20 9l-8 12L4 9l8-6ZM4 9h16M9 9l3 12 3-12" />}
      {k === 'swp' && <path {...p} d="M5 4h14M8 4v4a4 4 0 0 0 8 0V4M12 13c-1.6 2.2-2.5 3.6-2.5 4.7a2.5 2.5 0 0 0 5 0c0-1.1-.9-2.5-2.5-4.7Z" />}
      {k === 'fd' && <path {...p} d="M4 5h16v14H4zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12 9v-.5M12 15.5V15M4 9H2.5M4 15H2.5" />}
      {k === 'ppf' && <path {...p} d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3ZM8.5 12l2.5 2.5 4.5-5" />}
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// The hero: the six calculators as glass blocks on a tilted plane

function Deck({ active, onPick }: { active: CalcKey; onPick: (k: CalcKey) => void }) {
  return (
    <div className="relative mx-auto aspect-square w-[min(84vw,560px)] [perspective:1400px]">
      <div
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{ transform: 'rotateX(calc(56deg + var(--py, 0) * -5deg)) rotateZ(calc(-38deg + var(--px, 0) * 6deg))' }}
      >
        {/* The plane: a faint grid with a glow under the deck */}
        <div className="absolute inset-[6%] rounded-[36px] border border-white/[0.06] bg-[radial-gradient(circle_at_50%_50%,rgba(110,91,255,0.22),transparent_65%)]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(110,91,255,0.25), transparent 65%)', backgroundSize: '28px 28px, 28px 28px, 100% 100%' }} />
        <div className="absolute inset-[14%] grid grid-cols-3 grid-rows-2 gap-[5%] [transform-style:preserve-3d]">
          {CALCULATORS.map((c, i) => {
            const on = c.key === active;
            return (
              <div key={c.key} data-tile className="relative [transform-style:preserve-3d]">
                <button
                  type="button"
                  onClick={() => onPick(c.key)}
                  aria-label={`Open the ${c.name}`}
                  className="cal-float group absolute inset-0 cursor-pointer [transform-style:preserve-3d] focus-visible:outline-none"
                  style={{ animationDelay: `${i * -0.7}s` }}
                >
                  <span className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-500 ease-out group-hover:[transform:translateZ(22px)] group-focus-visible:[transform:translateZ(22px)]" style={on ? { transform: 'translateZ(30px)' } : undefined}>
                    {/* Shadow on the plane */}
                    <span className="absolute inset-[8%] rounded-[18px] bg-black/70 blur-md transition-opacity duration-500" style={{ transform: 'translateZ(-30px)', opacity: on ? 0.9 : 0.6 }} />
                    {/* The block's sides, as stacked layers */}
                    {[-16, -12, -8, -4].map((z) => (
                      <span key={z} className="absolute inset-0 rounded-[18px] border border-white/[0.07]" style={{ transform: `translateZ(${z}px)`, background: on ? '#1d1640' : '#121119' }} />
                    ))}
                    {/* Its glass top */}
                    <span
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[18px] border transition-colors duration-500"
                      style={{
                        borderColor: on ? 'rgba(169,157,255,0.7)' : 'rgba(255,255,255,0.12)',
                        background: on ? 'linear-gradient(140deg,#6E5BFF 0%,#8B5CF6 55%,#D9549F 120%)' : 'linear-gradient(140deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02))',
                        boxShadow: on ? '0 0 50px rgba(110,91,255,0.55), inset 0 1px 0 rgba(255,255,255,0.35)' : 'inset 0 1px 0 rgba(255,255,255,0.12)',
                      }}
                    >
                      <span className="cal-sheen pointer-events-none absolute inset-0" />
                      <Icon k={c.key} className={`h-[30%] w-[30%] ${on ? 'text-white' : 'text-[#A99DFF]'}`} />
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] sm:text-[13px] ${on ? 'text-white' : 'text-white/70'}`}>{c.short}</span>
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// One input: the amount typed in, or dragged along a slider

const fmt = (f: Field, v: number) => (f.unit === 'inr' ? Math.round(v).toLocaleString('en-IN') : f.unit === 'pct' ? String(+v.toFixed(2)) : String(Math.round(v)));
const toSlider = (f: Field, v: number) => (f.log ? Math.log(v / f.min) / Math.log(f.max / f.min) : (v - f.min) / (f.max - f.min));
const fromSlider = (f: Field, t: number) => {
  const raw = f.log ? f.min * Math.pow(f.max / f.min, t) : f.min + t * (f.max - f.min);
  // Round to a tidy amount for where on the scale it is
  const tidy = f.log ? Math.max(f.step, Math.pow(10, Math.floor(Math.log10(raw)) - 1) * (raw >= 1e5 ? 5 : 1)) : f.step;
  return Math.min(f.max, Math.max(f.min, Math.round(raw / tidy) * tidy));
};
const clampTo = (f: Field, v: number) => Math.min(f.max, Math.max(f.min, v));

function FieldInput({ f, value, onChange }: { f: Field; value: number; onChange: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const id = `calc-${f.key}`;
  const t = toSlider(f, clampTo(f, value));
  const unitText = f.unit === 'pct' ? '%' : f.unit === 'yrs' ? (Math.round(value) === 1 ? 'yr' : 'yrs') : '';
  const out = draft === null ? null : parseFloat(draft.replace(/[^0-9.]/g, ''));
  const tooBig = out !== null && !Number.isNaN(out) && out > f.max;
  const tooSmall = out !== null && !Number.isNaN(out) && out < f.min;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-white/60">
          {f.label}
        </label>
        {f.unit === 'inr' && <span className="text-[12px] tabular-nums text-white/40">{inWords(value)}</span>}
      </div>
      <div className={`mt-2 flex items-center rounded-xl border bg-white/[0.03] px-3.5 transition-colors focus-within:border-[#8B5CF6] focus-within:bg-white/[0.05] ${tooBig || tooSmall ? 'border-[#F5A524]/60' : 'border-white/10'}`}>
        {f.unit === 'inr' && <span className="mr-1.5 text-[18px] font-semibold text-white/45">₹</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          className="h-12 w-full min-w-0 bg-transparent text-[20px] font-semibold tabular-nums text-white outline-none"
          value={draft ?? fmt(f, value)}
          onFocus={() => setDraft(fmt(f, value))}
          onChange={(e) => {
            const text = e.target.value;
            setDraft(text);
            const n = parseFloat(text.replace(/[^0-9.]/g, ''));
            if (!Number.isNaN(n)) onChange(clampTo(f, n));
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
        {unitText && <span className="ml-1.5 text-[15px] font-medium text-white/45">{unitText}</span>}
      </div>
      {(tooBig || tooSmall) && (
        <p className="mt-1.5 text-[12px] text-[#F5A524]">
          {tooBig ? `Up to ${f.unit === 'inr' ? inr(f.max) : `${f.max}${unitText ? ' ' + unitText : ''}`}, so we’ve used that.` : `At least ${f.unit === 'inr' ? inr(f.min) : `${f.min}${unitText ? ' ' + unitText : ''}`}, so we’ve used that.`}
        </p>
      )}
      <input
        type="range"
        min={0}
        max={1000}
        step={1}
        aria-label={`${f.label} slider`}
        className="cal-range mt-3 w-full"
        style={{ ['--fill' as string]: `${(t * 100).toFixed(2)}%` }}
        value={Math.round(t * 1000)}
        onChange={(e) => {
          setDraft(null);
          onChange(fromSlider(f, +e.target.value / 1000));
        }}
      />
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-white/30">
        <span>{f.unit === 'inr' ? compact(f.min) : `${f.min}${f.unit === 'pct' ? '%' : f.min === 1 ? ' yr' : ' yrs'}`}</span>
        <span>{f.unit === 'inr' ? compact(f.max) : `${f.max}${f.unit === 'pct' ? '%' : ' yrs'}`}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The result: a figure that counts to its new value, a ring for the split, a year-by-year chart

function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const p = { v: shown.current };
    const tw = gsap.to(p, {
      v: value,
      duration: 0.6,
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

function Ring({ r }: { r: Result }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const total = r.split.a.value + r.split.b.value;
  const fa = total > 0 ? r.split.a.value / total : 1;
  const gap = fa > 0.005 && fa < 0.995 ? 3 : 0;
  const la = Math.max(0, fa * C - gap);
  const lb = Math.max(0, (1 - fa) * C - gap);
  return (
    <div className="relative h-[170px] w-[170px] shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" role="img" aria-label={`${r.split.a.label} ${Math.round(fa * 100)}%, ${r.split.b.label} ${Math.round((1 - fa) * 100)}%`}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
        <circle cx="90" cy="90" r={R} fill="none" stroke={A} strokeWidth="18" style={{ strokeDasharray: `${la} ${C}`, strokeDashoffset: -gap / 2, transition: 'stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)' }} />
        <circle cx="90" cy="90" r={R} fill="none" stroke={B} strokeWidth="18" style={{ strokeDasharray: `${lb} ${C}`, strokeDashoffset: -(fa * C + gap / 2), transition: 'stroke-dasharray .6s cubic-bezier(.2,.8,.2,1), stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[26px] font-bold tabular-nums leading-none">{Math.round((1 - fa) * 100)}%</span>
        <span className="mt-1 max-w-[90px] text-[11px] leading-tight text-white/50">is {r.split.b.label.toLowerCase()}</span>
      </div>
    </div>
  );
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * p >= v)!;
  return m * p;
}

function Chart({ r }: { r: Result }) {
  const [hover, setHover] = useState<{ i: number; x: number; right: boolean } | null>(null);
  const rows = r.rows;
  const single = !!r.chart.single;
  const [seen, setSeen] = useState(rows.length);
  if (seen !== rows.length) {
    setSeen(rows.length);
    setHover(null);
  }
  const top = niceMax(Math.max(...rows.map((x) => (single ? x.a : x.a + x.b))));
  const every = Math.ceil(rows.length / 10);
  const h = hover === null || !rows[hover.i] ? null : rows[hover.i];
  const enter = (i: number, el: HTMLElement) => {
    const box = el.parentElement!;
    setHover({ i, x: el.offsetLeft + el.offsetWidth / 2, right: el.offsetLeft + el.offsetWidth / 2 > box.clientWidth * 0.55 });
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-white/75">{r.chart.caption}</p>
        {!single && (
          <div className="flex items-center gap-4 text-[12px] text-white/60">
            {[
              [A, r.chart.a],
              [B, r.chart.b!],
            ].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="relative mt-4 h-[220px] pl-12 sm:h-[260px]">
        {/* Gridlines */}
        {[0, 0.5, 1].map((g) => (
          <div key={g} className="pointer-events-none absolute left-12 right-0 border-t border-white/[0.07]" style={{ bottom: `${g * 100}%` }}>
            <span className="absolute -left-12 -translate-y-1/2 text-[11px] tabular-nums text-white/35">{compact(top * g)}</span>
          </div>
        ))}
        <div className="absolute inset-y-0 left-12 right-0 flex items-end justify-around gap-[3px] sm:gap-1" onPointerLeave={() => setHover(null)}>
          {rows.map((x, i) => {
            const ha = (x.a / top) * 100;
            const hb = single ? 0 : (x.b / top) * 100;
            const dim = hover !== null && hover.i !== i;
            return (
              <div key={x.year} className="relative flex h-full max-w-[52px] flex-1 cursor-default flex-col justify-end" onPointerEnter={(e) => enter(i, e.currentTarget)} onPointerDown={(e) => enter(i, e.currentTarget)}>
                <div className="flex flex-col justify-end gap-[2px] transition-opacity duration-200" style={{ opacity: dim ? 0.4 : 1, height: '100%' }}>
                  {!single && <div className="w-full rounded-t-[4px] transition-[height] duration-500 ease-out" style={{ height: `${hb}%`, background: B, minHeight: x.b > 0 ? 2 : 0 }} />}
                  <div className={`w-full transition-[height] duration-500 ease-out ${single || hb < 0.5 ? 'rounded-t-[4px]' : ''}`} style={{ height: `${ha}%`, background: A, minHeight: x.a > 0 ? 2 : 0 }} />
                </div>
                <span className="absolute inset-x-0 top-full mt-2 text-center text-[10px] tabular-nums text-white/35">{i % every === every - 1 || i === 0 ? x.year : ''}</span>
              </div>
            );
          })}
        </div>
        {/* The hovered year */}
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-[190px] rounded-xl border border-white/10 bg-[#15141c]/95 p-3 text-[12px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur"
            style={{ left: `calc(3rem + ${hover.x}px)`, transform: `translateX(${hover.right ? 'calc(-100% - 14px)' : '14px'})` }}
          >
            <p className="font-semibold text-white">Year {h.year}</p>
            <div className="mt-1.5 space-y-1 text-white/70">
              <p className="flex justify-between gap-2">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: A }} />{r.chart.a}</span>
                <span className="tabular-nums text-white">{inr(h.a)}</span>
              </p>
              {!single && (
                <p className="flex justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: B }} />{r.chart.b}</span>
                  <span className="tabular-nums text-white">{inr(h.b)}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="mt-8 pl-12 text-center text-[11px] text-white/30">Year</p>
    </div>
  );
}

function Table({ c, r }: { c: Calculator; r: Result }) {
  const cols: { label: string; get: (x: Result['rows'][number]) => number }[] =
    c.key === 'emi'
      ? [
          { label: 'Principal paid', get: (x) => x.a },
          { label: 'Interest paid', get: (x) => x.b },
          { label: 'Balance left', get: (x) => x.total },
        ]
      : c.key === 'swp'
        ? [
            { label: 'Withdrawn so far', get: (x) => x.b },
            { label: 'Corpus left', get: (x) => x.a },
          ]
        : [
            { label: r.chart.a, get: (x) => x.a },
            { label: r.chart.b!, get: (x) => x.b },
            { label: 'Value', get: (x) => x.total },
          ];
  return (
    <div className="max-h-[320px] overflow-auto rounded-xl border border-white/10">
      <table className="w-full text-[13px] tabular-nums">
        <thead className="sticky top-0 bg-[#15141c] text-left text-[11px] uppercase tracking-[0.1em] text-white/45">
          <tr>
            <th className="px-3 py-2.5 font-semibold">Year</th>
            {cols.map((col) => (
              <th key={col.label} className="px-3 py-2.5 text-right font-semibold">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.rows.map((x) => (
            <tr key={x.year} className="border-t border-white/[0.06] text-white/80">
              <td className="px-3 py-2">{x.year}</td>
              {cols.map((col) => (
                <td key={col.label} className="px-3 py-2 text-right">{inr(col.get(x))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

export default function CalculatorsSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const benchRef = useRef<HTMLElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<CalcKey>('emi');
  const [values, setValues] = useState(() => Object.fromEntries(CALCULATORS.map((c) => [c.key, Object.fromEntries(c.fields.map((f) => [f.key, f.value]))])) as Record<CalcKey, Record<string, number>>);
  const [showTable, setShowTable] = useState(false);
  // Phones: a bar with the result, while the inputs are on screen and the result isn't
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const bench = benchRef.current;
    const res = resultRef.current?.querySelector('[data-headline]');
    if (!bench || !res) return;
    let benchIn = false;
    let resIn = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === bench) benchIn = e.isIntersecting;
        else resIn = e.isIntersecting;
      });
      setShowBar(benchIn && !resIn);
    });
    io.observe(bench);
    io.observe(res);
    return () => io.disconnect();
  }, []);
  const calc = CALCULATORS.find((c) => c.key === active)!;
  const result = useMemo(() => calc.run(values[active]), [calc, values, active]);

  usePointerVars(heroRef);

  // The deck builds itself, block by block, and the headline rises in
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(hero);
      gsap.from(q('[data-tile]'), { z: 260, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: { each: 0.09, from: 'random' }, delay: 0.15 });
      gsap.from(q('[data-rise]'), { y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09, delay: 0.35 });
    });
    return () => mm.revert();
  }, []);

  // Switching calculator: the result panel slides in fresh
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!resultRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(resultRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
  }, [active]);

  const pick = (k: CalcKey, scroll: boolean) => {
    setActive(k);
    if (scroll && benchRef.current) {
      const y = benchRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  const set = (key: string, v: number) => setValues((all) => ({ ...all, [active]: { ...all[active], [key]: v } }));
  const reset = () => setValues((all) => ({ ...all, [active]: Object.fromEntries(calc.fields.map((f) => [f.key, f.value])) }));

  return (
    <div className="bg-black text-[#F5F5F5]">
      {/* The hero */}
      <section ref={heroRef} aria-label="Financial Calculators" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_50%_at_70%_50%,rgba(110,91,255,0.16),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_85%_80%,rgba(217,84,159,0.10),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-4 px-4 pb-6 pt-10 sm:px-8 md:min-h-[calc(100svh-72px)] md:grid-cols-[1fr_1.05fr] md:pt-0">
          <div className="relative z-10">
            <p data-rise className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#A99DFF]">Financial Calculators</p>
            <h1 data-rise className="mt-4 text-[40px] font-bold leading-[1.02] tracking-tight sm:text-[56px] lg:text-[68px]">
              Run the numbers.
              <br />
              <Gradient>Your numbers.</Gradient>
            </h1>
            <p data-rise className="mt-5 max-w-[440px] text-[16px] leading-relaxed text-white/60 sm:text-[17px]">
              Six calculators from the app: EMI, SIP, Lumpsum, SWP, FD and PPF. Key in your own amounts and see what they come to, year by year.
            </p>
            <div data-rise className="mt-7 flex flex-wrap gap-2">
              {CALCULATORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => pick(c.key, true)}
                  className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-white/80 transition hover:border-[#8B5CF6]/60 hover:bg-[#6E5BFF]/15 hover:text-white"
                >
                  <Icon k={c.key} className="h-4 w-4 text-[#A99DFF]" />
                  {c.short}
                </button>
              ))}
            </div>
          </div>
          <Deck active={active} onPick={(k) => pick(k, true)} />
        </div>
      </section>

      {/* The bench */}
      <section ref={benchRef} aria-label="Calculator" className="relative mx-auto max-w-[1280px] select-text px-4 pb-10 pt-4 sm:px-8">
        <div role="tablist" aria-label="Calculators" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {CALCULATORS.map((c) => {
            const on = c.key === active;
            return (
              <button
                key={c.key}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => pick(c.key, false)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold transition ${on ? 'bg-[linear-gradient(120deg,#6E5BFF,#8B5CF6_60%,#D9549F)] text-white shadow-[0_10px_30px_-10px_rgba(110,91,255,0.8)]' : 'border border-white/10 bg-white/[0.03] text-white/65 hover:text-white'}`}
              >
                <Icon k={c.key} className="h-4 w-4" />
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[400px_1fr]">
          {/* Inputs */}
          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight">{calc.name}</h2>
                <p className="mt-1 text-[14px] leading-snug text-white/55">{calc.blurb}</p>
              </div>
              <button type="button" onClick={reset} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/60 transition hover:text-white">
                Reset
              </button>
            </div>
            <div className="mt-6 space-y-6">
              {calc.fields.map((f) => (
                <FieldInput key={`${active}-${f.key}`} f={f} value={values[active][f.key]} onChange={(v) => set(f.key, v)} />
              ))}
            </div>
          </div>

          {/* Results */}
          <div ref={resultRef} className="rounded-[24px] border border-white/10 bg-[#0c0b12] p-5 sm:p-6" aria-live="polite">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white/55">{result.headline.label}</p>
                <p data-headline className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <Counter value={result.headline.value} className="text-[40px] font-bold leading-none tracking-tight tabular-nums sm:text-[52px]" />
                  {result.headline.suffix && <span className="text-[18px] font-medium text-white/45">{result.headline.suffix}</span>}
                </p>
                <p className="mt-2 text-[13px] text-white/40">{inWords(result.headline.value)} rupees</p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {result.stats.map((s, i) => (
                    <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] text-white/50">
                        {i < 2 && <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: calc.key === 'swp' ? (i === 0 ? 'transparent' : B) : i === 0 ? A : B }} />}
                        <span className="truncate">{s.label}</span>
                      </p>
                      <p className="mt-1 truncate text-[14px] font-semibold tabular-nums sm:text-[16px]">{compact(s.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 self-center sm:flex-col sm:gap-3">
                <Ring r={result} />
                <div className="space-y-1.5 text-[12px] text-white/65">
                  {[
                    [A, result.split.a],
                    [B, result.split.b],
                  ].map(([c, s]) => (
                    <p key={(s as { label: string }).label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c as string }} />
                      {(s as { label: string }).label}
                      <span className="tabular-nums text-white">{inr((s as { value: number }).value)}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/[0.07] pt-6">{showTable ? <Table c={calc} r={result} /> : <Chart r={result} />}</div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setShowTable((v) => !v)} className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] font-medium text-white/65 transition hover:text-white">
                {showTable ? 'Show the chart' : 'Year-by-year table'}
              </button>
            </div>
          </div>
        </div>
        {/* On phones the result sits below the inputs: keep the headline in view while typing */}
        <div aria-hidden={!showBar} className={`pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center transition-all duration-300 lg:hidden ${showBar ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
          <div className={`flex w-full max-w-[420px] ${showBar ? 'pointer-events-auto' : ''}`} data-bar><div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#8B5CF6]/40 bg-[#15121f]/90 px-4 py-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(110,91,255,0.5)] backdrop-blur-md">
            <span className="text-[12px] font-medium text-white/60">{result.headline.label}</span>
            <span className="flex items-baseline gap-1">
              <Counter value={result.headline.value} className="text-[20px] font-bold tabular-nums" />
              {result.headline.suffix && <span className="text-[12px] text-white/45">{result.headline.suffix}</span>}
            </span>
          </div>
          </div>
        </div>
        <p className="mt-5 text-[12px] leading-relaxed text-white/35">
          Estimates for planning, using the same formulas as the BrokeNoMore app. Real returns vary, and rates for FDs and PPF are set by your bank and the government.
        </p>
      </section>
    </div>
  );
}
