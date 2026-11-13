// The features, each with its own page under /features. The navbar's Features menu and the
// /features overview are both built from this list, so a new feature only needs adding here (and
// its page).
export type FeaturePage = {
  slug: string;
  href: string;
  name: string;
  blurb: string;
  icon: 'stocks' | 'split' | 'bills' | 'loan';
  accent: string;
};

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: 'stocks',
    href: '/features/stocks',
    name: 'Stock Analysis & AI',
    blurb: 'Explore 6,000+ stocks and get an AI report built for your goal.',
    icon: 'stocks',
    accent: '#6E5BFF',
  },
  {
    slug: 'split',
    href: '/features/split',
    name: 'Split & Share',
    blurb: 'Split any bill equally or Dutch, straight from a photo of it.',
    icon: 'split',
    accent: '#E86AB4',
  },
  {
    slug: 'bills',
    href: '/features/bills',
    name: 'Bills & Subscriptions',
    blurb: 'Every bill on one calendar: paid, overdue and coming up.',
    icon: 'bills',
    accent: '#22C55E',
  },
  {
    slug: 'loan',
    href: '/features/loan',
    name: 'Loan Planner',
    blurb: 'Track your EMIs and see how prepaying closes loans faster.',
    icon: 'loan',
    accent: '#F5A524',
  },
];
