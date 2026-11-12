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

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-[#080808] overflow-x-hidden">
      <noscript>
        <style>{`.hero-intro-pending { visibility: visible; }`}</style>
      </noscript>

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
        <h1 data-hero-title className="hero-intro-pending text-[26px] xs:text-3xl sm:text-5xl md:text-6xl font-semibold text-white text-center tracking-tight leading-[1.2] max-w-5xl drop-shadow-sm">
          <span className="block sm:whitespace-nowrap"><span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="inline-block">Managing</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="inline-block">Your</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="inline-block">Money</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="inline-block">Has</span></span></span>
          <span className="block sm:whitespace-nowrap"><span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="inline-block">Never</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="inline-block">Been</span></span>{' '}<span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom"><span data-hero-word className="inline-block">Easier.</span></span></span>
        </h1>

        {/* Subtext */}
        <p data-hero-sub className="hero-intro-pending mt-4 sm:mt-5 max-w-3xl text-center text-balance text-sm xs:text-base sm:text-lg md:text-xl text-neutral-300 tracking-wide px-2">
          Your all-in-one financial tracking app. Save, split, invest and plan, all in one place.
        </p>

        {/* Action Buttons */}
        <div data-hero-actions className="hero-intro-pending flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-7 pointer-events-auto w-full max-w-xs xs:max-w-none">
          {/* Download Android Button */}
          <button
            data-hero-btn-android
            type="button"
            className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full border border-white text-white text-xs sm:text-sm font-medium hover:bg-white/10 active:scale-95 transition-colors duration-200 cursor-pointer backdrop-blur-[2px] w-full xs:w-auto"
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
          </button>

          {/* Download iOS Button */}
          <button
            data-hero-btn-ios
            type="button"
            className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-white text-black text-xs sm:text-sm font-medium hover:bg-neutral-200 active:scale-95 transition-colors duration-200 shadow-md cursor-pointer w-full xs:w-auto"
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
          </button>
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


        {/* The split story lives on the Features page (app/features/page.tsx) */}
        {/* <div className="w-full mt-16 lg:mt-24 pointer-events-auto" suppressHydrationWarning>
          <FeatureShowcase part="split" />
        </div> */}
      </div>
    </main>
  );
}
