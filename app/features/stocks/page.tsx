import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import StockAISection from '@/components/stockAI/StockAISection';

export const metadata: Metadata = {
  title: 'Stock Analysis & AI · BrokeNoMore',
  description: 'Explore 6,000+ NSE and BSE stocks, read every number on one page, and get an AI report built for your money, timeline and goal.',
};

// Stock Analysis & AI: the AI core, Explore, a stock's page, the six questions and the report
export default function StocksFeaturePage() {
  return (
    <FeaturePageShell slug="stocks">
      <StockAISection />
    </FeaturePageShell>
  );
}
