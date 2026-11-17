import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import SplitSection from '@/components/splitPage/SplitSection';
import { SITE_NAME, SITE_URL, SPLIT_KEYWORDS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Split Bills with Friends: Free Bill Splitter & Receipt Scanner App',
  description:
    'Split any bill equally or Dutch with friends. Snap a photo of the receipt, tag who had what, and BrokeNoMore instantly calculates everyone’s share and settles group balances. Free Splitwise alternative for India.',
  keywords: SPLIT_KEYWORDS,
  alternates: { canonical: '/features/split' },
  openGraph: {
    url: '/features/split',
    title: 'Split Bills with Friends: Free Bill Splitter & Receipt Scanner App | BrokeNoMore',
    description:
      'Split any bill equally or Dutch with friends. Snap a photo of the receipt, tag who had what, and BrokeNoMore instantly calculates everyone’s share and settles group balances.',
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split Bills with Friends: Free Bill Splitter & Receipt Scanner App',
    description:
      'Split any bill equally or Dutch with friends. Snap a photo of the receipt, tag who had what, and settle group balances instantly.',
  },
};

const SPLIT_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/features/split#app`,
      name: 'BrokeNoMore Bill Splitter & Receipt Scanner',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Android, iOS, Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description:
        'Split any bill equally or item-by-item from a receipt photo. Settle group balances easily with friends, roommates, and travel groups.',
      featureList: [
        'OCR Receipt Scanner: photograph any bill to parse line items',
        'Equal splitting or Dutch item assignment',
        'Custom tax and tip distribution',
        'Multi-person group balances and settlement tracker',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/features/split#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE_URL}/features` },
        { '@type': 'ListItem', position: 3, name: 'Split & Share Bills', item: `${SITE_URL}/features/split` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/features/split#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I split bills with friends using BrokeNoMore?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Take a photo of your restaurant or shopping bill. BrokeNoMore reads each item automatically via OCR. You can assign each item to specific people or split everything equally with one tap.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can BrokeNoMore split restaurant taxes, service charges and tips proportionally?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. BrokeNoMore automatically apportions GST, VAT, service charges, discounts, and tips proportionally across only the items ordered by each person.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is BrokeNoMore a free alternative to Splitwise in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! BrokeNoMore provides completely free bill splitting, receipt scanning, and group balance tracking with no daily transaction limits.',
          },
        },
      ],
    },
  ],
};

// Split & Share: the bill in 3D, then the whole feature, screen by screen, as you scroll
export default function SplitFeaturePage() {
  return (
    <FeaturePageShell slug="split">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SPLIT_STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <SplitSection />
    </FeaturePageShell>
  );
}
