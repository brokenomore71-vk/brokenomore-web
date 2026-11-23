import Image from 'next/image';
import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="w-full bg-[#050505] text-white border-t border-white/[0.08] relative z-20 pointer-events-auto select-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12">
        {/* Top Brand Header */}
        <div className="pb-12 border-b border-white/[0.08]">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <Image
              src="/assets/images/main_logo.png"
              alt="BrokeNoMore Logo"
              width={42}
              height={42}
              className="object-contain rounded-full border border-white/10 group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-bold tracking-tight text-white">BrokeNoMore</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400 max-w-md">
            India&apos;s all-in-one personal finance platform. Save, split, invest and plan your money with confidence.
          </p>
        </div>

        {/* Link Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 py-14">
          {/* Column 1: FEATURES */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-200 mb-4">
              Features
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/features/stocks" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Stock Analysis &amp; AI
                </Link>
              </li>
              <li>
                <Link href="/features/split" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Split &amp; Share
                </Link>
              </li>
              <li>
                <Link href="/features/bills" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Bills &amp; Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/features/loan" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Loan Planner
                </Link>
              </li>
              <li>
                <Link href="/features/calculators" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Financial Calculators
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: CALCULATORS */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-200 mb-4">
              Calculators
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/features/calculators/emi" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Loan EMI Calculator
                </Link>
              </li>
              <li>
                <Link href="/features/calculators/sip" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  SIP Calculator
                </Link>
              </li>
              <li>
                <Link href="/features/calculators/lumpsum" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Lumpsum Calculator
                </Link>
              </li>
              <li>
                <Link href="/features/calculators/swp" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  SWP Calculator
                </Link>
              </li>
              <li>
                <Link href="/features/calculators/fd" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  FD Calculator
                </Link>
              </li>
              <li>
                <Link href="/features/calculators/ppf" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  PPF Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: COMPANY */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-200 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  About BrokeNoMore
                </Link>
              </li>
              <li>
                <Link href="/#partner" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Partner with Us
                </Link>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: RESOURCES */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-200 mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#file-itr" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Tax Filing
                </Link>
              </li>
              <li>
                <Link href="/#hubble" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Brand Rewards &amp; Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/#cards" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Credit Card Perks
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar: Copyright on left, legal links moved from navbar on right */}
        <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p className="tracking-wide text-neutral-400">
            copyright &copy; 2026 bnm wealthplay pvt.ltd.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/privacy"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              privacy policy
            </Link>
            <span className="text-neutral-600" aria-hidden="true">|</span>
            <Link
              href="/terms"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              terms and conditions
            </Link>
            <span className="text-neutral-600" aria-hidden="true">|</span>
            <Link
              href="/delete-account"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              delete account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
