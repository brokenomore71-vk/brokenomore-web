import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import BillsOrbit from '@/components/billsPage/BillsOrbit';
// The tablet-calendar version, switched off for now:
// import BillsBoard from '@/components/billsPage/BillsBoard';
// The time-tunnel version, switched off for now:
// import BillsTunnel from '@/components/billsPage/BillsTunnel';
// The city-of-bills version, switched off for now:
// import BillsCity from '@/components/billsPage/BillsCity';
// The bills-as-post version, switched off for now:
// import BillsMail from '@/components/billsPage/BillsMail';
// The 3D desk-calendar version, switched off for now:
// import BillsSection from '@/components/bills/BillsSection';

export const metadata: Metadata = {
  title: 'Bills & Subscriptions · BrokeNoMore',
  description: "Every bill and subscription on one calendar: what's paid, what's overdue and what's coming up.",
};

// Bills & Subscriptions: every bill a planet in orbit, due as it crosses today's beam
export default function BillsFeaturePage() {
  return (
    <FeaturePageShell slug="bills">
      <BillsOrbit />
      {/* <BillsBoard /> */}
      {/* <BillsTunnel /> */}
      {/* <BillsCity /> */}
      {/* <BillsMail /> */}
      {/* <BillsSection /> */}
    </FeaturePageShell>
  );
}
