'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MARKS, GREEN, RED } from './data';

// The app's building blocks, at web size: its dark cards, company tiles, coloured changes, and the
// small hooks the section's animations hang off.

export const CARD = 'rounded-2xl border border-white/[0.07] bg-[#18181b]';
export const MUTED = 'text-[#8b8b94]';

// True once the element has scrolled into view (and stays true)
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

// Whether the element is on screen right now
export function useOnScreen<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

// A company's tile, as in the app's lists: a monogram on its brand colour
export function Mark({ symbol, size = 40, className = '' }: { symbol: string; size?: number; className?: string }) {
  const m = MARKS[symbol] ?? { text: symbol.slice(0, 2), ink: '#fff', bg: '#333' };
  const long = m.text.length > 3;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white ${className}`}
      style={{ width: size, height: size, padding: size * 0.1 }}
      aria-hidden="true"
    >
      <span
        className="flex h-full w-full items-center justify-center rounded-[6px] font-bold leading-none tracking-tight"
        style={{
          background: m.bg,
          color: m.ink,
          fontSize: size * (long ? 0.2 : m.text.length > 2 ? 0.28 : 0.42),
          boxShadow: m.ring ? `inset 0 0 0 ${Math.max(1.5, size * 0.05)}px ${m.ring}` : undefined,
        }}
      >
        {m.text}
      </span>
    </span>
  );
}

export function Pct({ v, digits = 2, arrow = false, className = '' }: { v: number; digits?: number; arrow?: boolean; className?: string }) {
  const up = v >= 0;
  return (
    <span className={`font-semibold tabular-nums ${className}`} style={{ color: up ? GREEN : RED }}>
      {arrow ? (up ? '↑ ' : '↓ ') : ''}
      {up ? '+' : '−'}
      {Math.abs(v).toFixed(digits)}%
    </span>
  );
}

// A number that counts up to its value once `run` turns true
export function CountUp({ to, from = 0, run, duration = 1300, format = (n: number) => Math.round(n).toLocaleString('en-IN') }: { to: number; from?: number; run: boolean; duration?: number; format?: (n: number) => string }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setV(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, from, duration]);
  return <>{format(v)}</>;
}

// A card that leans towards the pointer, for a little depth on hover
export function Tilt({ children, className = '', max = 6, style }: { children: React.ReactNode; className?: string; max?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current!;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`sa-tilt relative ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ---- Chart paths ----

export function scale(values: number[], w: number, h: number, pad = 0, lo?: number, hi?: number) {
  const min = lo ?? Math.min(...values);
  const max = hi ?? Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => [(i / (values.length - 1)) * w, pad + (1 - (v - min) / span) * (h - pad * 2)] as const);
}

export function linePath(pts: readonly (readonly [number, number])[]) {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

// A smooth line through the points
export function smoothPath(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
}

// Polar point on an arc, for the gauges (0° is left, 180° is right, over the top)
export function polar(cx: number, cy: number, r: number, deg: number) {
  const a = Math.PI - (deg * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy - Math.sin(a) * r] as const;
}
export function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function Info() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#8b8b94]" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.2v3.8M8 5v.01" strokeLinecap="round" />
    </svg>
  );
}

export function Sparkle({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M10 3.5l1.6 4.4 4.4 1.6-4.4 1.6L10 15.5l-1.6-4.4L4 9.5l4.4-1.6zM17.5 13l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
    </svg>
  );
}
