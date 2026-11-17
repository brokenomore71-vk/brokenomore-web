import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import CalculatorsHub from '@/components/calculatorsPage/CalculatorsHub';
import { CALCULATORS_KEYWORDS, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Free Financial Calculators: Online EMI, SIP, Lumpsum, SWP, FD & PPF Calculators',
  description:
    'Free online financial calculators for India. Calculate monthly loan EMIs, mutual fund SIP and lumpsum returns, SWP retirement payouts, fixed deposit interest, and 15-year PPF maturity values with visual breakdown charts.',
  keywords: CALCULATORS_KEYWORDS,
  alternates: { canonical: '/features/calculators' },
  openGraph: {
    url: '/features/calculators',
    title: 'Free Financial Calculators: EMI, SIP, Lumpsum, SWP, FD & PPF | BrokeNoMore',
    description:
      'Free online financial calculators for India. Calculate EMIs, SIPs, Lumpsum, SWP, FD, and PPF returns with instant charts and breakdown tables.',
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Financial Calculators: Online EMI, SIP, Lumpsum, SWP, FD & PPF',
    description:
      'Calculate EMIs, SIP returns, lumpsum growth, SWP, FD, and PPF maturity with interactive charts and amortization schedules.',
  },
};

const CALCULATORS_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/features/calculators#app`,
      name: 'BrokeNoMore Financial Calculators Suite',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Android, iOS, Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description:
        'Comprehensive suite of online financial calculators: Home loan EMI, mutual fund SIP, lumpsum, SWP, quarterly compounded FD, and PPF maturity calculators.',
      featureList: [
        'EMI Calculator: Monthly payments, principal vs. interest split, amortization table',
        'SIP Calculator: Compounded mutual fund returns with year-by-year growth',
        'Lumpsum Calculator: One-time investment growth with inflation adjustments',
        'SWP Calculator: Systematic withdrawal plan for monthly post-retirement income',
        'FD Calculator: Quarterly compounded bank fixed deposit maturity value',
        'PPF Calculator: 15-year government Public Provident Fund tax-free returns',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/features/calculators#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Financial Calculators', item: `${SITE_URL}/features/calculators` },
      ],
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/features/calculators#list`,
      name: 'BrokeNoMore Financial Calculators',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'EMI Calculator', url: `${SITE_URL}/features/calculators/emi` },
        { '@type': 'ListItem', position: 2, name: 'SIP Calculator', url: `${SITE_URL}/features/calculators/sip` },
        { '@type': 'ListItem', position: 3, name: 'Lumpsum Calculator', url: `${SITE_URL}/features/calculators/lumpsum` },
        { '@type': 'ListItem', position: 4, name: 'SWP Calculator', url: `${SITE_URL}/features/calculators/swp` },
        { '@type': 'ListItem', position: 5, name: 'FD Calculator', url: `${SITE_URL}/features/calculators/fd` },
        { '@type': 'ListItem', position: 6, name: 'PPF Calculator', url: `${SITE_URL}/features/calculators/ppf` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/features/calculators#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Are all financial calculators on BrokeNoMore completely free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! All calculators (EMI, SIP, Lumpsum, SWP, FD, PPF) are 100% free with no registration or download required. You can adjust sliders and inspect instant visual charts.',
          },
        },
        {
          '@type': 'Question',
          name: 'How accurate are the SIP and EMI calculations?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our calculators use standard banking and financial mathematics formulas, including monthly reducing balance for EMIs, monthly compounding for SIPs, and quarterly compounding for FDs, matching official bank figures.',
          },
        },
      ],
    },
  ],
};

// The app's six calculators: a grid of cards, each opening its own calculator
export default function CalculatorsFeaturePage() {
  return (
    <FeaturePageShell slug="calculators">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(CALCULATORS_STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <CalculatorsHub />
    </FeaturePageShell>
  );
}
