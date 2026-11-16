import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
// import CalculatorsSection from '@/components/calculatorsPage/CalculatorsSection';
// import CalculatorDesk from '@/components/calculatorsPage/CalculatorDesk';
// import CalculatorStudio from '@/components/calculatorsPage/CalculatorStudio';
import CalculatorsHub from '@/components/calculatorsPage/CalculatorsHub';

export const metadata: Metadata = {
  title: 'Financial Calculators · BrokeNoMore',
  description: 'EMI, SIP, Lumpsum, SWP, FD and PPF calculators. Key in your own amounts and see the result year by year.',
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
