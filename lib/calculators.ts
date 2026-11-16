// The app's Financial Calculators, with the same formulas it uses (lib/pages/features_pages/
// calculators.dart in the app). Every period is in whole years. Each calculator turns its inputs
// into a result the page can draw: a headline figure, a few stats, a two-part split for the ring,
// and a year-by-year breakdown for the chart and the table.

export type CalcKey = 'emi' | 'sip' | 'lumpsum' | 'swp' | 'fd' | 'ppf';

export type Field = {
  key: string;
  label: string;
  unit: 'inr' | 'pct' | 'yrs';
  min: number;
  max: number;
  step: number;
  value: number;
  log?: boolean; // amounts: the slider moves along a log scale so small and large both feel right
};

export type Row = { year: number; a: number; b: number; total: number };

export type Result = {
  headline: { label: string; value: number; suffix?: string };
  stats: { label: string; value: number }[];
  split: { a: { label: string; value: number }; b: { label: string; value: number } };
  rows: Row[];
  // What each year's bar shows: a and b stacked, or one value (b ignored)
  chart: { a: string; b?: string; single?: boolean; caption: string };
};

export type Calculator = {
  key: CalcKey;
  name: string;
  short: string;
  blurb: string;
  fields: Field[];
  // The calculator asked as a question, and its inputs written into a sentence (a string is
  // plain text, `{ f }` is that field's value)
  question: string;
  sentence: (string | { f: string })[];
  answer: string; // the words before the result
  run: (v: Record<string, number>) => Result;
};

const yearsOf = (y: number) => Math.max(1, Math.round(y));

function emi(v: Record<string, number>): Result {
  const P = v.amount;
  const r = v.rate / 12 / 100;
  const n = yearsOf(v.years) * 12;
  const pay = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const rows: Row[] = [];
  let left = P;
  for (let y = 1; y <= n / 12; y++) {
    let interest = 0;
    let principal = 0;
    for (let m = 0; m < 12; m++) {
      const int = left * r;
      const pr = Math.min(pay - int, left);
      interest += int;
      principal += pr;
      left -= pr;
    }
    rows.push({ year: y, a: principal, b: interest, total: Math.max(0, left) });
  }
  const total = pay * n;
  return {
    headline: { label: 'Monthly EMI', value: pay, suffix: '/mo' },
    stats: [
      { label: 'Principal', value: P },
      { label: 'Total interest', value: total - P },
      { label: 'Total amount', value: total },
    ],
    split: { a: { label: 'Principal', value: P }, b: { label: 'Interest', value: total - P } },
    rows,
    chart: { a: 'Principal paid', b: 'Interest paid', caption: 'What each year of EMIs pays off' },
  };
}

function lumpsum(v: Record<string, number>): Result {
  const P = v.amount;
  const Y = yearsOf(v.years);
  const rows: Row[] = [];
  for (let y = 1; y <= Y; y++) {
    const fv = P * Math.pow(1 + v.rate / 100, y);
    rows.push({ year: y, a: P, b: fv - P, total: fv });
  }
  const fv = rows[rows.length - 1].total;
  return {
    headline: { label: 'Total value', value: fv },
    stats: [
      { label: 'Invested', value: P },
      { label: 'Est. returns', value: fv - P },
      { label: 'Total value', value: fv },
    ],
    split: { a: { label: 'Invested', value: P }, b: { label: 'Est. returns', value: fv - P } },
    rows,
    chart: { a: 'Invested', b: 'Returns', caption: 'Your investment, at the end of each year' },
  };
}

function swp(v: Record<string, number>): Result {
  const P = v.amount;
  const W = v.withdrawal;
  const months = yearsOf(v.years) * 12;
  const mr = Math.pow(1 + v.rate / 100, 1 / 12) - 1;
  let balance = P;
  let withdrawn = 0;
  const rows: Row[] = [];
  for (let m = 1; m <= months; m++) {
    if (balance > 0) {
      balance += balance * mr;
      const w = Math.min(W, balance);
      balance -= w;
      withdrawn += w;
    }
    if (m % 12 === 0) rows.push({ year: m / 12, a: Math.max(balance, 0), b: withdrawn, total: Math.max(balance, 0) });
  }
  const final = Math.max(balance, 0);
  return {
    headline: { label: 'Final value', value: final },
    stats: [
      { label: 'Invested', value: P },
      { label: 'Total withdrawn', value: withdrawn },
      { label: 'Final value', value: final },
    ],
    split: { a: { label: 'Final value', value: final }, b: { label: 'Withdrawn', value: withdrawn } },
    rows,
    chart: { a: 'Corpus left', single: true, caption: 'What’s left in the fund at the end of each year' },
  };
}

function fd(v: Record<string, number>): Result {
  const P = v.amount;
  const Y = yearsOf(v.years);
  const rows: Row[] = [];
  for (let y = 1; y <= Y; y++) {
    const fv = P * Math.pow(1 + v.rate / 100 / 4, 4 * y);
    rows.push({ year: y, a: P, b: fv - P, total: fv });
  }
  const fv = rows[rows.length - 1].total;
  return {
    headline: { label: 'Maturity value', value: fv },
    stats: [
      { label: 'Invested', value: P },
      { label: 'Est. returns', value: fv - P },
      { label: 'Maturity value', value: fv },
    ],
    split: { a: { label: 'Invested', value: P }, b: { label: 'Est. returns', value: fv - P } },
    rows,
    chart: { a: 'Invested', b: 'Interest', caption: 'Compounded quarterly, at the end of each year' },
  };
}

function sip(v: Record<string, number>): Result {
  const M = v.monthly;
  const r = Math.pow(1 + v.rate / 100, 1 / 12) - 1;
  const Y = yearsOf(v.years);
  const fvAt = (n: number) => (r === 0 ? M * n : ((M * (Math.pow(1 + r, n) - 1)) / r) * (1 + r));
  const rows: Row[] = [];
  for (let y = 1; y <= Y; y++) {
    const fv = fvAt(y * 12);
    rows.push({ year: y, a: M * y * 12, b: fv - M * y * 12, total: fv });
  }
  const last = rows[rows.length - 1];
  return {
    headline: { label: 'Total value', value: last.total },
    stats: [
      { label: 'Invested', value: last.a },
      { label: 'Est. returns', value: last.b },
      { label: 'Total value', value: last.total },
    ],
    split: { a: { label: 'Invested', value: last.a }, b: { label: 'Est. returns', value: last.b } },
    rows,
    chart: { a: 'Invested', b: 'Returns', caption: 'Your SIP, at the end of each year' },
  };
}

function ppf(v: Record<string, number>): Result {
  const A = v.yearly;
  const Y = yearsOf(v.years);
  let balance = 0;
  const rows: Row[] = [];
  for (let y = 1; y <= Y; y++) {
    balance = (balance + A) * (1 + v.rate / 100);
    rows.push({ year: y, a: A * y, b: balance - A * y, total: balance });
  }
  return {
    headline: { label: 'Maturity value', value: balance },
    stats: [
      { label: 'Invested', value: A * Y },
      { label: 'Interest earned', value: balance - A * Y },
      { label: 'Maturity value', value: balance },
    ],
    split: { a: { label: 'Invested', value: A * Y }, b: { label: 'Interest', value: balance - A * Y } },
    rows,
    chart: { a: 'Invested', b: 'Interest', caption: 'Your PPF balance, at the end of each year' },
  };
}

export const CALCULATORS: Calculator[] = [
  {
    key: 'emi',
    name: 'EMI Calculator',
    short: 'EMI',
    blurb: 'The fixed monthly payment on a loan, and how much of it is interest.',
    fields: [
      { key: 'amount', label: 'Loan amount', unit: 'inr', min: 10000, max: 50000000, step: 1000, value: 2500000, log: true },
      { key: 'rate', label: 'Rate of interest (p.a.)', unit: 'pct', min: 1, max: 20, step: 0.1, value: 8.5 },
      { key: 'years', label: 'Loan tenure', unit: 'yrs', min: 1, max: 30, step: 1, value: 20 },
    ],
    question: 'What will my EMI be?',
    sentence: ['Borrowing ', { f: 'amount' }, ' at ', { f: 'rate' }, ' for ', { f: 'years' }, ' means paying'],
    answer: 'every month',
    run: emi,
  },
  {
    key: 'sip',
    name: 'SIP Calculator',
    short: 'SIP',
    blurb: 'What a fixed monthly investment grows to.',
    fields: [
      { key: 'monthly', label: 'Monthly investment', unit: 'inr', min: 500, max: 1000000, step: 500, value: 10000, log: true },
      { key: 'rate', label: 'Expected return (p.a.)', unit: 'pct', min: 1, max: 30, step: 0.1, value: 12 },
      { key: 'years', label: 'Time period', unit: 'yrs', min: 1, max: 40, step: 1, value: 10 },
    ],
    question: 'What will my SIP grow to?',
    sentence: ['Putting in ', { f: 'monthly' }, ' every month at ', { f: 'rate' }, ' for ', { f: 'years' }, ' grows to'],
    answer: '',
    run: sip,
  },
  {
    key: 'lumpsum',
    name: 'Lumpsum',
    short: 'Lumpsum',
    blurb: 'What a one-time investment grows to, compounded every year.',
    fields: [
      { key: 'amount', label: 'Total investment', unit: 'inr', min: 1000, max: 10000000, step: 1000, value: 100000, log: true },
      { key: 'rate', label: 'Expected return (p.a.)', unit: 'pct', min: 1, max: 30, step: 0.1, value: 12 },
      { key: 'years', label: 'Time period', unit: 'yrs', min: 1, max: 40, step: 1, value: 10 },
    ],
    question: 'What if I invest it all at once?',
    sentence: ['Investing ', { f: 'amount' }, ' once at ', { f: 'rate' }, ' for ', { f: 'years' }, ' grows to'],
    answer: '',
    run: lumpsum,
  },
  {
    key: 'swp',
    name: 'SWP Calculator',
    short: 'SWP',
    blurb: 'Withdraw a fixed amount every month while the rest keeps earning.',
    fields: [
      { key: 'amount', label: 'Total investment', unit: 'inr', min: 10000, max: 50000000, step: 1000, value: 1000000, log: true },
      { key: 'withdrawal', label: 'Withdrawal per month', unit: 'inr', min: 500, max: 500000, step: 500, value: 8000, log: true },
      { key: 'rate', label: 'Expected return (p.a.)', unit: 'pct', min: 1, max: 30, step: 0.1, value: 8 },
      { key: 'years', label: 'Time period', unit: 'yrs', min: 1, max: 40, step: 1, value: 10 },
    ],
    question: 'How long will my corpus last?',
    sentence: ['From ', { f: 'amount' }, ', taking out ', { f: 'withdrawal' }, ' a month at ', { f: 'rate' }, ' for ', { f: 'years' }, ' leaves'],
    answer: '',
    run: swp,
  },
  {
    key: 'fd',
    name: 'FD Calculator',
    short: 'FD',
    blurb: 'The maturity value of a fixed deposit, compounded quarterly.',
    fields: [
      { key: 'amount', label: 'Total investment', unit: 'inr', min: 1000, max: 10000000, step: 1000, value: 100000, log: true },
      { key: 'rate', label: 'Rate of interest (p.a.)', unit: 'pct', min: 1, max: 15, step: 0.05, value: 7 },
      { key: 'years', label: 'Time period', unit: 'yrs', min: 1, max: 25, step: 1, value: 5 },
    ],
    question: 'What will my FD pay?',
    sentence: ['A fixed deposit of ', { f: 'amount' }, ' at ', { f: 'rate' }, ' for ', { f: 'years' }, ' matures at'],
    answer: '',
    run: fd,
  },
  {
    key: 'ppf',
    name: 'PPF Calculator',
    short: 'PPF',
    blurb: 'A yearly PPF deposit, compounded once a year.',
    fields: [
      { key: 'yearly', label: 'Yearly investment', unit: 'inr', min: 500, max: 150000, step: 500, value: 150000, log: true },
      { key: 'years', label: 'Time period', unit: 'yrs', min: 15, max: 50, step: 1, value: 15 },
      { key: 'rate', label: 'Rate of interest (p.a.)', unit: 'pct', min: 1, max: 15, step: 0.1, value: 7.1 },
    ],
    question: 'What will my PPF give me?',
    sentence: ['Putting ', { f: 'yearly' }, ' into PPF every year at ', { f: 'rate' }, ' for ', { f: 'years' }, ' matures at'],
    answer: '',
    run: ppf,
  },
];

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// "₹25,00,000" → "25 Lakh": how people here say an amount out loud
export function inWords(n: number) {
  const a = Math.abs(n);
  const trim = (x: number) => (x >= 100 ? x.toFixed(0) : x.toFixed(2).replace(/\.?0+$/, ''));
  if (a >= 1e7) return `${trim(n / 1e7)} Crore`;
  if (a >= 1e5) return `${trim(n / 1e5)} Lakh`;
  if (a >= 1e3) return `${trim(n / 1e3)} Thousand`;
  return Math.round(n).toString();
}

// Short axis labels: ₹25L, ₹1.2Cr, ₹40K
export function compact(n: number) {
  const a = Math.abs(n);
  const t = (x: number) => (x >= 10 ? x.toFixed(0) : x.toFixed(1).replace(/\.0$/, ''));
  if (a >= 1e7) return `₹${t(n / 1e7)}Cr`;
  if (a >= 1e5) return `₹${t(n / 1e5)}L`;
  if (a >= 1e3) return `₹${t(n / 1e3)}K`;
  return `₹${Math.round(n)}`;
}
