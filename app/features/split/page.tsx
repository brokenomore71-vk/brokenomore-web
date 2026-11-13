import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import SplitSection from '@/components/splitPage/SplitSection';
// The torn-bill version, switched off for now:
// import SplitSectionTear from '@/components/splitPage/SplitSectionTear';

export const metadata: Metadata = {
  title: 'Split & Share · BrokeNoMore',
  description: 'Split any bill equally or Dutch: snap the bill, tag who had what, and everyone gets their share.',
};

// Split & Share: the bill in 3D, then the whole feature, screen by screen, as you scroll
export default function SplitFeaturePage() {
  return (
    <FeaturePageShell slug="split">
      <SplitSection />
      {/* <SplitSectionTear /> */}
    </FeaturePageShell>
  );
}
