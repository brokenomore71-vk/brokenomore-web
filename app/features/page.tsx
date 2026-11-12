import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import FeatureShowcase from '@/components/FeatureShowcase';
import BillsSection from '@/components/bills/BillsSection';

export const metadata: Metadata = {
  title: 'Features · BrokeNoMore',
  description: 'See how Split & Share works, from picking friends to scanning the bill.',
};

// The Features page: the phone playing the whole split story as you scroll, then Bills &
// Subscriptions
export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen w-full bg-black overflow-x-hidden">
      <Navbar />
      <div className="relative z-10 flex flex-col items-center pt-[72px] pb-24 px-4 sm:px-6 select-none">
        {/* A plain block around the section: pinning inside a flex box would drop its scroll space */}
        <div className="w-full" suppressHydrationWarning>
          <FeatureShowcase part="split" />
        </div>

        {/* Bills & Subscriptions, below the split story */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] mt-24" suppressHydrationWarning>
          <BillsSection />
        </div>
      </div>
    </main>
  );
}
