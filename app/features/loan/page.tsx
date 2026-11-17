import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import LoanTowers from '@/components/loanPage/LoanTowers';
import { LOAN_KEYWORDS, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Loan Planner & EMI Prepayment Calculator: Pay Off Loans Faster & Save Interest',
  description:
    'Track home, car, and personal loans, calculate exact interest savings with extra prepayments, and discover the fastest path to debt freedom with the BrokeNoMore loan planner.',
  keywords: LOAN_KEYWORDS,
  alternates: { canonical: '/features/loan' },
  openGraph: {
    url: '/features/loan',
    title: 'Loan Planner & EMI Prepayment Calculator | BrokeNoMore',
    description:
      'Track every loan and EMI, simulate extra prepayments, and see how much interest and time you save with BrokeNoMore.',
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Loan Planner & EMI Prepayment Calculator: Pay Off Loans Early',
    description:
      'Plan loan prepayments, view interest amortization schedules, and become debt-free faster with BrokeNoMore.',
  },
};

const LOAN_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/features/loan#app`,
      name: 'BrokeNoMore Loan Planner & EMI Prepayment Calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Android, iOS, Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description:
        'Interactive loan planner that simulates prepayments, calculates interest savings, and builds customized loan closure roadmaps for Indian borrowers.',
      featureList: [
        'Multi-loan tracking: Home loans, car loans, education loans, and personal loans',
        'Prepayment simulator: One-time lump sum or recurring extra monthly payments',
        'Amortization schedules showing principal vs. interest breakdown',
        'Comparison of loan tenure reduction vs. EMI reduction',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/features/loan#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE_URL}/features` },
        { '@type': 'ListItem', position: 3, name: 'Loan Planner', item: `${SITE_URL}/features/loan` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/features/loan#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does loan prepayment reduce total loan interest?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'When you make a prepayment, 100% of the extra amount directly reduces your outstanding loan principal. Because interest is calculated on the remaining balance, prepaying early drastically slashes overall interest costs.',
          },
        },
        {
          '@type': 'Question',
          name: 'Should I choose to reduce EMI or reduce loan tenure when prepaying?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Reducing loan tenure generally saves significantly more total interest because your principal amortizes much faster over fewer months. Reducing EMI provides monthly cash flow relief while keeping the repayment period constant.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I track multiple loans simultaneously in BrokeNoMore?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! You can log all your active loans (home, car, student, and personal), view upcoming EMI dates on your calendar, and model prepayment strategies for each.',
          },
        },
      ],
    },
  ],
};

// The Loan Planner, worked out on a desk calculator
export default function LoanFeaturePage() {
  return (
    <FeaturePageShell slug="loan">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOAN_STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <LoanTowers />
    </FeaturePageShell>
  );
}
