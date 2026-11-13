// Everything the Stock Analysis & AI section shows, taken from the app's Stock Analysis Planner
// screens (Explore, a stock's page, the six-step AI analysis and its report). The base figures live
// in stockStory/stockData; this adds the rest. All of it is illustrative.

export { MARKET, SEARCH, STOCK, FUNDAMENTALS, PILLARS, PRICE_SERIES, SCORE, inr, num } from '../stockStory/stockData';

export const ACCENT = '#6E5BFF';
export const GREEN = '#1FC58E';
export const RED = '#EF5350';
export const AMBER = '#E5B85C';
export const BLUE = '#38BDF8';

// A repeatable random walk, so every chart is the same on every visit
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// Company marks: monograms in the colours of each company's tile in the app
export type Mark = { text: string; ink: string; bg: string; ring?: string };
export const MARKS: Record<string, Mark> = {
  TCS: { text: 'tcs', ink: '#111', bg: '#fff', ring: '#111' },
  TEMPSENS: { text: 'TI', ink: '#e33', bg: '#111' },
  RELIANCE: { text: 'R', ink: '#fff', bg: '#c7a252' },
  HDFCBANK: { text: 'H', ink: '#fff', bg: '#1d3f8f', ring: '#e11d2e' },
  INFY: { text: 'Infosys', ink: '#fff', bg: '#1b77c5' },
  HINDUNILVR: { text: 'U', ink: '#fff', bg: '#1f36a6' },
  HINDUST: { text: 'HA', ink: '#1a8a3a', bg: '#fff' },
  HAL: { text: 'HAL', ink: '#e8711a', bg: '#fff' },
};

export const SECTORS = ['NIFTY 50', 'Banking', 'IT & Tech', 'Auto & EV', 'Energy', 'FMCG', 'Pharma'];

export const RECENT = [
  { name: 'Tata Consultancy Services', symbol: 'TCS', change: -0.9 },
  { name: 'Tempsens Instruments', symbol: 'TEMPSENS', change: -0.8 },
];

export const COLLECTIONS = [
  { tag: 'Bullish', title: 'Top Gainers Today', color: GREEN, kind: 'line' },
  { tag: 'High Yield', title: 'Bluechip Dividend Kings', color: '#F5A524', kind: 'peak' },
  { tag: 'Breakout', title: '52-Week High Breakouts', color: GREEN, kind: 'up' },
  { tag: 'Breakdown', title: '52-Week Low Breakdowns', color: RED, kind: 'down' },
] as const;

export const POPULAR = [
  { name: 'Reliance Industries Ltd.', symbol: 'RELIANCE', change: -0.82 },
  { name: 'HDFC Bank Ltd.', symbol: 'HDFCBANK', change: 1.65 },
  { name: 'Tata Consultancy Services', symbol: 'TCS', change: -0.93 },
  { name: 'Infosys Ltd.', symbol: 'INFY', change: -1.74 },
];

export const WATCHLIST = [
  { name: 'Hindustan Unilever Ltd.', symbol: 'HINDUNILVR', price: 1999.8, change: 0.14 },
  { name: 'Reliance Industries Ltd.', symbol: 'RELIANCE', price: 1412.3, change: -0.82 },
  { name: 'HDFC Bank Ltd.', symbol: 'HDFCBANK', price: 1004.6, change: 1.65 },
];

// ---- A stock's page ----

export const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as const;
// A price line for each timeframe: a trend plus noise, ending on today's price
export const PRICE_LINES: Record<(typeof TIMEFRAMES)[number], number[]> = (() => {
  const shapes: Record<string, [number, number, number]> = {
    // [seed, drift, wobble]
    '1D': [7, 0.4, 1],
    '1W': [11, -0.3, 1.4],
    '1M': [19, 0.8, 1.2],
    '3M': [23, -0.6, 1.8],
    '6M': [31, 0.2, 2.2],
    '1Y': [43, -1.1, 2.4],
    '5Y': [59, 0.9, 3],
  };
  const out = {} as Record<(typeof TIMEFRAMES)[number], number[]>;
  for (const tf of TIMEFRAMES) {
    const [seed, drift, wobble] = shapes[tf];
    const rand = seeded(seed);
    const pts: number[] = [];
    let v = 0;
    for (let i = 0; i < 90; i++) {
      v += (rand() - 0.5) * wobble + drift * 0.05 + Math.sin(i / (6 + seed % 5)) * 0.25;
      pts.push(v);
    }
    out[tf] = pts;
  }
  return out;
})();

export const PERFORMANCE = {
  today: { low: 1984, high: 2006.5, at: 0.7 },
  year: { low: 1758.2, high: 2479.6, at: 0.33 },
  stats: [
    ['Open', '2,000.00'],
    ['Prev. Close', '1,997.00'],
    ['Volume', '3,84,255'],
    ['Lower circuit', '1,797.30'],
    ['Upper circuit', '2,196.70'],
  ] as [string, string][],
};

// Revenue and profit, ₹ crore
export const FINANCIALS = {
  quarterly: [
    { label: "Sep '25", revenue: 16066, profit: 2694 },
    { label: "Dec '25", revenue: 16580, profit: 6603, revChange: '+3.20%', profitChange: '+145.10%' },
    { label: "Mar '26", revenue: 16530, profit: 2994 },
    { label: "Jun '26", revenue: 17320, profit: 2680 },
    { label: "Sep '26", revenue: 18310, profit: 2796 },
  ],
  yearly: [
    { label: 'FY22', revenue: 52446, profit: 8879 },
    { label: 'FY23', revenue: 60580, profit: 10143 },
    { label: 'FY24', revenue: 61896, profit: 10282, revChange: '+2.17%', profitChange: '+1.37%' },
    { label: 'FY25', revenue: 63121, profit: 10644 },
    { label: 'TTM', revenue: 68741, profit: 15073 },
  ],
  growth: [
    ['1Y (TTM)', '+14.00%', '+4%'],
    ['3Y CAGR', '+2%', '+2%'],
  ] as [string, string, string][],
};

export const FILINGS = ["Sep '25", "Dec '25", "Mar '26", "Jun '26", "Sep '26"];
// Each holder's share at each filing, in %
export const OWNERS = [
  { key: 'Promoters', name: 'Promoters', color: '#0b55d0', bar: '#7C6CF0', series: [61.9, 61.9, 61.9, 61.9, 61.9] },
  { key: 'DIIs', name: 'Domestic Institutional Investors', color: '#4f86f0', bar: '#3DBF8A', series: [14.55, 14.62, 15.18, 15.78, 16.04] },
  { key: 'FIIs', name: 'Foreign Institutional Investors', color: '#9db8f5', bar: '#5B9BD5', series: [10.79, 10.71, 10.1, 9.5, 9.26] },
  { key: 'Public', name: 'Public', color: '#10a37f', bar: '#9CA3AF', series: [12.76, 12.77, 12.82, 12.82, 12.81] },
];

// ---- The six questions ----

export const OWN_OPTIONS = [
  { title: 'In my portfolio', sub: 'I already hold it', body: 'We look at how your holding fits your goals today.', color: '#2DD4BF' },
  { title: 'On my watchlist', sub: 'Thinking of buying', body: 'We look at whether it suits a fresh entry for you.', color: BLUE },
];
export const AMOUNT_PRESETS = ['₹5K', '₹10K', '₹25K', '₹50K', '₹1L'];
export const HORIZONS = [
  { short: '< 1 yr', tag: '< 1 YR', title: 'Spending soon', sub: 'A trip, a gadget, an emergency buffer', body: 'Stock prices can swing sharply within a single year, so money you need soon is the most exposed.' },
  { short: '1–3 yrs', tag: '1–3 YRS', title: 'Saving up', sub: 'A bike, a course, a wedding fund', body: 'A couple of years gives a dip some room to recover, but not always enough.' },
  { short: '3–5 yrs', tag: '3–5 YRS', title: 'Building', sub: 'A home down payment, a car', body: 'Enough time for most falls to recover, if the business keeps growing.' },
  { short: '5+ yrs', tag: '5+ YRS', title: 'The long haul', sub: 'Retirement, a child’s education', body: 'Over many years the business matters far more than the swings.' },
];
export const SWINGS = [
  { name: 'Low', mood: 'Steady', pct: 5, color: GREEN },
  { name: 'Moderate', mood: 'Balanced', pct: 15, color: '#F5A524' },
  { name: 'High', mood: 'Bold', pct: 30, color: RED },
];
export const GOALS = [
  { title: 'Grow my wealth', sub: 'Business quality & growth momentum', color: GREEN, icon: 'trend' },
  { title: 'Regular income', sub: 'Dividend yield & earnings stability', color: '#F5A524', icon: 'cash' },
  { title: 'Buy undervalued', sub: 'Valuation vs. what the business is worth', color: BLUE, icon: 'gem' },
  { title: 'Short-term momentum', sub: 'Volatility, trend & downside risk', color: '#F97316', icon: 'bolt' },
] as const;

// ---- The report ----

export const REPORT_TABS = ['Overview', 'Volatility', 'Consistency', 'Downside Risk', 'SWOT', 'Ownership'] as const;

export const GOAL_FIT = {
  score: 71,
  verdict: 'Partial Fit',
  tags: ['Considering', '< 1 yr', 'Moderate risk', 'Wealth Creation'],
  bars: [
    { name: 'Goal match', value: 56, note: 'Wealth creation leans on growth (45), quality (56) and valuation (73)' },
    { name: 'Risk match', value: 100, note: 'Moderate risk stock for a moderate risk investor' },
    { name: 'Horizon match', value: 55, note: 'Under a year, price swings matter more than fundamentals' },
    { name: 'Fundamentals', value: 68, note: 'Overall 4-pillar score of 68/100' },
  ],
  meaning: [
    'Investing ₹15,000 buys about 7 shares at ₹2,000.',
    'On a 1-in-20 bad day this amount could drop about ₹315; a repeat of its deepest fall (−39%) would mean about ₹5,865.',
    'Under a year, results depend mostly on market mood; even strong businesses can be down at your exit date.',
    'Profits grew only 2.0% a year over 3 years, which limits compounding.',
  ],
};

// Rolling 1-month volatility over the last year, as a multiple of the Nifty's average
export const VOLATILITY = (() => {
  const rand = seeded(97);
  const stock: number[] = [];
  const nifty: number[] = [];
  for (let i = 0; i < 48; i++) {
    const t = i / 47;
    stock.push(1.55 + Math.sin(t * 9) * 0.3 + (rand() - 0.5) * 0.35 + (t > 0.78 && t < 0.92 ? 0.9 : 0) - (t > 0.95 ? 0.5 : 0));
    nifty.push(0.85 + Math.sin(t * 6 + 1.2) * 0.45 * (t < 0.5 ? 1 : 0.4) + (rand() - 0.5) * 0.15 - t * 0.2);
  }
  return {
    stock,
    nifty,
    months: ['Jan', 'Mar', 'May', 'Jul', 'Sep'],
    multiple: 1.79,
    stats: [
      { label: 'Last 1 Month', value: '1.29x', note: 'vs Nifty', color: GREEN },
      { label: 'Beta', value: '0.74', note: 'market sensitivity' },
      { label: 'Annual Vol.', value: '21.3%', note: 'Nifty 14.4%' },
    ],
    meaning: 'Typical for an established stock: market-level swings plus some company-specific moves.',
  };
})();

export const CONSISTENCY = {
  profits: FINANCIALS.quarterly.map((q) => ({ label: q.label, value: q.profit })),
  margin: [16.8, 39.8, 18.1, 15.5, 15.2],
  meaning: [
    'Profitable in all 5 of the last 5 quarters.',
    'Latest quarter profit of ₹2,796 Cr is up 4% year-on-year (vs Sep ’25).',
    'Profits are moderately uneven, varying about 48% around their average.',
  ],
};

// How far below its last peak it was, over five years (%), for the stock and the Nifty
export const DRAWDOWN = (() => {
  const rand = seeded(211);
  const stock: number[] = [];
  const nifty: number[] = [];
  for (let i = 0; i < 80; i++) {
    const t = i / 79;
    let s = -Math.abs(Math.sin(t * 13)) * 9 - (rand() * 5);
    if (t > 0.3 && t < 0.45) s -= 8 * Math.sin(((t - 0.3) / 0.15) * Math.PI);
    if (t > 0.55 && t < 0.58) s = -rand();
    if (t >= 0.58) s = -(t - 0.58) * 70 - rand() * 6 + Math.sin(t * 30) * 3;
    stock.push(Math.min(0, Math.max(-39.1, s)));
    nifty.push(Math.min(0, -Math.abs(Math.sin(t * 17 + 1)) * 8 - rand() * 6 + (t > 0.6 ? Math.sin(t * 9) * 4 : 0)));
  }
  stock[0] = 0;
  stock[78] = -39.1;
  stock[79] = -33.5;
  return {
    stock,
    nifty,
    years: ['2022', '2023', '2024', '2025', '2026'],
    belowHigh: -19.4,
    range: { low: '₹1,815', last: '₹1,997', high: '₹2,478', at: 0.27 },
    note: 'Worst fall −39.1% (Sep ’24 → Oct ’26). 0% means trading at a new high.',
    stats: [
      { label: 'Max Drawdown (5Y)', value: '−39.1%', note: 'Nifty −16.2%', color: RED },
      { label: 'Recovery', value: 'Not yet', note: 'to regain Sep ’24 peak', color: AMBER },
      { label: 'Downside Capture (1Y)', value: '96%', note: 'falls almost as much as the Nifty' },
      { label: '1-in-20 Bad Day (1Y)', value: '−2.1%', note: 'about ₹315 on ₹15,000', color: RED },
    ],
  };
})();

export const SWOT = [
  { key: 'Strengths', color: '#22C55E', title: 'Works for it', points: ['Exceptional Financial Health and Low Leverage', 'Market-Leading Return on Equity of 22.9%'] },
  { key: 'Weaknesses', color: RED, title: 'Works against it', points: ['Sluggish Multi-Year Topline and Bottom-Line Growth', 'Uneven Quarterly Profits'] },
  { key: 'Opportunities', color: '#A78BFA', title: 'Could help it', points: ['Favourable Valuation Relative to Industry', 'A Steady 2.05% Dividend Yield'] },
  { key: 'Threats', color: '#FACC15', title: 'Risks that could hurt investors', points: ['High Growth-Adjusted Valuation Multiple', 'Sustained Foreign Institutional Outflows'] },
];

export const AI_STAGES = ['Running fundamental analysis…', 'Measuring volatility & downside…', 'Weighing it for your goal…'];
