// The digital gold feature cards shown on the phone's side panel (and below the phone on small
// screens): text only, a title and a line about it.

export const FEATURES = [
  { label: 'Buy 24K gold', body: 'Start small, one purchase at a time.' },
  { label: 'Track your holdings', body: 'Your grams and their value, in one place.' },
  { label: 'Get it delivered', body: 'Withdraw eligible gold as coins or bars.' },
  { label: 'Sell anytime', body: 'Sell eligible gold and receive the proceeds.' },
];

export function GoldFeatureCard({ step, compact = false }: { step: number; compact?: boolean }) {
  const feature = FEATURES[step];
  return (
    <div
      data-g="card"
      className={`rounded-[10px] lg:rounded-xl bg-[#121212] ring-1 ring-white/[0.06] ${compact ? 'p-3' : 'p-2.5 md:p-3 lg:px-4 lg:py-3'}`}
    >
      <p className={`font-semibold tracking-tight text-[#F5F5F5] ${compact ? 'text-[13px]' : 'text-[11px] md:text-[13px] lg:text-[16px]'}`}>
        {feature.label}
      </p>
      <p
        className={`mt-1 leading-snug text-neutral-400 ${compact ? 'text-[11px]' : 'text-[10px] md:text-[11px] lg:text-[13px]'}`}
      >
        {feature.body}
      </p>
    </div>
  );
}

export function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9 2l1.6 5.4L16 9l-5.4 1.6L9 16l-1.6-5.4L2 9l5.4-1.6z" fill="#F5D76E" />
      <path d="M18 13l.9 2.6 2.6.9-2.6.9L18 20l-.9-2.6-2.6-.9 2.6-.9z" fill="#D4AF37" />
    </svg>
  );
}
