// The site's address and the details search engines and link previews read (app/layout.tsx,
// app/sitemap.ts, the structured data on the home page). Kept in one place so they agree.

export const SITE_URL = 'https://brokenomore.in';
export const SITE_NAME = 'BrokeNoMore';

// The app backend that holds the admin-managed content (credit cards, festivals, feature slides, FAQs): the admin
// panel edits it and the homepage FAQ reads it. NEXT_PUBLIC_CMS_API_URL overrides it (e.g. localhost:8000 in
// development). Staging and production backends share the same content storage, so either works here.
export const CMS_API_URL = (
  process.env.NEXT_PUBLIC_CMS_API_URL || 'https://staging-broke-no-more-448142641323.asia-south1.run.app'
).replace(/\/$/, '');

export const SITE_TITLE = 'BrokeNoMore';
export const SITE_DESCRIPTION =
  'BrokeNoMore is a free personal finance app for India. Track expenses and budgets, split bills with friends, buy digital gold, analyse NSE and BSE stocks with AI, plan loans and EMIs, track bills and subscriptions, and file ITR, all in one place.';

export const SITE_KEYWORDS = [
  'BrokeNoMore',
  'Broke No More',
  'BNM app',
  'personal finance app India',
  'best expense tracker app india',
  'money manager app india',
  'daily expense tracker free',
  'budget planner india',
  'income and expense manager',
  'split bills app',
  'bill splitter with friends',
  'split expenses equally or dutch',
  'splitwise alternative free india',
  'scan receipt bill split ocr',
  'digital gold india',
  'buy 24k digital gold',
  'SafeGold partner app',
  'start gold savings 10 rupees',
  'gold accumulation plan india',
  'AI stock analysis',
  'stock analysis app india',
  'NSE BSE stock screener',
  'ai equity research tool',
  'stock recommendation app india',
  'mutual fund research',
  'loan planner app',
  'loan prepayment calculator',
  'home loan emi prepayment savings',
  'close loan faster india',
  'bill reminder app',
  'subscription tracker india',
  'upcoming bill due date calendar',
  'financial calculators india',
  'EMI calculator',
  'SIP calculator',
  'lumpsum calculator',
  'SWP calculator',
  'FD calculator',
  'PPF calculator',
  'file ITR online Quicko',
  'gift card offers Hubble',
  'credit card rewards cashback tracker',
  'financial health score',
];

export const SPLIT_KEYWORDS = [
  'split bills app',
  'bill splitter',
  'split bills with friends',
  'splitwise alternative india',
  'split expenses with friends',
  'group expense tracker',
  'split dinner bill',
  'trip expense sharing app',
  'roommate bill splitter',
  'dutch bill calculator',
  'receipt scanner bill splitter',
  'ocr receipt split app',
  'free splitwise alternative',
];

export const STOCKS_KEYWORDS = [
  'AI stock analysis',
  'stock analysis app india',
  'NSE BSE stocks',
  'ai stock screener india',
  'stock research tool',
  'ai financial analyst',
  'fundamental stock analysis india',
  'technical analysis stocks',
  'indian stock market ai tool',
  'best stocks to buy in india',
  'portfolio tracker india',
  'nifty 50 sensex stock research',
];

export const LOAN_KEYWORDS = [
  'loan planner',
  'loan prepayment calculator',
  'home loan prepayment calculator',
  'close loan faster',
  'save loan interest with prepayments',
  'reduce loan tenure calculator',
  'car loan prepayment',
  'personal loan emi planner',
  'loan amortization schedule india',
  'extra emi payment savings calculator',
];

export const BILLS_KEYWORDS = [
  'bill reminder app',
  'subscription tracker india',
  'track recurring bills',
  'bill payment reminder calendar',
  'never miss due date bill manager',
  'utility bill tracker',
  'credit card bill reminder',
  'netflix spotify subscription manager',
  'avoid late payment charges bills',
];

export const CALCULATORS_KEYWORDS = [
  'financial calculators india',
  'free online finance calculators',
  'EMI calculator',
  'home loan emi calculator',
  'SIP calculator mutual funds',
  'monthly sip return calculator',
  'lumpsum investment calculator',
  'SWP calculator systematic withdrawal',
  'FD calculator fixed deposit interest',
  'PPF calculator 15 years interest',
  'maturity value calculator india',
];

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.bnm.broke_no_more';

// Where /download (the app's invite link) sends Android users.
// INTERNAL TESTING: the Play Console internal-test opt-in link. Only testers on the
// internal-test list can install from it. When the build goes to production, set this
// back to PLAY_STORE_URL.
export const ANDROID_INVITE_DOWNLOAD_URL = 'https://play.google.com/apps/internaltest/4701179351539799933';

export const APP_STORE_URL = 'https://apps.apple.com/in/app/brokenomore/id6756296299';

// Where /download (the app's invite link) sends iPhone/iPad users.
// TESTFLIGHT TESTING: the TestFlight public link. When the build goes to production, set this
// back to APP_STORE_URL.
export const IOS_INVITE_DOWNLOAD_URL = 'https://testflight.apple.com/join/taTMfTbF';
export const SUPPORT_EMAIL = 'support@brokenomore.in';
