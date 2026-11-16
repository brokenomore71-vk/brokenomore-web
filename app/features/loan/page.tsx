import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
// import LoanSection from '@/components/loan/LoanSection';
import LoanTowers from '@/components/loanPage/LoanTowers';

export const metadata: Metadata = {
  title: 'Loan Planner · BrokeNoMore',
  description: "Track every EMI, see the interest you'll pay, and find the fastest way out with prepayments.",
};

// The Loan Planner, worked out on a desk calculator
export default function LoanFeaturePage() {
  return (
    <FeaturePageShell slug="loan">
      {/* <LoanSection /> */}<LoanTowers />
    </FeaturePageShell>
  );
}
