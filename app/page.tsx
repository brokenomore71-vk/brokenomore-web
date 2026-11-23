import Navbar from './components/Navbar';
import PredictiveProsperityHero from '@/components/PredictiveProsperityHero';
import CreditCardSection from '@/components/CreditCardSection';
import SafeGoldSection from '@/components/safeGold/SafeGoldSection';
// The 3D Hubble vault/terminal story is kept in components/hubble/HubbleSection.tsx, switched off
// in favour of the flat Hubble offers panel
// import HubbleSection from '@/components/hubble/HubbleSection';
import HubbleOffers from '@/components/hubble/HubbleOffers';
import QuickoSection from '@/components/quicko/QuickoSection';
import SponsorshipSection from '@/components/SponsorshipSection';
import ContactSection from '@/components/ContactSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import SectionStops from '@/components/SectionStops';
import type { Metadata } from 'next';
import { FAQ_CATEGORIES } from '@/lib/faqData';
import { APP_STORE_URL, PLAY_STORE_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

// What search engines read about the site, the app and the FAQ (schema.org structured data).
// Not shown on the page.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: ['Broke No More', 'BNM'],
      url: SITE_URL,
      logo: `${SITE_URL}/assets/images/main_logo.png`,
      email: SUPPORT_EMAIL,
      sameAs: [PLAY_STORE_URL, APP_STORE_URL],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/features/calculators/{search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
      ],
    },
    {
      '@type': 'MobileApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
      alternateName: 'Broke No More',
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      operatingSystem: 'Android, iOS',
      applicationCategory: 'FinanceApplication',
      installUrl: [PLAY_STORE_URL, APP_STORE_URL],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1420',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        'Expense and income tracking with budgets',
        'Split bills with friends, equally or by item',
        'Buy, grow, withdraw and sell digital gold',
        'AI stock analysis for NSE and BSE stocks',
        'Loan and EMI planner with prepayment',
        'Bill and subscription reminders',
        'EMI, SIP, Lumpsum, SWP, FD and PPF calculators',
        'File ITR with Quicko',
        'Gift card offers with Hubble',
      ],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: FAQ_CATEGORIES.flatMap((category) =>
        category.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        }))
      ),
    },
  ],
};

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-black overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />

      {/* Fast scrolls stop at the top of each of the last sections instead of flying past them */}
      <SectionStops />

      {/* Sticky/Fixed Animated Navbar */}
      <div data-site-nav className="relative z-[100]">
        {/* Hidden on first open; it slides in with the hero's first scroll (the headline growing and
            the phone tilting) */}
        <Navbar hideAtTop />
      </div>

      {/* Predictive Prosperity: cinematic scroll-triggered hero */}
      <PredictiveProsperityHero />

      {/* Content sections */}
      <div className="relative z-10 flex flex-col items-center justify-start pb-16 sm:pb-20 px-4 sm:px-6 pointer-events-none select-none">

        {/* Hubble offers: gift card discounts on 400+ brands */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] mt-10 pointer-events-auto">
          <HubbleOffers />
        </div>

        {/* Credit cards coming out of the wallet */}
        <CreditCardSection />

        {/* SafeGold: the gold piggy bank's scroll story */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] mt-16 lg:mt-24 pointer-events-auto">
          <SafeGoldSection />
        </div>

        {/* File ITR with Quicko: the tax jobs slide past, right to left, as the page scrolls */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <QuickoSection />
        </div>

        {/* Partner with Us: sponsorships and affiliations */}
        <div data-scroll-stop className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <SponsorshipSection />
        </div>

        {/* Get in Touch: a support ticket that opens in the visitor's mail app */}
        <div data-scroll-stop className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <ContactSection />
        </div>

        {/* FAQs: answers to common questions about BrokeNoMore */}
        <div data-scroll-stop className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <FAQSection />
        </div>

        {/* Footer */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <Footer />
        </div>


        {/* The split story lives on the Features page (app/features/page.tsx) */}
        {/* <div className="w-full mt-16 lg:mt-24 pointer-events-auto" suppressHydrationWarning>
          <FeatureShowcase part="split" />
        </div> */}
      </div>
    </main>
  );
}
