import Scanner from '@/components/Scanner';
import Navbar from './components/Navbar';
import FeatureShowcase from '@/components/FeatureShowcase';
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
    <main className="relative min-h-screen w-full bg-[#080808] overflow-x-hidden">
<<<<<<< HEAD
=======
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
      />
      <noscript>
        <style>{`.hero-intro-pending { visibility: visible; }`}</style>
      </noscript>
>>>>>>> 87acbd1cfc3d53fda9956a0a6a76193b1e656969

      {/* Background Interactive Scanner */}
      <div data-bg-scanner className="fixed inset-0 w-full h-full pointer-events-auto">
        <Scanner
          color1="#5227FF"
          color2="#FF9FFC"
          color3="#FFFFFF"
          speed={0.35}
          sweepSpeed={0.05}
          sweepWidth={4}
          trail={0.5}
          ripple={1}
          bandDensity={11}
          glow={0.6}
          scanDirection="vertical"
          colorSpread={0.7}
          scanline
          scanlineIntensity={0.5}
          mouseInteraction
          clickEffect="ping"
          reverse={false}
          scale={1.5}
          frequency={1.05}
          lineWidth={0.7}
          brightness={1}
          vignette={0.3}
          grain
          grainIntensity={0.04}
          opacity={1}
          mouseMode="repel"
          mouseRadius={0.5}
          mouseStrength={0.7}
          intro
          lightMode={false}
        />
      </div>

      {/* Fades in on scroll to turn the background plain black behind the showcase and credit cards */}
      <div data-bg-fade className="fixed inset-0 bg-black opacity-0 pointer-events-none" aria-hidden="true" />

      {/* Sticky/Fixed Animated Navbar */}
      {/* (Fades out once SafeGold begins; see SafeGoldSection) */}
      <div data-site-nav>
        <Navbar />
      </div>

      {/* Hero & Interactive 3D Showcase Content Layer */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 pointer-events-none select-none">
        {/* First screen: title and buttons centred on screen (bottom padding mirrors the layer's top padding) */}
        <div data-hero-panel className="w-full flex flex-col items-center justify-center min-h-[calc(100svh-5rem)] pb-16 xs:pb-20 sm:min-h-[calc(100svh-6rem)] sm:pb-24 md:min-h-[calc(100svh-7rem)] md:pb-28">
        {/* Title */}
        <h1 data-hero-title className="text-[26px] xs:text-3xl sm:text-5xl md:text-6xl font-semibold text-white text-center tracking-tight leading-[1.2] max-w-5xl drop-shadow-sm">
          <span className="block sm:whitespace-nowrap"><span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="hero-word inline-block" style={{ animationDelay: '0.10s' }}>Managing</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="hero-word inline-block" style={{ animationDelay: '0.17s' }}>Your</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="hero-word inline-block" style={{ animationDelay: '0.24s' }}>Money</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="hero-word inline-block" style={{ animationDelay: '0.31s' }}>Has</span></span></span>
          <span className="block sm:whitespace-nowrap"><span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="hero-word inline-block" style={{ animationDelay: '0.38s' }}>Never</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="hero-word inline-block" style={{ animationDelay: '0.45s' }}>Been</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="hero-word inline-block" style={{ animationDelay: '0.52s' }}>Easier.</span></span></span>
        </h1>

        {/* Subtext */}
        <p data-hero-sub className="hero-sub mt-4 sm:mt-5 max-w-3xl text-center text-balance text-sm xs:text-base sm:text-lg md:text-xl text-neutral-300 tracking-wide px-2">
          Your all-in-one financial tracking app. Save, split, invest and plan, all in one place.
        </p>

        {/* Action Buttons */}
        <div data-hero-actions className="flex flex-col items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-7 pointer-events-auto w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {/* Download Android Button */}
            <a
              data-hero-btn-android
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ animationDelay: '0.55s' }}
              className="hero-rise flex items-center justify-center gap-2 py-3 sm:py-2.5 w-[230px] sm:w-[215px] rounded-full border border-white text-white text-xs sm:text-sm font-medium hover:bg-white/10 active:scale-95 transition-colors duration-200 cursor-pointer backdrop-blur-[2px] shrink-0 whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 fill-current shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M17.523 15.341c-.55 0-.999-.448-.999-.999 0-.551.449-.999.999-.999.551 0 .999.448.999.999 0 .551-.448.999-.999.999m-11.046 0c-.551 0-.999-.448-.999-.999 0-.551.448-.999.999-.999.55 0 .999.448.999.999 0 .551-.449.999-.999.999m11.405-6.02 1.997-3.46a.416.416 0 0 0-.152-.567.416.416 0 0 0-.568.152L17.135 8.95C15.59 8.412 13.853 8 12 8s-3.59.412-5.137 1.15L4.841 5.648a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.568l1.997 3.459C2.689 11.187 0 14.777 0 19h24c0-4.223-2.689-7.813-6.118-9.679" />
              </svg>
              <span>Download Android</span>
              <span className="sr-only"> (BrokeNoMore on Google Play, opens in a new tab)</span>
            </a>

            {/* Download iOS Button */}
            <a
              data-hero-btn-ios
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ animationDelay: '0.65s' }}
              className="hero-rise flex items-center justify-center gap-2 py-3 sm:py-2.5 w-[230px] sm:w-[215px] rounded-full bg-white text-black text-xs sm:text-sm font-medium hover:bg-neutral-200 active:scale-95 transition-colors duration-200 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 fill-current shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.06 1.71-.93 2.74 1 .08 2.01-.49 2.63-1.24z" />
              </svg>
              <span>Download iOS</span>
              <span className="sr-only"> (BrokeNoMore on the App Store, opens in a new tab)</span>
            </a>
          </div>

          {/* Connect to Partner Link */}
          <a
            data-hero-btn-partner
            href="#partner"
            style={{ animationDelay: '0.8s' }}
            className="hero-rise group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white transition-colors duration-200 cursor-pointer pt-0.5"
          >
            <span>Connect to partner</span>
            <svg
              className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        </div>

        {/* The phone with its orbiting feature cards (the split story has its own page, /features) */}
        <div className="w-full mt-4 sm:mt-6 pointer-events-auto" suppressHydrationWarning>
          <FeatureShowcase part="orbit" />
        </div>

        {/* Hubble offers: gift card discounts on 400+ brands. The navbar fades out from here on */}
        <div data-nav-hides-here className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] mt-10 pointer-events-auto">
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
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <SponsorshipSection />
        </div>

        {/* Get in Touch: a support ticket that opens in the visitor's mail app */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <ContactSection />
        </div>

        {/* FAQs: answers to common questions about BrokeNoMore */}
        <div className="-mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] pointer-events-auto">
          <FAQSection />
        </div>


        {/* The split story lives on the Features page (app/features/page.tsx) */}
        {/* <div className="w-full mt-16 lg:mt-24 pointer-events-auto" suppressHydrationWarning>
          <FeatureShowcase part="split" />
        </div> */}
      </div>
    </main>
  );
}
