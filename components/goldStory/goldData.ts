// Everything the gold story shows, taken from the app's Savings (SafeGold) screens.

export const GOLD = {
  buyRate: 11871.26, // ₹ per gram, excluding GST
  sellRate: 10425.05,
  gst: 0.03,
  startGrams: 0.5532,
  typed: '2500', // the amount keyed in, in rupees
  coinGrams: 0.5,
  making: 479.57,
  invoice: 'SG26110902474719309106',
  pincode: 'Mumbai - 400001',
  dispatch: '7-10 days',
};
export const BUY_AMOUNT = Number(GOLD.typed);
// What ₹2,500 buys once 3% GST is taken out, to four places as the app shows it
export const BUY_GRAMS = Math.floor((BUY_AMOUNT / (1 + GOLD.gst) / GOLD.buyRate) * 10000) / 10000;
export const AFTER_BUY = Math.round((GOLD.startGrams + BUY_GRAMS) * 10000) / 10000;
export const AFTER_COIN = Math.round((AFTER_BUY - GOLD.coinGrams) * 10000) / 10000;

export const SUMMARY = (() => {
  const value = BUY_AMOUNT / (1 + GOLD.gst);
  return [
    ['Gold weight', `${BUY_GRAMS.toFixed(4)} g`],
    ['Gold rate (excl. GST)', `₹${GOLD.buyRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g`],
    ['Value of gold', `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['GST @ 3%', `₹${(BUY_AMOUNT - value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ] as [string, string][];
})();

// Five years of the gold price, for the Savings screen's chart. Seeded, so it's the same each time.
export const GOLD_SERIES = (() => {
  let seed = 5;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  const out: number[] = [];
  let v = 0.05;
  for (let i = 0; i < 120; i++) {
    v += 0.008 + rand() * 0.05 - (i > 40 && i < 55 ? 0.012 : 0);
    out.push(Math.max(0, Math.min(1, v)));
  }
  return out;
})();

export const inr = (n: number, decimals = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export const GOLD_CAPTIONS = [
  { title: 'Gold, bought in rupees.', body: `Type ${inr(BUY_AMOUNT, 0)} and ${BUY_GRAMS} g of 24K, 99.5% pure gold goes into your vault.` },
  { title: 'Or hold it in your hand.', body: 'Turn your vault into a 24K coin, minted and insured to your door.' },
];
