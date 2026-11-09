// Everything the stock story shows, taken from the app's own Stock Analysis Planner screens.

export const MARKET = [
  { name: 'NIFTY 50', value: 24979.0, change: '-7.40 (-0.03%)', up: false },
  { name: 'SENSEX', value: 80973.7, change: '-25.70 (-0.03%)', up: false },
  { name: 'NIFTY BANK', value: 59390.9, change: '+540.25 (+0.92%)', up: true },
];

export const SEARCH = {
  query: 'hindu',
  count: 23,
  results: [
    { name: 'Hindustan Agrigentics', sub: 'BSE', tag: 'HINDUST', logo: 'agri' },
    { name: 'Hindustan Unilever Ltd.', sub: 'FMCG & Consumer Goods', tag: 'HINDUNILVR', logo: 'hul' },
    { name: 'Hindustan Aeronautics', sub: 'Capital Goods', tag: 'HAL', logo: 'hal' },
  ],
  picked: 1,
};

export const STOCK = {
  name: 'Hindustan Unilever Ltd.',
  symbol: 'HINDUNILVR',
  sector: 'FMCG & Consumer Goods',
  price: 1999.8,
  change: '+2.80 (+0.14%)',
  prevClose: 1997,
  low: 1984,
  high: 2006.5,
  weekLow: 1758.2,
  weekHigh: 2479.6,
  open: 2000,
  volume: '3,84,255',
  lowerCircuit: '1,797.30',
  upperCircuit: '2,196.70',
};

export const FUNDAMENTALS: [string, string][] = [
  ['Mkt Cap', '₹4,70,036 Cr'],
  ['ROE', '22.93%'],
  ['P/E Ratio(TTM)', '31.18'],
  ['EPS(TTM)', '64.15'],
  ['P/B Ratio', '9.63'],
  ['Div Yield', '2.05%'],
  ['Industry P/E', '35.70'],
  ['Book Value', '207.82'],
  ['Debt to Equity', '0.03'],
  ['Face Value', '1'],
];

// Revenue and profit in ₹ thousand crore, on a 20K scale
export const QUARTERS = [
  { label: "Sep '25", revenue: 16.2, profit: 2.6 },
  { label: "Dec '25", revenue: 16.58, profit: 6.6, selected: true },
  { label: "Mar '26", revenue: 16.9, profit: 2.7 },
  { label: "Jun '26", revenue: 17.6, profit: 2.6 },
  { label: "Sep '26", revenue: 18.4, profit: 2.7 },
];

export const HOLDING = [
  { name: 'Promoters', share: 61.9, color: '#0b55d0' },
  { name: 'Domestic Institutional Investors', share: 16.04, color: '#4f86f0' },
  { name: 'Foreign Institutional Investors', share: 9.26, color: '#9db8f5' },
  { name: 'Public', share: 12.81, color: '#10a37f' },
];

// What goes on the scale: the stock's facts, as strengths or things to watch
export const WEIGHTS = [
  { label: 'ROE', value: '22.93%', side: 'strength' },
  { label: 'P/E', value: '31.18', side: 'watch' },
  { label: 'Debt to equity', value: '0.03', side: 'strength' },
  { label: 'Growth', value: 'Muted · 45', side: 'watch' },
  { label: 'Dividend yield', value: '2.05%', side: 'strength' },
] as const;

export const SCORE = 6;
// Circumference of the verdict's score ring (radius 17 in its 40×40 box)
export const VERDICT_RING = 2 * Math.PI * 17;
export const PILLARS = [
  { name: 'Valuation', score: 73, verdict: 'Fairly Valued', color: '#e5b85c' },
  { name: 'Quality', score: 56, verdict: 'Moderate', color: '#e5b85c' },
  { name: 'Financial Health', score: 98, verdict: 'Strong', color: '#5fbf8a' },
  { name: 'Growth', score: 45, verdict: 'Muted', color: '#e0726a' },
];

// A day of prices: a dip after the open, then a climb to close near the day's high. Seeded, so
// it's the same chart every time.
export const PRICE_SERIES = (() => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  const points: number[] = [];
  const n = 140;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const trend = 1990 + Math.sin(t * Math.PI * 1.6 - 0.4) * 6 + t * t * 14 - Math.exp(-((t - 0.53) ** 2) / 0.004) * 8;
    points.push(trend + rand() * 2.4);
  }
  points[0] = 1986;
  points[n - 1] = 1999.8;
  // A light smoothing, so it reads as a price line rather than noise
  return points.map((v, i) => (i === 0 || i === n - 1 ? v : (points[i - 1] + v * 2 + points[i + 1]) / 4));
})();
export const PRICE_MIN = 1980;
export const PRICE_MAX = 2008;

export const inr = (n: number, decimals = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
export const num = (n: number, decimals = 2) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const STOCK_CAPTIONS = [
  { title: 'Find it in a keystroke.', body: '6,000+ NSE and BSE stocks, searchable by name or symbol.' },
  { title: 'Weighed, not guessed.', body: 'Strengths on one side, watch-outs on the other.' },
  { title: 'A clear verdict.', body: 'One score out of 10, weighed for your goal.' },
];
