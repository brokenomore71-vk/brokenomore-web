'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { CALCULATORS, inr, inWords, type CalcKey, type Calculator, type Field, type Result, type Row } from '@/lib/calculators';

// Financial Calculators, asked as questions. Pick one, and it's written out as a sentence whose
// numbers are yours to change: drag one sideways to scrub it, or tap it and type. The answer
// counts to its new value, and the years build up as a skyline of 3D columns: what you put in,
// and what it earned on top. Same formulas as the app.

// The two series, checked for colour-blind separation on this dark surface
const PUT = '#0E9F86'; // what you put in, or borrowed
const EARN = '#CF7F12'; // what it earns, or what it costs
const MINT = '#6EF0CF'; // the numbers you can change
const GOLD = '#F2B544'; // the answer

// Lighten (k > 0) or darken (k < 0) a colour, given as #hex or rgb()
const shade = (color: string, k: number) => {
  const m = color.match(/\d+/g);
  const n = parseInt(color.slice(1), 16);
  const rgb = color.startsWith('#') ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : m!.slice(0, 3).map(Number);
  const c = rgb.map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
  return `rgb(${c.join(',')})`;
};

// ---------------------------------------------------------------------------------------------
// A number in the sentence: drag it sideways to scrub it, tap it to type, arrow keys to step

const fmt = (f: Field, v: number) => (f.unit === 'inr' ? Math.round(v).toLocaleString('en-IN') : f.unit === 'pct' ? String(+v.toFixed(2)) : String(Math.round(v)));
const toT = (f: Field, v: number) => (f.log ? Math.log(v / f.min) / Math.log(f.max / f.min) : (v - f.min) / (f.max - f.min));
const fromT = (f: Field, t: number) => {
  const tt = Math.min(1, Math.max(0, t));
  const raw = f.log ? f.min * Math.pow(f.max / f.min, tt) : f.min + tt * (f.max - f.min);
  const tidy = f.log ? Math.max(f.step, Math.pow(10, Math.floor(Math.log10(raw)) - 1) * (raw >= 1e5 ? 5 : 1)) : f.step;
  return Math.min(f.max, Math.max(f.min, Math.round(raw / tidy) * tidy));
};
const clampTo = (f: Field, v: number) => Math.min(f.max, Math.max(f.min, v));

function Scrub({ f, value, onChange }: { f: Field; value: number; onChange: (v: number) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const drag = useRef<{ x: number; t: number; moved: boolean; id: number } | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const text = draft ?? fmt(f, value);
  const unit = f.unit === 'pct' ? '%' : f.unit === 'yrs' ? (Math.round(value) === 1 ? '\u00a0year' : '\u00a0years') : '';

  const onDown = (e: React.PointerEvent) => {
    if (document.activeElement === inputRef.current) return; // typing: let the caret move
    e.preventDefault();
    drag.current = { x: e.clientX, t: toT(f, clampTo(f, value)), moved: false, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActive(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 5) return;
    d.moved = true;
    onChange(fromT(f, d.t + dx / 420));
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    setActive(false);
    if (d && !d.moved) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };
  const nudge = (dir: number) => {
    if (f.log) onChange(fromT(f, toT(f, value) + dir * 0.02));
    else onChange(clampTo(f, +(value + dir * f.step).toFixed(2)));
  };

  return (
    <span
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`group relative inline-flex cursor-ew-resize items-baseline whitespace-nowrap rounded-[0.18em] px-[0.12em] transition-colors [touch-action:pan-y] ${active ? 'bg-[#6EF0CF]/15' : 'hover:bg-[#6EF0CF]/10'} focus-within:bg-[#6EF0CF]/10`}
      style={{ color: MINT }}
    >
      {f.unit === 'inr' && <span>₹</span>}
      {/* The input sits over an invisible copy of its text, so it's exactly as wide as the number */}
      <span className="inline-grid">
      <span aria-hidden="true" className="invisible whitespace-pre [grid-area:1/1]">{text || ' '}</span>
      <input
        ref={inputRef}
        size={1}
        aria-label={f.label}
        inputMode="decimal"
        autoComplete="off"
        className="w-full min-w-0 cursor-[inherit] bg-transparent p-0 text-inherit outline-none [grid-area:1/1] focus:cursor-text"
        style={{ font: 'inherit', letterSpacing: 'inherit' }}
        value={text}
        onFocus={() => setDraft(fmt(f, value))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseFloat(e.target.value.replace(/[^0-9.]/g, ''));
          if (!Number.isNaN(n)) onChange(clampTo(f, n));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            setDraft(null);
            nudge(e.key === 'ArrowUp' ? 1 : -1);
          }
        }}
      />
      </span>
      {unit && <span>{unit}</span>}
      {/* The dotted rule that says "this one's yours" */}
      <span className="pointer-events-none absolute inset-x-[0.12em] bottom-[0.02em] h-[3px] rounded-full opacity-70" style={{ backgroundImage: `radial-gradient(circle, ${MINT} 1.2px, transparent 1.6px)`, backgroundSize: '7px 3px' }} />
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// The answer, counting to its new value

function Counter({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const p = { v: shown.current };
    const tw = gsap.to(p, {
      v: value,
      duration: 0.7,
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
    <span ref={ref} className={className} style={style}>
      {inr(value)}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// The skyline: a 3D column for each year, standing on a tilted floor

function Box({ s, z, h, color, lit }: { s: number; z: number; h: number; color: string; lit: boolean }) {
  if (h <= 0.5) return null;
  const base = lit ? shade(color, 0.18) : color;
  const ease = 'transform .6s cubic-bezier(.2,.8,.2,1), width .6s cubic-bezier(.2,.8,.2,1), height .6s cubic-bezier(.2,.8,.2,1)';
  const face = 'absolute left-0 top-0 [backface-visibility:visible]';
  return (
    <>
      {/* Top */}
      <div className={face} style={{ width: s, height: s, transform: `translateZ(${z + h}px)`, background: shade(base, 0.22), transition: ease, boxShadow: lit ? `0 0 24px ${color}` : undefined }} />
      {/* The two sides that face the camera, and the two behind */}
      <div className={face} style={{ width: s, height: h, transformOrigin: '0 0', transform: `translate3d(0, ${s}px, ${z}px) rotateX(90deg)`, background: `linear-gradient(0deg, ${shade(base, -0.05)}, ${shade(base, -0.3)})`, transition: ease }} />
      <div className={face} style={{ width: h, height: s, transformOrigin: '0 0', transform: `translate3d(${s}px, 0, ${z}px) rotateY(-90deg)`, background: `linear-gradient(90deg, ${shade(base, -0.45)}, ${shade(base, -0.25)})`, transition: ease }} />
      <div className={face} style={{ width: s, height: h, transformOrigin: '0 0', transform: `translate3d(0, 0, ${z}px) rotateX(90deg)`, background: shade(base, -0.5), transition: ease }} />
      <div className={face} style={{ width: h, height: s, transformOrigin: '0 0', transform: `translate3d(0, 0, ${z}px) rotateY(-90deg)`, background: shade(base, -0.55), transition: ease }} />
    </>
  );
}

function Skyline({ r, year, onYear }: { r: Result; year: number; onYear: (y: number) => void }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(720);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const rows = r.rows;
  const single = !!r.chart.single;
  const n = rows.length;
  // The floor runs diagonally; its length fits the panel's width
  const H = w < 640 ? 300 : 400;
  const floor = Math.min(w * 0.95, 980);
  const pitch = floor / (n + 1);
  const s = Math.max(6, Math.min(40, pitch * 0.68));
  const top = Math.max(...rows.map((x) => (single ? x.a : x.a + x.b))) || 1;
  // The floor's far end rises up the screen as well, so the tallest column gets what's left
  const hMax = Math.max(90, (H - 0.2 * floor - 70) / 0.88);
  const every = Math.ceil(n / 8);

  return (
    <div ref={wrapRef} className="relative w-full [perspective:2000px]" style={{ height: H }} onPointerLeave={() => onYear(n)}>
      <div className="absolute left-1/2 [transform-style:preserve-3d]" style={{ top: H - 0.1 * floor - 34, transform: 'rotateX(62deg) rotateZ(-22deg)' }}>
        {/* The floor */}
        <div
          className="absolute rounded-[18px] border border-white/[0.07]"
          style={{
            width: floor + 80,
            height: s + 120,
            left: -(floor + 80) / 2,
            top: -(s + 120) / 2,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(14,159,134,0.16), transparent 70%)',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), radial-gradient(ellipse at 50% 50%, rgba(14,159,134,0.18), transparent 70%)',
            backgroundSize: '24px 24px, 24px 24px, 100% 100%',
          }}
        />
        {rows.map((x, i) => {
          const ha = (x.a / top) * hMax;
          const hb = single ? 0 : (x.b / top) * hMax;
          const lit = x.year === year;
          const left = -floor / 2 + pitch * (i + 1) - s / 2;
          return (
            <div key={x.year} className="absolute [transform-style:preserve-3d]" style={{ left, top: -s / 2, width: s, height: s }} onPointerEnter={() => onYear(x.year)} onPointerDown={() => onYear(x.year)}>
              <Box s={s} z={0} h={ha} color={PUT} lit={lit} />
              <Box s={s} z={ha} h={hb} color={EARN} lit={lit} />
              {/* Its shadow, and the year written on the floor */}
              <div className="pointer-events-none absolute rounded-sm bg-black/50 blur-[3px]" style={{ left: s * 0.3, top: s * 0.3, width: s, height: s, transform: 'translateZ(0.5px)' }} />
              {(i % every === every - 1 || i === 0 || lit) && (
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold tabular-nums" style={{ top: s + 10, color: lit ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                  {x.year}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The readout for one year

function readout(c: Calculator, r: Result, x: Row) {
  if (c.key === 'emi')
    return { big: { label: 'Balance left', v: x.total }, a: { label: 'Principal paid this year', v: x.a }, b: { label: 'Interest paid this year', v: x.b } };
  if (c.key === 'swp') return { big: { label: 'Corpus left', v: x.a }, a: { label: 'Corpus left', v: x.a }, b: { label: 'Withdrawn so far', v: x.b } };
  return { big: { label: 'Worth', v: x.total }, a: { label: r.chart.a, v: x.a }, b: { label: r.chart.b ?? '', v: x.b } };
}

function Table({ c, r }: { c: Calculator; r: Result }) {
  return (
    <div className="max-h-[300px] overflow-auto rounded-2xl border border-white/10">
      <table className="w-full text-[13px] tabular-nums">
        <thead className="sticky top-0 bg-[#0d1211] text-left text-[11px] uppercase tracking-[0.1em] text-white/45">
          <tr>
            <th className="px-3 py-2.5 font-semibold">Year</th>
            {[readout(c, r, r.rows[0]).a.label, readout(c, r, r.rows[0]).b.label, readout(c, r, r.rows[0]).big.label]
              .filter((l, i, all) => all.indexOf(l) === i)
              .map((l) => (
                <th key={l} className="px-3 py-2.5 text-right font-semibold">{l.replace(' this year', '')}</th>
              ))}
          </tr>
        </thead>
        <tbody>
          {r.rows.map((x) => {
            const o = readout(c, r, x);
            const cells = [o.a, o.b, o.big].filter((v, i, all) => all.findIndex((u) => u.label === v.label) === i);
            return (
              <tr key={x.year} className="border-t border-white/[0.06] text-white/80">
                <td className="px-3 py-2">{x.year}</td>
                {cells.map((v) => (
                  <td key={v.label} className="px-3 py-2 text-right">{inr(v.v)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

export default function CalculatorDesk() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sentenceRef = useRef<HTMLDivElement | null>(null);
  const deskRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<CalcKey>('sip');
  const [values, setValues] = useState(() => Object.fromEntries(CALCULATORS.map((c) => [c.key, Object.fromEntries(c.fields.map((f) => [f.key, f.value]))])) as Record<CalcKey, Record<string, number>>);
  const calc = CALCULATORS.find((c) => c.key === active)!;
  const result = useMemo(() => calc.run(values[active]), [calc, values, active]);
  const [year, setYear] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const shownYear = Math.min(year ?? result.rows.length, result.rows.length);
  const row = result.rows[shownYear - 1];
  const out = readout(calc, result, row);
  const split = out.a.v + out.b.v > 0 ? out.a.v / (out.a.v + out.b.v) : 1;
  const equation = calc.key !== 'swp';

  // The page opening: headline, then the questions
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      gsap.from(q('[data-rise]'), { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
      gsap.fromTo(q('[data-q]'), { y: 24, opacity: 0, rotateX: -35, transformOrigin: '50% 100%' }, { y: 0, opacity: 1, rotateX: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.35, clearProps: 'transform,opacity,translate,rotate,scale' });
    });
    return () => mm.revert();
  }, []);

  // A new question: its sentence writes itself in, word by word
  useLayoutEffect(() => {
    const el = sentenceRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tw = gsap.from(el.querySelectorAll('[data-tok]'), { y: 18, opacity: 0, filter: 'blur(6px)', duration: 0.5, ease: 'power3.out', stagger: 0.035 });
    return () => {
      tw.revert();
    };
  }, [active]);

  const pick = (k: CalcKey) => {
    setActive(k);
    setYear(null);
    if (deskRef.current && deskRef.current.getBoundingClientRect().top > window.innerHeight * 0.6) {
      window.scrollTo({ top: deskRef.current.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    }
  };
  const set = (key: string, v: number) => setValues((all) => ({ ...all, [active]: { ...all[active], [key]: v } }));
  const reset = () => setValues((all) => ({ ...all, [active]: Object.fromEntries(calc.fields.map((f) => [f.key, f.value])) }));
  const dirty = calc.fields.some((f) => values[active][f.key] !== f.value);

  // The sentence's words, each its own token so they can arrive one by one
  const tokens: React.ReactNode[] = [];
  calc.sentence.forEach((part, i) => {
    if (typeof part === 'string')
      part.split(/(\s+)/).forEach((w, j) => {
        if (w.trim()) tokens.push(<span key={`${i}-${j}`} data-tok className="inline-block">{w}</span>);
        else if (w) tokens.push(' ');
      });
    else {
      const f = calc.fields.find((x) => x.key === part.f)!;
      tokens.push(
        <span key={`${active}-${f.key}`} data-tok className="inline-block">
          <Scrub f={f} value={values[active][f.key]} onChange={(v) => set(f.key, v)} />
        </span>
      );
    }
  });

  return (
    <div ref={rootRef} className="relative overflow-hidden bg-[#050807] text-[#EDEFEA]">
      {/* Light on the desk, and a fine dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(14,159,134,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(180deg,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-[1240px] px-4 pb-14 pt-10 sm:px-8 sm:pt-16">
        {/* The questions */}
        <header className="max-w-[760px]">
          <p data-rise className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: MINT, boxShadow: `0 0 12px ${MINT}` }} />
            Financial Calculators
          </p>
          <h1 data-rise className="mt-4 text-[44px] font-bold leading-[0.98] tracking-[-0.03em] sm:text-[72px]">
            Ask your money
            <br />
            <span style={{ color: MINT }}>anything.</span>
          </h1>
          <p data-rise className="mt-5 max-w-[520px] text-[16px] leading-relaxed text-white/55 sm:text-[17px]">
            Six calculators from the app, asked as plain questions. Change any number in the answer and watch your years build up.
          </p>
        </header>

        <div role="tablist" aria-label="Calculators" className="-mx-4 mt-10 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [perspective:900px] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {CALCULATORS.map((c, i) => {
            const on = c.key === active;
            return (
              <button
                key={c.key}
                data-q
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => pick(c.key)}
                className={`group relative flex w-[200px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-[border-color,background-color,translate] duration-300 sm:w-auto ${on ? 'border-[#6EF0CF]/60 bg-[#0d1f1b]' : 'border-white/[0.08] bg-white/[0.02] hover:-translate-y-1 hover:border-white/20'}`}
                style={{ minHeight: 132 }}
              >
                {on && <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl" style={{ background: 'rgba(110,240,207,0.25)' }} />}
                <span className="flex items-center justify-between text-[12px] font-semibold tabular-nums">
                  <span style={{ color: on ? MINT : 'rgba(255,255,255,0.35)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">{c.short}</span>
                </span>
                <span className={`mt-4 text-[17px] font-semibold leading-[1.2] ${on ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{c.question}</span>
              </button>
            );
          })}
        </div>

        {/* The answer, as a sentence */}
        <section ref={deskRef} aria-label={calc.name} className="relative mt-10 select-text sm:mt-14">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/40">{calc.name}</p>
            <div className="flex items-center gap-3">
              <p className="hidden text-[12px] text-white/40 sm:block">Drag a number sideways, or tap it to type</p>
              {dirty && (
                <button type="button" onClick={reset} className="rounded-full border border-white/10 px-3 py-1 text-[12px] text-white/60 transition hover:text-white">
                  Reset
                </button>
              )}
            </div>
          </div>
          <div ref={sentenceRef} className="mt-4 max-w-[1100px] text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] sm:text-[46px] lg:text-[54px]">
            {tokens}{' '}
            <span data-tok className="inline-block whitespace-nowrap">
              <Counter value={result.headline.value} className="tabular-nums" style={{ color: GOLD, textShadow: '0 0 40px rgba(242,181,68,0.35)' }} />
              {calc.answer ? <span className="text-white"> {calc.answer}</span> : null}
              <span className="text-white">.</span>
            </span>
          </div>
          <p className="mt-3 text-[13px] text-white/40 sm:hidden">Drag a number sideways, or tap it to type</p>

          {/* The sum: put in + earned = got */}
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
            {result.stats.map((s, i) => (
              <div key={s.label} className="relative bg-[#070b0a] px-5 py-4">
                <p className="flex items-center gap-2 text-[12px] font-medium text-white/50">
                  {i < 2 && !(calc.key === 'swp' && i === 0) && <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i === 0 ? PUT : EARN }} />}
                  {s.label}
                </p>
                <p className="mt-1 text-[24px] font-bold tabular-nums tracking-tight sm:text-[28px]">{inr(s.value)}</p>
                <p className="text-[12px] text-white/35">{inWords(s.value)}</p>
                {equation && i < 2 && (
                  <span className="absolute -bottom-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-[#050807] text-[13px] font-bold text-white/60 sm:-right-3 sm:bottom-auto sm:left-auto sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0">
                    {i === 0 ? '+' : '='}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* The years */}
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_80%,rgba(14,159,134,0.08),transparent_60%)]">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
                <p className="text-[14px] font-medium text-white/75">{result.chart.caption}</p>
                <div className="flex items-center gap-4 text-[12px] text-white/55">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: PUT }} />{result.chart.a}</span>
                  {!result.chart.single && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: EARN }} />{result.chart.b}</span>}
                </div>
              </div>
              <Skyline r={result} year={shownYear} onYear={setYear} />
            </div>

            <aside className="flex flex-col rounded-[28px] border border-white/[0.08] bg-[#070b0a] p-5" aria-live="polite">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-semibold text-white">
                  Year {shownYear} <span className="font-normal text-white/40">of {result.rows.length}</span>
                </p>
                <p className="text-[12px] text-white/40">{out.big.label}</p>
              </div>
              <p className="mt-2 text-[32px] font-bold tabular-nums tracking-tight">{inr(out.big.v)}</p>
              <div className="mt-4 flex h-2.5 gap-[2px] overflow-hidden rounded-full">
                <div className="h-full rounded-l-full transition-[width] duration-500" style={{ width: `${split * 100}%`, background: PUT }} />
                <div className="h-full flex-1 rounded-r-full" style={{ background: EARN }} />
              </div>
              <div className="mt-4 space-y-2.5 text-[13px]">
                {[
                  [PUT, out.a],
                  [EARN, out.b],
                ].map(([c, o]) => {
                  const v = o as { label: string; v: number };
                  return (
                    <p key={v.label} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-white/60"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c as string }} />{v.label}</span>
                      <span className="font-semibold tabular-nums">{inr(v.v)}</span>
                    </p>
                  );
                })}
              </div>
              <label className="mt-6 block text-[12px] text-white/40" htmlFor="calc-year">
                Pick a year (or point at a column)
              </label>
              <input id="calc-year" type="range" min={1} max={result.rows.length} value={shownYear} onChange={(e) => setYear(+e.target.value)} className="cd-range mt-2 w-full" style={{ ['--fill' as string]: `${result.rows.length > 1 ? ((shownYear - 1) / (result.rows.length - 1)) * 100 : 100}%` }} />
              <button type="button" onClick={() => setTable((v) => !v)} className="mt-auto pt-6 text-left text-[13px] font-medium underline decoration-white/20 underline-offset-4 transition hover:decoration-white" style={{ color: MINT }}>
                {table ? 'Hide the table' : `See all ${result.rows.length} years as a table`}
              </button>
            </aside>
          </div>
          {table && (
            <div className="mt-6">
              <Table c={calc} r={result} />
            </div>
          )}

          <p className="mt-8 max-w-[720px] text-[12px] leading-relaxed text-white/35">
            Estimates for planning, using the same formulas as the BrokeNoMore app. Returns aren’t guaranteed, and FD and PPF rates are set by your bank and the government.
          </p>
        </section>
      </div>
    </div>
  );
}

