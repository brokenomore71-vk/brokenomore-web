import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import StockAISection from '@/components/stockAI/StockAISection';
import { SITE_NAME, SITE_URL, STOCKS_KEYWORDS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'AI Stock Analysis for NSE & BSE Stocks: Smart Stock Screener & Reports',
  description:
    'Research 6,000+ NSE and BSE stocks with AI. Get comprehensive financial health scores, valuation metrics, technical indicators, and personalized AI equity research reports tailored to your timeline and goals.',
  keywords: STOCKS_KEYWORDS,
  alternates: { canonical: '/features/stocks' },
  openGraph: {
    url: '/features/stocks',
    title: 'AI Stock Analysis for NSE & BSE Stocks: Smart Stock Screener | BrokeNoMore',
    description:
      'Research 6,000+ NSE and BSE stocks with AI. Get personalized equity reports, key valuation ratios, and AI insights.',
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Stock Analysis for NSE & BSE Stocks | BrokeNoMore',
    description:
      'Analyze 6,000+ NSE & BSE stocks with AI. Personalized stock reports, valuation metrics, and market insights.',
  },
};

const STOCKS_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/features/stocks#app`,
      name: 'BrokeNoMore AI Stock Analysis & Screener',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Android, iOS, Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description:
        'AI-powered equity research tool for 6,000+ NSE and BSE listed stocks in India. Instant valuation, health checks, and goal-oriented AI reports.',
      featureList: [
        'Coverage of 6,000+ NSE and BSE Indian equities',
        'Personalized AI investment reports based on risk and time horizon',
        'Key financial metrics: P/E, P/B, ROE, ROCE, debt-to-equity, and earnings growth',
        'Technical indicators and sentiment tracking',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/features/stocks#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE_URL}/features` },
        { '@type': 'ListItem', position: 3, name: 'AI Stock Analysis', item: `${SITE_URL}/features/stocks` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/features/stocks#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does AI stock analysis work in BrokeNoMore?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'BrokeNoMore analyzes quarterly reports, price history, profitability, balance sheet ratios, and market trends across 6,000+ NSE and BSE companies to synthesize an objective, easy-to-read AI report.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can BrokeNoMore tailor stock analysis to my personal investment goals?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. You can select your investment timeframe (short-term, swing, multi-year) and risk appetite to generate customized bull and bear cases for any stock.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does BrokeNoMore cover both Nifty and Sensex listed companies?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. BrokeNoMore covers over 6,000 companies listed on the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE), including large-cap, mid-cap, and small-cap equities.',
          },
        },
      ],
    },
  ],
};

// Stock Analysis & AI: the AI core, Explore, a stock's page, the six questions and the report
export default function StocksFeaturePage() {
  return (
    <FeaturePageShell slug="stocks">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STOCKS_STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <StockAISection />
    </FeaturePageShell>
  );
}
