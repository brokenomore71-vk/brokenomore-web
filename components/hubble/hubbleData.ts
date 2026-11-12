// Hubble: Luxury Dark Fintech Palette, partner brands, scenes and typed frames.
// All balances and card values are illustrative.

export const HUB = {
  bg: '#050505',
  cardBg: '#090909',
  dark: '#0A0A0A',
  charcoal: '#262626',
  border: '#333333',
  silver: '#F5F5F5',
  highlight: '#FFFFFF',
  text: '#F5F5F5',
  muted: '#A3A3A3',
  subtle: '#737373',
};

export interface SceneMeta {
  title: string;
  body: string;
}

export const SCENES: SceneMeta[] = [
  // Scene 1 – The Architectural Brand Grid Awakening
  {
    title: 'Enjoy instant discount on 400+ brands with gift cards.',
    body: 'Unlock immediate savings on everyday shopping, dining, travel, and entertainment with instant gift cards.',
  },
  // Scene 2 – Precision Gift Card Docking
  {
    title: 'Your favorite brands, built-in savings.',
    body: 'Buy gift cards instantly and apply them right at checkout for guaranteed savings.',
  },
  // Scene 3 – Portfolio Aggregation & Value Tracking
  {
    title: 'Track every rupee saved.',
    body: 'Monitor your cumulative discounts, active gift card vouchers, and brand redemptions in one unified dashboard.',
  },
  // Scene 4 – Total Control: Redeem or Transfer
  {
    title: 'Your savings, your rules.',
    body: 'Never let discounts expire. Use your gift cards instantly or manage your saved balances on your own terms.',
  },
  // Scene 5 – Frictionless Brand Redemption
  {
    title: 'Ready at checkout, anywhere.',
    body: 'Access your gift cards instantly on your screen or via WhatsApp the moment you need them.',
  },
  // Scene 6 – Seamless Liquidity & Payouts
  {
    title: 'Complete financial freedom.',
    body: 'Manage your funds securely with bank-grade encryption and total liquidity.',
  },
  // Scene 7 – The Connected Ecosystem
  {
    title: 'Shop smarter. Save instantly.',
    body: 'Explore 400+ top brands, unlock instant gift card discounts, and keep your savings growing. Your Hubble journey starts here.',
  },
];

// The Hubble Savings Summary figures (Scene 3)
export const SUMMARY = {
  brands: '400+',
  savingsCr: '₹10Cr+',
  delivery: 'Instant (In-App & WhatsApp)',
  status: 'Secure & Verified',
  activeOffers: 18,
  savingsAmount: 24850,
};

// Top-tier partner brands highlighted in the prompt
export interface PartnerBrand {
  id: string;
  name: string;
  sub: string;
  category: string;
  discount: string;
  featured?: boolean;
}

export const FEATURED_BRANDS: PartnerBrand[] = [
  { id: 'reliance', name: 'Reliance SMART', sub: 'GROCERY & SUPERSTORE', category: 'Grocery', discount: 'Flat 5% OFF', featured: true },
  { id: 'amazon', name: 'amazon', sub: 'SHOPPING VOUCHER', category: 'E-Commerce', discount: 'Up to 4% OFF', featured: true },
  { id: 'pvr', name: 'PVR INOX', sub: 'CINEMAS & EXPERIENCES', category: 'Entertainment', discount: 'Flat 8% OFF', featured: true },
  { id: 'cleartrip', name: 'cleartrip', sub: 'FLIGHTS & HOTELS', category: 'Travel', discount: 'Flat 6% OFF', featured: true },
  { id: 'ikea', name: 'IKEA', sub: 'HOME FURNISHINGS', category: 'Home', discount: 'Flat 5% OFF', featured: true },
  { id: 'timesprime', name: 'TIMES PRIME', sub: 'PREMIUM MEMBERSHIP', category: 'Lifestyle', discount: 'Flat 12% OFF', featured: true },
];

// Expanded list of partner brands populating the 400+ architectural matrix
export const MATRIX_BRANDS: PartnerBrand[] = [
  ...FEATURED_BRANDS,
  { id: 'flipkart', name: 'Flipkart', sub: 'ONLINE SHOPPING', category: 'E-Commerce', discount: 'Up to 5% OFF' },
  { id: 'swiggy', name: 'Swiggy', sub: 'FOOD & DINEOUT', category: 'Food', discount: 'Flat 7% OFF' },
  { id: 'zomato', name: 'Zomato', sub: 'DINING & DELIVERY', category: 'Food', discount: 'Flat 6% OFF' },
  { id: 'myntra', name: 'Myntra', sub: 'FASHION & APPAREL', category: 'Fashion', discount: 'Up to 8% OFF' },
  { id: 'uber', name: 'Uber', sub: 'RIDES & MOBILITY', category: 'Travel', discount: 'Flat 5% OFF' },
  { id: 'makemytrip', name: 'MakeMyTrip', sub: 'HOLIDAYS & FLIGHTS', category: 'Travel', discount: 'Flat 6% OFF' },
  { id: 'starbucks', name: 'Starbucks', sub: 'COFFEE & BEVERAGES', category: 'Dining', discount: 'Flat 10% OFF' },
  { id: 'nykaa', name: 'Nykaa', sub: 'BEAUTY & WELLNESS', category: 'Beauty', discount: 'Flat 7% OFF' },
  { id: 'croma', name: 'Croma', sub: 'ELECTRONICS & GADGETS', category: 'Electronics', discount: 'Flat 4% OFF' },
  { id: 'dominos', name: 'Domino’s', sub: 'PIZZA & MEALS', category: 'Food', discount: 'Flat 8% OFF' },
  { id: 'decathlon', name: 'Decathlon', sub: 'SPORTS & GEAR', category: 'Sports', discount: 'Flat 5% OFF' },
  { id: 'tatacliq', name: 'Tata CLiQ', sub: 'LUXURY & APPAREL', category: 'Luxury', discount: 'Up to 9% OFF' },
];

// The primary interactive card shown in Scenes 4, 5 & 6
export const PRIMARY_GIFT = {
  brand: 'amazon',
  title: 'Amazon Shopping Voucher',
  code: 'HBL-7Q4K-29XM-0815',
  balance: 2000,
  discountSaved: 120,
  expiry: 'Valid for 12 months',
  validity: 'Valid for online & in-store checkout',
};

// Analytics line chart trend data (Scene 3)
export const SAVINGS_CHART = [14, 18, 16, 22, 21, 28, 27, 34, 32, 40, 39, 48, 46, 56];

export type ScreenPoint = { x: number; y: number };

// Complete state passed to Three.js for each rendered frame
export interface HubbleFrame {
  time: number;
  cam: { z: number; y: number; fov?: number };
  grid: {
    tilt: number;
    converge: number;
    back: number;
    reveal: number;
  };
  terminal: {
    sx: number;
    sy: number;
    z: number;
    scale: number;
    rotY: number;
    recoil: number;
    statusLight: number;
  };
  sheen: number;
  featuredDock: number[]; // 0 to 1 docking progression for featured cards
  featuredReturn: number[]; // 0 to 1 return to ecosystem composition
  landings: number[];
  cardFocus: {
    t: number; // 0: hidden/docked, 1: primary card floating in focus (Scene 4)
    action: 'none' | 'redeem' | 'transfer';
    redeemProgress: number; // 0 to 1 transition into digital voucher
    voucherDeploy: number; // 0 to 1 voucher reveal
  };
  payout: {
    streamProgress: number; // 0 to 1 particles flow
    settlementConfirm: number; // 0 to 1 settlement arrival
  };
  count: number; // 0 to 1 savings counter
  anchors: {
    dashboard: ScreenPoint;
    dockCard: ScreenPoint;
    primaryCard: ScreenPoint;
    deliveryBadge: ScreenPoint;
    settlementBadge: ScreenPoint;
  };
}
