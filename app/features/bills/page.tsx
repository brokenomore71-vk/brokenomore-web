import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import BillsFlip from '@/components/billsPage/BillsFlip';
// The night-desk scene and the flat bill calendar, switched off for now:
// import BillsNightHero from '@/components/billsPage/BillsNightHero';
// import BillsBoard from '@/components/billsPage/BillsBoard';
// The solar-system version, switched off for now:
// import BillsOrbit from '@/components/billsPage/BillsOrbit';
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

// Bills & Subscriptions: a tear-off calendar, one page a day, stopping on every day a bill is due
export default function BillsFeaturePage() {
  return (
    <FeaturePageShell slug="bills">
      <BillsFlip />
      {/* <BillsNightHero /> */}
      {/* <BillsBoard flat /> */}
      {/* <BillsOrbit /> */}
      {/* <BillsBoard /> (the tablet version) */}
      {/* <BillsTunnel /> */}
      {/* <BillsCity /> */}
      {/* <BillsMail /> */}
      {/* <BillsSection /> */}
    </FeaturePageShell>
  );
}
