import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import BillsSection from '@/components/bills/BillsSection';

export const metadata: Metadata = {
  title: 'Bills & Subscriptions · BrokeNoMore',
  description: "Every bill and subscription on one calendar: what's paid, what's overdue and what's coming up.",
};

// Bills & Subscriptions, on a 3D desk calendar
export default function BillsFeaturePage() {
  return (
    <FeaturePageShell slug="bills">
      <BillsSection />
    </FeaturePageShell>
  );
}
