'use client';

import { useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { IconArrowDownRight, IconArrowUpRight, IconCheck, IconCopy } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

/* ---------- Layout ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-(--a-text) sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-(--a-muted)">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  description,
  actions,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-(--a-border) bg-(--a-surface) shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]',
        className
      )}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-(--a-text)">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-(--a-subtle)">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn(padded && 'p-5 sm:p-6', padded && (title || actions) && 'pt-4 sm:pt-4')}>{children}</div>
    </section>
  );
}

/* ---------- Stats ---------- */

export function Delta({ value, suffix = 'vs prev.' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  const Icon = up ? IconArrowUpRight : IconArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums',
          up ? 'bg-(--a-green-soft) text-(--a-green)' : 'bg-(--a-red-soft) text-(--a-red)'
        )}
      >
        <Icon size={12} stroke={2.5} />
        {Math.abs(value).toFixed(1)}%
      </span>
      <span className="text-(--a-subtle)">{suffix}</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  footer,
  loading,
  tone = 'accent',
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  tone?: 'accent' | 'green' | 'blue' | 'amber';
}) {
  const tones = {
    accent: 'bg-(--a-accent-soft) text-(--a-lavender)',
    green: 'bg-(--a-green-soft) text-(--a-green)',
    blue: 'bg-(--a-blue-soft) text-(--a-blue)',
    amber: 'bg-(--a-amber-soft) text-(--a-amber)',
  };
  return (
    <div className="admin-rise group relative overflow-hidden rounded-2xl border border-(--a-border) bg-(--a-surface) p-5 transition-colors hover:border-(--a-border-strong)">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-(--a-muted)">{label}</p>
        <span className={cn('grid h-8 w-8 place-items-center rounded-lg', tones[tone])}>{icon}</span>
      </div>
      {loading ? (
        <>
          <div className="admin-skeleton mt-4 h-8 w-24" />
          <div className="admin-skeleton mt-3 h-4 w-32" />
        </>
      ) : (
        <>
          <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-(--a-text)">
            {value}
          </p>
          {footer && <div className="mt-3 text-xs text-(--a-subtle)">{footer}</div>}
        </>
      )}
    </div>
  );
}

/* ---------- Controls ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--a-accent)/60 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
        variant === 'primary' && 'bg-(--a-accent) text-white hover:bg-(--a-accent-hover)',
        variant === 'secondary' &&
          'border border-(--a-border-strong) bg-(--a-raised) text-(--a-text) hover:bg-(--a-hover)',
        variant === 'ghost' && 'text-(--a-muted) hover:bg-(--a-raised) hover:text-(--a-text)',
        variant === 'danger' && 'bg-(--a-red-soft) text-(--a-red) hover:bg-(--a-red)/20',
        className
      )}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--a-accent)/60 disabled:opacity-50',
        checked ? 'bg-(--a-accent)' : 'bg-white/12'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-(--a-border) bg-(--a-surface) p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 rounded-lg px-3 text-[13px] font-medium transition-colors',
            value === o.value
              ? 'bg-(--a-raised) text-(--a-text) shadow-[0_0_0_1px_var(--a-border-strong)]'
              : 'text-(--a-subtle) hover:text-(--a-text)'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Display ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('admin-skeleton', className)} />;
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const tones = {
    neutral: 'bg-white/[0.06] text-(--a-muted)',
    accent: 'bg-(--a-accent-soft) text-(--a-lavender)',
    green: 'bg-(--a-green-soft) text-(--a-green)',
    red: 'bg-(--a-red-soft) text-(--a-red)',
    amber: 'bg-(--a-amber-soft) text-(--a-amber)',
    blue: 'bg-(--a-blue-soft) text-(--a-blue)',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}

const AVATAR_HUES = [262, 200, 155, 25, 330, 45];

export function Avatar({
  name,
  src,
  size = 36,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const label = (name || '?').trim();
  const initials =
    label
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?';
  const hue = AVATAR_HUES[[...label].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HUES.length];

  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hue} 60% 22%)`,
        color: `hsl(${hue} 85% 82%)`,
      }}
    >
      {initials}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-(--a-raised) text-(--a-subtle)">{icon}</span>
      <p className="text-sm font-medium text-(--a-text)">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-(--a-subtle)">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-(--a-red)/25 bg-(--a-red-soft) px-4 py-3 text-sm text-(--a-red)">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 font-medium underline-offset-4 hover:underline">
          Retry
        </button>
      )}
    </div>
  );
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="grid h-7 w-7 place-items-center rounded-md text-(--a-subtle) transition-colors hover:bg-(--a-raised) hover:text-(--a-text)"
    >
      {done ? <IconCheck size={14} className="text-(--a-green)" /> : <IconCopy size={14} />}
    </button>
  );
}
