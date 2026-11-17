import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
// import CalculatorsSection from '@/components/calculatorsPage/CalculatorsSection';
// import CalculatorDesk from '@/components/calculatorsPage/CalculatorDesk';
// import CalculatorStudio from '@/components/calculatorsPage/CalculatorStudio';
import CalculatorsHub from '@/components/calculatorsPage/CalculatorsHub';

export const metadata: Metadata = {
  title: "EMI, SIP, Lumpsum, SWP, FD & PPF Calculators",
  description: "Free online financial calculators: EMI, SIP, Lumpsum, SWP, FD and PPF. Key in your own amounts and see returns, interest and maturity value year by year.",
  alternates: { canonical: "/features/calculators" },
  openGraph: { url: "/features/calculators", title: "EMI, SIP, Lumpsum, SWP, FD & PPF Calculators | BrokeNoMore", description: "Free online financial calculators: EMI, SIP, Lumpsum, SWP, FD and PPF. Key in your own amounts and see returns, interest and maturity value year by year." },
};

// The app's six calculators: a grid of cards, each opening its own calculator
export default function CalculatorsFeaturePage() {
  return (
    <FeaturePageShell slug="calculators">
      {/* <CalculatorsSection /> */}
      {/* <CalculatorDesk /> */}
      {/* <CalculatorStudio /> */}
      <CalculatorsHub />
    </FeaturePageShell>
  );
}
