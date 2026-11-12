import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import FeatureShowcase from '@/components/FeatureShowcase';
import BillsSection from '@/components/bills/BillsSection';
import LoanSection from '@/components/loan/LoanSection';

export const metadata: Metadata = {
  title: 'Features · BrokeNoMore',
  description: 'See how Split & Share works, from picking friends to scanning the bill.',
};

// The Features page: the phone playing the whole split story as you scroll, then Bills &
// Subscriptions, then the Loan Planner
export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen w-full bg-black overflow-x-hidden">
      <Navbar />
      <div className="relative z-10 flex flex-col items-center pt-20 sm:pt-[72px] pb-16 sm:pb-24 px-4 sm:px-6 select-none">
        {/* A plain block around the section: pinning inside a flex box would drop its scroll space */}
        <div className="w-full" suppressHydrationWarning>
          <FeatureShowcase part="split" />
        </div>

        {/* Bills & Subscriptions, below the split story */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] mt-16 sm:mt-24" suppressHydrationWarning>
          <BillsSection />
        </div>

        {/* Loan Planner, worked out on a desk calculator */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]" suppressHydrationWarning>
          <LoanSection />
        </div>
      </div>
    </main>
  );
}
