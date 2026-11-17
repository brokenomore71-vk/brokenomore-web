import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FeaturePageShell from '@/components/FeaturePageShell';
import { CalculatorPage } from '@/components/calculatorsPage/CalculatorsHub';
import { CALCULATORS, type CalcKey } from '@/lib/calculators';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ calc: c.key }));
}

interface CalcSEOData {
  title: string;
  description: string;
  keywords: string[];
  faqs: { question: string; answer: string }[];
}

const CALC_SEO: Record<CalcKey, CalcSEOData> = {
  emi: {
    title: 'Loan EMI Calculator: Home, Car & Personal Loan Monthly EMI Calculator',
    description:
      'Free online EMI calculator for India. Calculate monthly EMI, total interest payable, and inspect detailed year-by-year principal amortization schedules for home, car, and personal loans.',
    keywords: [
      'emi calculator',
      'loan emi calculator',
      'home loan emi calculator',
      'car loan emi calculator',
      'personal loan emi calculator',
      'online emi calculator india',
      'emi calculation formula',
      'loan interest calculator',
      'reducing balance emi calculator',
    ],
    faqs: [
      {
        question: 'How is monthly loan EMI calculated?',
        answer:
          'EMI is calculated using the standard formula: EMI = P × r × (1 + r)ⁿ / ((1 + r)ⁿ - 1), where P is loan principal, r is monthly interest rate (annual rate ÷ 12 ÷ 100), and n is loan duration in months.',
      },
      {
        question: 'Does this EMI calculator support home, car, and personal loans?',
        answer:
          'Yes! The calculator dynamically models any loan type across flexible amounts (up to ₹1 Crore+), interest rates (1% to 30%), and tenures (1 to 30 years).',
      },
      {
        question: 'Why are early EMIs mostly interest and later EMIs mostly principal?',
        answer:
          'Because interest is computed on the outstanding principal balance. In the beginning, the balance is large, so interest consumes most of the EMI. As principal decreases over time, each subsequent payment repays more principal.',
      },
    ],
  },
  sip: {
    title: 'SIP Calculator: Monthly Mutual Fund SIP Returns & Compounding Calculator',
    description:
      'Calculate estimated returns and final maturity wealth for monthly mutual fund SIP investments. Visualize compounding growth year-by-year with BrokeNoMore.',
    keywords: [
      'sip calculator',
      'mutual fund sip calculator',
      'monthly sip return calculator',
      'sip compounding calculator',
      'best sip calculator india',
      'equity sip returns',
      'systematic investment plan calculator',
      'sip wealth calculator',
    ],
    faqs: [
      {
        question: 'How does a mutual fund Systematic Investment Plan (SIP) work?',
        answer:
          'A SIP invests a fixed amount into mutual funds at regular monthly intervals. It takes advantage of rupee-cost averaging (buying more units when prices dip) and compound growth over the long run.',
      },
      {
        question: 'What is the formula used in this SIP calculator?',
        answer:
          'Future Value (FV) is computed using: FV = P × [((1 + i)ⁿ - 1) / i] × (1 + i), where P is monthly deposit, i is effective monthly interest rate, and n is total months.',
      },
      {
        question: 'Can I change the expected annual return rate on the SIP calculator?',
        answer:
          'Yes, you can adjust the expected return slider from 1% up to 30% to model conservative, balanced, or aggressive equity mutual fund portfolios.',
      },
    ],
  },
  lumpsum: {
    title: 'Lumpsum Calculator: Mutual Fund One-Time Investment Returns Calculator',
    description:
      'Estimate wealth growth and maturity value on one-time lumpsum mutual fund investments. Compare invested principal against estimated returns with interactive compounding charts.',
    keywords: [
      'lumpsum calculator',
      'one time mutual fund investment calculator',
      'lump sum returns calculator',
      'compound interest lumpsum investment india',
      'mutual fund lumpsum growth calculator',
    ],
    faqs: [
      {
        question: 'What is a lumpsum investment in mutual funds?',
        answer:
          'A lumpsum investment is a single, one-time capital deposit into an equity, debt, or hybrid mutual fund scheme rather than staggered monthly contributions.',
      },
      {
        question: 'How is lumpsum compound growth calculated?',
        answer:
          'Lumpsum maturity uses annual compounding: FV = P × (1 + R/100)ʸ, where P is initial deposit, R is expected annual return rate, and Y is investment horizon in years.',
      },
    ],
  },
  swp: {
    title: 'SWP Calculator: Systematic Withdrawal Plan & Monthly Pension Calculator',
    description:
      'Calculate regular monthly cash payouts and remaining fund corpus from mutual funds with our free Systematic Withdrawal Plan (SWP) calculator. Ideal for retirement planning.',
    keywords: [
      'swp calculator',
      'systematic withdrawal plan calculator',
      'monthly income mutual funds',
      'mutual fund swp calculator india',
      'retirement withdrawal calculator',
      'swp tax efficient income calculator',
    ],
    faqs: [
      {
        question: 'What is a Systematic Withdrawal Plan (SWP)?',
        answer:
          'An SWP allows you to withdraw a fixed predetermined amount from your mutual fund investment every month, while the remaining balance continues to generate market returns.',
      },
      {
        question: 'Why is SWP popular for retirement income in India?',
        answer:
          'SWP provides predictable monthly cash flow with superior tax efficiency compared to traditional bank FD interest or mutual fund dividend plans, as only the capital gains portion of each withdrawal is taxed.',
      },
    ],
  },
  fd: {
    title: 'FD Calculator: Fixed Deposit Interest & Quarterly Compounding Calculator',
    description:
      'Calculate bank fixed deposit (FD) maturity values and total interest earned with quarterly compounding. Compare bank FD rates and plan risk-free guaranteed savings.',
    keywords: [
      'fd calculator',
      'fixed deposit calculator',
      'bank fd interest calculator',
      'quarterly compounding fd calculator',
      'fixed deposit maturity value india',
      'post office fd calculator',
    ],
    faqs: [
      {
        question: 'How is interest compounded on bank fixed deposits in India?',
        answer:
          'Indian banks compound FD interest on a quarterly basis using the formula: A = P × (1 + R/400)^(4 × Y), where P is principal, R is annual interest rate, and Y is tenure in years.',
      },
      {
        question: 'Does this FD calculator account for quarterly compounding?',
        answer:
          'Yes! Unlike simple interest calculators, BrokeNoMore uses quarterly compound interest matching the official interest schedules of SBI, HDFC, ICICI, and Axis Bank.',
      },
    ],
  },
  ppf: {
    title: 'PPF Calculator: Public Provident Fund 15-Year Maturity & Tax-Free Returns',
    description:
      'Calculate 15-year Public Provident Fund (PPF) maturity value, yearly interest accumulation, and tax savings under Section 80C EEE status with BrokeNoMore.',
    keywords: [
      'ppf calculator',
      'public provident fund calculator',
      'ppf interest calculator',
      'ppf 15 year maturity calculator',
      'section 80c tax free savings ppf',
      'government ppf scheme calculator',
    ],
    faqs: [
      {
        question: 'What is the maximum investment allowed in a PPF account per financial year?',
        answer:
          'You can invest between ₹500 and ₹1,50,000 per financial year in a Public Provident Fund (PPF) account to claim tax deductions under Section 80C.',
      },
      {
        question: 'What does EEE tax status mean for PPF?',
        answer:
          'PPF qualifies for Exempt-Exempt-Exempt (EEE) status: the deposit is tax-deductible under 80C, the interest accrued each year is 100% tax-free, and the entire maturity proceeds at 15 years are completely exempt from income tax.',
      },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ calc: string }> }): Promise<Metadata> {
  const { calc } = await params;
  const c = CALCULATORS.find((x) => x.key === calc);
  if (!c) return {};
  const path = `/features/calculators/${c.key}`;
  const seo = CALC_SEO[c.key as CalcKey] || {
    title: `${c.name} Calculator | BrokeNoMore`,
    description: c.blurb,
    keywords: [c.name, `${c.name} calculator`, 'financial calculator india'],
    faqs: [],
  };

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: `${seo.title} | BrokeNoMore`,
      description: seo.description,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function CalculatorRoute({ params }: { params: Promise<{ calc: string }> }) {
  const { calc } = await params;
  const c = CALCULATORS.find((x) => x.key === calc);
  if (!c) notFound();

  const seo = CALC_SEO[c.key as CalcKey];
  const path = `/features/calculators/${c.key}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}${path}#app`,
        name: `BrokeNoMore ${c.name} Calculator`,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Android, iOS, Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        description: seo?.description || c.blurb,
        featureList: [
          'Instant interactive slider calculation',
          'Dynamic donut chart for principal vs. returns breakdown',
          'Year-by-year maturity table and amortization projection',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}${path}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Financial Calculators', item: `${SITE_URL}/features/calculators` },
          { '@type': 'ListItem', position: 3, name: `${c.name} Calculator`, item: `${SITE_URL}${path}` },
        ],
      },
      ...(seo?.faqs && seo.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${SITE_URL}${path}#faq`,
              mainEntity: seo.faqs.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: { '@type': 'Answer', text: f.answer },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <FeaturePageShell slug="calculators">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <CalculatorPage k={calc as CalcKey} />
    </FeaturePageShell>
  );
}
