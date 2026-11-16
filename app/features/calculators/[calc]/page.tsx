import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FeaturePageShell from '@/components/FeaturePageShell';
import { CalculatorPage } from '@/components/calculatorsPage/CalculatorsHub';
import { CALCULATORS, type CalcKey } from '@/lib/calculators';

// One calculator's own page: /features/calculators/emi, /sip, …
export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ calc: c.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ calc: string }> }): Promise<Metadata> {
  const { calc } = await params;
  const c = CALCULATORS.find((x) => x.key === calc);
  if (!c) return {};
  return { title: `${c.name} · BrokeNoMore`, description: c.blurb };
}

export default async function CalculatorRoute({ params }: { params: Promise<{ calc: string }> }) {
  const { calc } = await params;
  if (!CALCULATORS.some((c) => c.key === calc)) notFound();
  return (
    <FeaturePageShell slug="calculators">
      <CalculatorPage k={calc as CalcKey} />
    </FeaturePageShell>
  );
}
