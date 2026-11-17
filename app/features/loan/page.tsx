import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
// import LoanSection from '@/components/loan/LoanSection';
import LoanTowers from '@/components/loanPage/LoanTowers';

export const metadata: Metadata = {
  title: "Loan Planner & EMI Prepayment Calculator",
  description: "Track every loan and EMI, see the total interest you will pay, and find the fastest way to close your loans with prepayments, with the BrokeNoMore loan planner.",
  alternates: { canonical: "/features/loan" },
  openGraph: { url: "/features/loan", title: "Loan Planner & EMI Prepayment Calculator | BrokeNoMore", description: "Track every loan and EMI, see the total interest you will pay, and find the fastest way to close your loans with prepayments, with the BrokeNoMore loan planner." },
};

// The Loan Planner, worked out on a desk calculator
export default function LoanFeaturePage() {
  return (
    <FeaturePageShell slug="loan">
      {/* <LoanSection /> */}<LoanTowers />
    </FeaturePageShell>
  );
}
