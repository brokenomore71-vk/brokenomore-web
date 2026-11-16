'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { CALCULATORS, compact, inr, inWords, type CalcKey, type Calculator, type Field, type Result } from '@/lib/calculators';
import { Gradient } from '../IntroHero';
import type { VesselScene } from './vesselScene';

// Financial Calculators. Your inputs on the left; on the right, a glass vessel that holds the
// answer: what you put in at the bottom, what it earned on top, and a scale etched on the glass.
// The timeline under it pours the years in one by one. Same formulas as the app.

const A = '#6E5BFF'; // what you put in, or have repaid
const B = '#1A9BBD'; // what it earned, or what it cost (checked against A for colour-blind separation)

function Icon({ k, className = '' }: { k: CalcKey; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {k === 'emi' && <path {...p} d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5" />}
      {k === 'sip' && <path {...p} d="M3 19h4v-4h4v-4h4V7h6M17 3h4v4" />}
      {k === 'lumpsum' && <path {...p} d="M12 3 20 9l-8 12L4 9l8-6ZM4 9h16M9 9l3 12 3-12" />}
      {k === 'swp' && <path {...p} d="M5 4h14M8 4v4a4 4 0 0 0 8 0V4M12 13c-1.6 2.2-2.5 3.6-2.5 4.7a2.5 2.5 0 0 0 5 0c0-1.1-.9-2.5-2.5-4.7Z" />}
      {k === 'fd' && <path {...p} d="M4 5h16v14H4zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12 9v-.5M12 15.5V15" />}
      {k === 'ppf' && <path {...p} d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3ZM8.5 12l2.5 2.5 4.5-5" />}
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// What the vessel holds at any point in time

type Fill = { a: number; b: number; side?: number };
type Labels = { big: string; a: string; b?: string; side?: string };

function labelsFor(c: Calculator, r: Result): Labels {
  if (c.key === 'emi') return { big: 'Paid so far', a: 'Principal repaid', b: 'Interest paid' };
  if (c.key === 'swp') return { big: 'Corpus left', a: 'Corpus left', side: 'Withdrawn so far' };
  return { big: 'Worth', a: r.chart.a, b: r.chart.b };
}

// Year 0 to the last year, whole years: what's in the vessel at the end of each
function fillsFor(c: Calculator, r: Result, v: Record<string, number>): Fill[] {
  if (c.key === 'emi') {
    const out: Fill[] = [{ a: 0, b: 0 }];
    r.rows.forEach((x, i) => out.push({ a: out[i].a + x.a, b: out[i].b + x.b }));
    return out;
  }
  if (c.key === 'swp') return [{ a: v.amount, b: 0, side: 0 }, ...r.rows.map((x) => ({ a: x.a, b: 0, side: x.b }))];
  const start = c.key === 'lumpsum' || c.key === 'fd' ? { a: v.amount, b: 0 } : { a: 0, b: 0 };
  return [start, ...r.rows.map((x) => ({ a: x.a, b: x.b }))];
}

const fillAt = (fills: Fill[], t: number): Fill => {
  const i = Math.max(0, Math.min(fills.length - 1, Math.floor(t)));
  const j = Math.min(fills.length - 1, i + 1);
  const k = t - i;
  const mix = (p = 0, q = 0) => p + (q - p) * k;
  return { a: mix(fills[i].a, fills[j].a), b: mix(fills[i].b, fills[j].b), side: mix(fills[i].side, fills[j].side) };
};

function niceTop(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((s) => s * p >= v)! * p;
}

// ---------------------------------------------------------------------------------------------
// One input: type it, or drag the slider

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
  const id = `cs-${f.key}`;
  const t = toT(f, clampTo(f, value));
  const unit = f.unit === 'pct' ? '%' : f.unit === 'yrs' ? (Math.round(value) === 1 ? 'yr' : 'yrs') : '';
  const typed = draft === null ? NaN : parseFloat(draft.replace(/[^0-9.]/g, ''));
  const off = !Number.isNaN(typed) && (typed > f.max || typed < f.min);
  const limit = (n: number) => (f.unit === 'inr' ? inr(n) : `${n}${f.unit === 'pct' ? '%' : n === 1 ? ' yr' : ' yrs'}`);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] text-white/55">
          {f.label}
        </label>
        <div className={`flex h-9 items-center rounded-lg border px-2.5 transition-colors focus-within:border-[#6E5BFF] ${off ? 'border-[#F5A524]/60' : 'border-white/10'} bg-white/[0.03]`}>
          {f.unit === 'inr' && <span className="mr-1 text-[14px] text-white/40">₹</span>}
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            size={1}
            className="w-[92px] bg-transparent text-right text-[15px] font-semibold tabular-nums text-white outline-none"
            style={{ width: f.unit === 'inr' ? 96 : 44 }}
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
          {unit && <span className="ml-1 text-[13px] text-white/40">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={1000}
        aria-label={`${f.label} slider`}
        className="cs-range mt-3 w-full"
        style={{ ['--fill' as string]: `${(t * 100).toFixed(2)}%` }}
        value={Math.round(t * 1000)}
        onChange={(e) => {
          setDraft(null);
          onChange(fromT(f, +e.target.value / 1000));
        }}
      />
      <div className="mt-0.5 flex justify-between text-[11px] tabular-nums text-white/30">
        <span>{off && typed < f.min ? <span className="text-[#F5A524]">Min {limit(f.min)}</span> : f.unit === 'inr' ? compact(f.min) : limit(f.min)}</span>
        <span>{off && typed > f.max ? <span className="text-[#F5A524]">Max {limit(f.max)}</span> : f.unit === 'inr' ? compact(f.max) : limit(f.max)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

export default function CalculatorStudio() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const sceneRef = useRef<VesselScene | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<CalcKey>('sip');
  const [values, setValues] = useState(() => Object.fromEntries(CALCULATORS.map((c) => [c.key, Object.fromEntries(c.fields.map((f) => [f.key, f.value]))])) as Record<CalcKey, Record<string, number>>);
  const [showTable, setShowTable] = useState(false);
  const calc = CALCULATORS.find((c) => c.key === active)!;
  const v = values[active];
  const result = useMemo(() => calc.run(v), [calc, v]);
  const fills = useMemo(() => fillsFor(calc, result, v), [calc, result, v]);
  const labels = labelsFor(calc, result);
  const n = fills.length - 1;
  const top = niceTop(Math.max(...fills.map((f) => f.a + f.b)));

  // Where on the timeline we are (a year, fractional while pouring). Following the end means a
  // change to the inputs keeps showing the final year.
  const [time, setTime] = useState({ t: 0, follow: true });
  const [playing, setPlaying] = useState(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const t = time.follow ? n : Math.min(time.t, n);
  const now = fillAt(fills, t);

  const pour = useCallback((to: number) => {
    tweenRef.current?.kill();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTime({ t: to, follow: true });
      return;
    }
    const p = { t: 0 };
    setPlaying(true);
    tweenRef.current = gsap.to(p, {
      t: to,
      duration: Math.min(2.6, 0.9 + to * 0.07),
      ease: 'power1.inOut',
      onUpdate: () => setTime({ t: p.t, follow: false }),
      onComplete: () => {
        setTime({ t: to, follow: true });
        setPlaying(false);
      },
    });
  }, []);
  useEffect(() => () => void tweenRef.current?.kill(), []);

  // The headline and the first pour, when the page opens
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      gsap.fromTo(q('[data-rise]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.1, clearProps: 'transform,opacity' });
    });
    return () => mm.revert();
  }, []);

  // The 3D vessel
  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (!host || !stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      sceneRef.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const onLeave = () => sceneRef.current?.setPointer(0, 0);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    import('./vesselScene')
      .then(({ VesselScene }) => {
        if (cancelled) return;
        const scene = new VesselScene(A, B);
        sceneRef.current = scene;
        host.appendChild(scene.canvas);
        // The scale's labels follow the glass as the camera drifts
        scene.onFrame = () =>
          tickRefs.current.forEach((el, i) => {
            if (!el) return;
            const p = scene.scalePoint((i + 1) / 4);
            el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translateY(-50%)`;
          });
        const fit = () => scene.resize(host.clientWidth, host.clientHeight);
        ro = new ResizeObserver(fit);
        ro.observe(host);
        fit();
        io = new IntersectionObserver((entries) => scene.setActive(entries.some((e) => e.isIntersecting)));
        io.observe(stage);
        setReady(true);
      })
      .catch((error) => console.warn('3D vessel failed to load:', error));
    return () => {
      cancelled = true;
      ro?.disconnect();
      io?.disconnect();
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Pour it in once the vessel's ready, and again for each new calculator
  const poured = useRef<string | null>(null);
  useEffect(() => {
    const key = `${active}-${ready}`;
    if (poured.current === key) return;
    poured.current = key;
    pour(n);
  }, [active, ready, n, pour]);

  useEffect(() => {
    sceneRef.current?.setLevels(now.a / top, now.b / top);
  }, [now.a, now.b, top, ready]);

  const pick = (k: CalcKey) => {
    if (k === active) return;
    setActive(k);
    setTime({ t: 0, follow: false });
  };
  const set = (key: string, val: number) => {
    tweenRef.current?.kill();
    setPlaying(false);
    setTime((s) => ({ t: s.t, follow: s.follow || playing }));
    setValues((all) => ({ ...all, [active]: { ...all[active], [key]: val } }));
  };
  const reset = () => setValues((all) => ({ ...all, [active]: Object.fromEntries(calc.fields.map((f) => [f.key, f.value])) }));
  const dirty = calc.fields.some((f) => v[f.key] !== f.value);
  const yearNow = Math.round(t);
  const total = now.a + now.b;

  return (
    <div ref={rootRef} className="relative bg-black text-[#F5F5F5]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_50%_60%_at_70%_20%,rgba(110,91,255,0.14),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1240px] px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <header className="max-w-[640px]">
          <p data-rise className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Financial Calculators
          </p>
          <h1 data-rise className="mt-3 text-[38px] font-semibold leading-[1.04] tracking-tight sm:text-[54px]">
            Know the number <Gradient>before you commit.</Gradient>
          </h1>
          <p data-rise className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-neutral-400 sm:text-[17px]">
            EMI, SIP, Lumpsum, SWP, FD and PPF, worked out on your own amounts, with the same formulas as the app.
          </p>
        </header>

        <div className="mt-10 grid gap-5 lg:grid-cols-[380px_1fr]">
          {/* Inputs */}
          <div data-rise className="order-2 rounded-[28px] border border-white/10 bg-[#0b0b0f] p-5 sm:p-6 lg:order-1">
            <div role="tablist" aria-label="Calculators" className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/[0.06] bg-black p-1.5">
              {CALCULATORS.map((c) => {
                const on = c.key === active;
                return (
                  <button
                    key={c.key}
                    role="tab"
                    aria-selected={on}
                    type="button"
                    onClick={() => pick(c.key)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[12px] font-semibold transition-colors ${on ? 'bg-[#6E5BFF] text-white shadow-[0_8px_24px_-8px_rgba(110,91,255,0.8)]' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'}`}
                  >
                    <Icon k={c.key} className="h-[18px] w-[18px]" />
                    {c.short}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight">{calc.name}</h2>
                <p className="mt-1 text-[13px] leading-snug text-white/50">{calc.blurb}</p>
              </div>
              {dirty && (
                <button type="button" onClick={reset} className="shrink-0 text-[12px] text-white/50 underline underline-offset-4 hover:text-white">
                  Reset
                </button>
              )}
            </div>
            <div className="mt-6 space-y-6">
              {calc.fields.map((f) => (
                <FieldInput key={`${active}-${f.key}`} f={f} value={v[f.key]} onChange={(x) => set(f.key, x)} />
              ))}
            </div>
            <div className="mt-7 flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3.5">
              <span className="text-[13px] text-white/55">{result.headline.label}</span>
              <span className="text-[20px] font-semibold tabular-nums">
                {inr(result.headline.value)}
                {result.headline.suffix && <span className="text-[13px] font-normal text-white/40">{result.headline.suffix}</span>}
              </span>
            </div>
          </div>

          {/* The vessel */}
          <div ref={stageRef} data-rise className="relative order-1 h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(ellipse_70%_60%_at_60%_70%,#120f24_0%,#050507_70%)] sm:h-[600px] lg:order-2" aria-live="polite">
            <div ref={hostRef} className="absolute inset-0" />

            {/* Before the 3D loads (or with reduced motion): the same vessel, flat */}
            {!ready && (
              <div className="absolute bottom-[86px] left-1/2 h-[58%] w-[110px] -translate-x-1/2 overflow-hidden rounded-b-[28px] rounded-t-[8px] border border-white/15 bg-white/[0.03] sm:left-[60%]">
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end" style={{ height: `${(((now.a + now.b) / top) * 100).toFixed(2)}%` }}>
                  <div style={{ height: `${total > 0 ? (now.b / (now.a + now.b)) * 100 : 0}%`, background: B }} />
                  <div style={{ height: `${total > 0 ? (now.a / (now.a + now.b)) * 100 : 0}%`, background: A }} />
                </div>
              </div>
            )}

            {/* The scale, etched on the glass */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    tickRefs.current[i - 1] = el;
                  }}
                  className={`absolute left-0 top-0 pl-2 text-[11px] tabular-nums text-white/40 ${ready ? '' : 'hidden'}`}
                >
                  {compact((top * i) / 4)}
                </span>
              ))}
            </div>

            {/* The reading */}
            <div className="pointer-events-none absolute left-5 top-5 max-w-[60%] sm:left-7 sm:top-7">
              <p className="text-[12px] font-medium text-white/45">
                {yearNow === 0 ? 'Day one' : `After ${yearNow} ${yearNow === 1 ? 'year' : 'years'}`} · {labels.big.toLowerCase()}
              </p>
              <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight tabular-nums sm:text-[46px]">{inr(total)}</p>
              <p className="mt-1.5 text-[12px] text-white/35">{inWords(total)} rupees</p>
              <div className="mt-5 space-y-2 text-[13px]">
                <p className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: A }} />
                  <span className="text-white/55">{labels.a}</span>
                  <span className="font-semibold tabular-nums">{inr(now.a)}</span>
                </p>
                {labels.b && (
                  <p className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: B }} />
                    <span className="text-white/55">{labels.b}</span>
                    <span className="font-semibold tabular-nums">{inr(now.b)}</span>
                  </p>
                )}
                {labels.side && (
                  <p className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-[3px] border border-white/40" />
                    <span className="text-white/55">{labels.side}</span>
                    <span className="font-semibold tabular-nums">{inr(now.side ?? 0)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* The timeline */}
            <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-3 py-2.5 backdrop-blur-md sm:inset-x-6 sm:bottom-6">
              <button
                type="button"
                onClick={() => (playing ? (tweenRef.current?.kill(), setPlaying(false)) : pour(n))}
                aria-label={playing ? 'Pause' : 'Pour the years in again'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15l12.5-7.5z" /></svg>
                )}
              </button>
              <span className="w-[54px] shrink-0 text-[12px] font-semibold tabular-nums text-white/70">Year {yearNow}</span>
              <input
                type="range"
                min={0}
                max={n}
                step={0.01}
                aria-label="Year"
                className="cs-range min-w-0 flex-1"
                style={{ ['--fill' as string]: `${((t / n) * 100).toFixed(2)}%` }}
                value={t}
                onChange={(e) => {
                  tweenRef.current?.kill();
                  setPlaying(false);
                  const val = Math.round(+e.target.value);
                  setTime({ t: val, follow: val === n });
                }}
              />
              <span className="shrink-0 text-[12px] tabular-nums text-white/40">{n} yrs</span>
            </div>
          </div>
        </div>

        {/* Every year, as a table */}
        <div className="mt-5">
          <button type="button" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable} className="flex items-center gap-2 text-[13px] font-medium text-white/60 transition hover:text-white">
            <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${showTable ? 'rotate-90' : ''}`} aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m9 6 6 6-6 6" /></svg>
            Year-by-year breakdown
          </button>
          {showTable && (
            <div className="mt-3 max-h-[340px] overflow-auto rounded-2xl border border-white/10">
              <table className="w-full text-[13px] tabular-nums">
                <thead className="sticky top-0 bg-[#0d0d12] text-left text-[11px] uppercase tracking-[0.1em] text-white/45">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Year</th>
                    <th className="px-4 py-2.5 text-right font-semibold">{labels.a}</th>
                    {labels.b && <th className="px-4 py-2.5 text-right font-semibold">{labels.b}</th>}
                    {labels.side && <th className="px-4 py-2.5 text-right font-semibold">{labels.side}</th>}
                    {labels.b && <th className="px-4 py-2.5 text-right font-semibold">{labels.big}</th>}
                  </tr>
                </thead>
                <tbody>
                  {fills.slice(1).map((f, i) => (
                    <tr key={i} className={`border-t border-white/[0.06] ${i + 1 === yearNow ? 'bg-[#6E5BFF]/10 text-white' : 'text-white/75'}`}>
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2 text-right">{inr(f.a)}</td>
                      {labels.b && <td className="px-4 py-2 text-right">{inr(f.b)}</td>}
                      {labels.side && <td className="px-4 py-2 text-right">{inr(f.side ?? 0)}</td>}
                      {labels.b && <td className="px-4 py-2 text-right">{inr(f.a + f.b)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-8 max-w-[720px] text-[12px] leading-relaxed text-white/30">
          Estimates for planning. Returns aren’t guaranteed, and FD and PPF rates are set by your bank and the government.
        </p>
      </div>
    </div>
  );
}
