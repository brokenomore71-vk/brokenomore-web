// Copy, prices and catalog data for the Gold Savings chapter
export const GOLD_CAPTIONS = [
  {
    title: 'Live 24K gold rates.',
    body: 'Invest in 99.5% pure digital gold backed by physical bullion in institutional vaults.',
  },
  {
    title: 'Start with just ₹10.',
    body: 'Accumulate in rupees or grams at live market rates with zero lock-in.',
  },
  {
    title: 'Delivered to your doorstep.',
    body: 'Convert your digital balance into 24K 99.99% minted gold coins anytime.',
  },
  {
    title: 'Instant liquidity.',
    body: 'Sell anytime at live rates with immediate payout to your UPI ID or bank account.',
  },
];

export const GOLD_DATA = {
  buyRate: 11871.26,
  sellRate: 10425.05,
  purity: '24K · 99.5% pure',
  partner: 'SafeGold',
  startGrams: 0.5532,
  startValue: 5767.14,
  buyAmount: 2500,
  buyGrams: 0.2044,
  afterBuyGrams: 0.7576,
  sellAmount: 2000,
  sellGrams: 0.1918,
  upiId: '9309222754@upi',
  coins: [
    { name: '0.5g Ganesh Coin', purity: '24K 99.99%', weight: '0.5g', making: 479.57 },
    { name: '1g SafeGold Coin', purity: '24K 99.99%', weight: '1.0g', making: 620.00 },
    { name: '0.5g Laxmi Coin', purity: '24K 99.99%', weight: '0.5g', making: 479.57 },
  ],
};

export const inr = (n: number, decimals = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
