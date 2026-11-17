import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import SplitSection from '@/components/splitPage/SplitSection';
// The torn-bill version, switched off for now:
// import SplitSectionTear from '@/components/splitPage/SplitSectionTear';

export const metadata: Metadata = {
  title: "Split Bills with Friends: Bill Splitter App",
  description: "Split any bill equally or by item. Snap a photo of the bill, tag who had what, and BrokeNoMore works out everyone's share and who owes whom.",
  alternates: { canonical: "/features/split" },
  openGraph: { url: "/features/split", title: "Split Bills with Friends: Bill Splitter App | BrokeNoMore", description: "Split any bill equally or by item. Snap a photo of the bill, tag who had what, and BrokeNoMore works out everyone's share and who owes whom." },
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
