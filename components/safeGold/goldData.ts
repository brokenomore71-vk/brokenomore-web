// SafeGold: the story's palette, words and placeholder figures. The figures are illustrative
// only, never live prices or holdings.

export const GOLD = {
  primary: '#D4AF37',
  champagne: '#F5D76E',
  highlight: '#FFE9A3',
  dark: '#8C6B20',
  text: '#F5F5F5',
  muted: '#A3A3A3',
  bg: '#050505',
};

export const SCENES = [
  { title: 'Your money deserves to grow.', body: 'Start your journey with digital gold. Invest in 24K gold, one purchase at a time.' },
  { title: 'Turn small savings into something valuable.', body: 'Buy digital gold and build your gold holdings at your own pace.' },
  { title: 'Watch your gold collection grow.', body: 'Keep track of your digital gold holdings and monitor their value in one place.' },
  { title: 'Your gold. Your decision.', body: "Your investment doesn't have to stay locked away. Access the available options whenever you need them." },
  { title: 'Make your gold tangible.', body: 'Withdraw eligible gold as physical coins or bars, subject to available denominations and applicable charges.' },
  { title: 'Need your money back? Sell with ease.', body: 'Sell your eligible digital gold and receive the applicable sale proceeds through the supported payment process.' },
  { title: 'Start small. Build something golden.', body: 'Buy digital gold, track your holdings, withdraw physical gold or sell when you need to. Your gold journey starts here.' },
];

export const PORTFOLIO = {
  grams: 5.25,
  value: 35000,
  karat: '24K',
  status: 'Active',
};

export const SALE = { grams: '1.000 g', value: '₹6,650' };

// A gentle climb, for the portfolio's chart
export const CHART = [12, 14, 13, 17, 16, 20, 19, 23, 22, 27, 26, 31, 30, 35];

export type ScreenPoint = { x: number; y: number };

// Everything the 3D scene needs for one frame, set by the scroll timeline
export interface GoldFrame {
  time: number;
  cam: { z: number; y: number };
  pig: { sx: number; sy: number; z: number; scale: number; rotY: number; value: number };
  sheen: number;
  appears: number[]; // each coin coming out from behind the piggy bank into orbit, 0 to 1
  deposits: number[]; // each orbiting coin's trip into the slot, 0 to 1
  returns: number[]; // and its trip back out into orbit
  landings: number[];
  emerge: number;
  withdraw: { coin: number; morph: number; pack: number; drop: number; lid: number; away: number };
  sell: { coin: number; burst: number; fade: number };
  // Points on the canvas, in pixels, that the 3D pieces travel to and from
  anchors: { portfolio: ScreenPoint; withdraw: ScreenPoint; sell: ScreenPoint; bench: ScreenPoint; rupee: ScreenPoint };
}
