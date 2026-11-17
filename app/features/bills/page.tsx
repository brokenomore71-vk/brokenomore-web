import type { Metadata } from 'next';
import FeaturePageShell from '@/components/FeaturePageShell';
import BillsFlip from '@/components/billsPage/BillsFlip';
import { BILLS_KEYWORDS, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Bill Reminder & Subscription Tracker App: Never Miss a Due Date',
  description:
    'Consolidate every utility bill, credit card payment, and subscription on one calendar. View paid, overdue, and upcoming expenses, receive timely alerts, and avoid late payment penalties with BrokeNoMore.',
  keywords: BILLS_KEYWORDS,
  alternates: { canonical: '/features/bills' },
  openGraph: {
    url: '/features/bills',
    title: 'Bill Reminder & Subscription Tracker App | BrokeNoMore',
    description:
      'Never miss a due date. BrokeNoMore puts every bill and subscription on one calendar, shows what is paid, overdue and coming up, and alerts you in advance.',
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bill Reminder & Subscription Tracker App: Never Miss a Due Date',
    description:
      'Track all recurring bills and subscriptions on one smart calendar. Timely alerts, zero late fees.',
  },
};

const BILLS_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/features/bills#app`,
      name: 'BrokeNoMore Bill Reminder & Subscription Manager',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Android, iOS, Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description:
        'Smart personal finance calendar to track, organize, and schedule payment alerts for household utilities, credit cards, rent, and digital subscriptions.',
      featureList: [
        'Interactive calendar view with status indicators (paid, due today, overdue, upcoming)',
        'Subscription audit: detect redundant or creeping recurring charges',
        'Custom notification schedules before payment deadlines',
        'Direct links and reminders for timely payment',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/features/bills#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE_URL}/features` },
        { '@type': 'ListItem', position: 3, name: 'Bills & Subscriptions', item: `${SITE_URL}/features/bills` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/features/bills#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does BrokeNoMore remind me about upcoming bill due dates?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'BrokeNoMore organizes your payment obligations on a unified calendar and sends customizable alerts (e.g., 3 days before, 1 day before, and on the due date) so you never incur late penalties.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I track monthly recurring subscriptions like Netflix, Spotify, and gym memberships?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! You can log all recurring digital subscriptions, monitor their annual costs, and track renewal dates across streaming, cloud storage, software, and fitness memberships.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does BrokeNoMore categorize bills into paid and overdue categories?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, every entry clearly displays its real-time status as Paid, Coming Up, Due Today, or Overdue, giving you complete clarity over your monthly cash outflow.',
          },
        },
      ],
    },
  ],
};

// Bills & Subscriptions: a tear-off calendar, one page a day, stopping on every day a bill is due
export default function BillsFeaturePage() {
  return (
    <FeaturePageShell slug="bills">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BILLS_STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <BillsFlip />
    </FeaturePageShell>
  );
}
