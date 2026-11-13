// A group, its shared expenses, and how it settles up: the Split tab's side of Split & Share. The
// same four friends as the split story. Every figure adds up:
//   ₹40,000 spent, ₹10,000 each. You paid ₹18,000 (+₹8,000), Atharva ₹8,000 (−₹2,000), Parva
//   ₹4,000 (−₹6,000), Ruchi ₹10,000 (settled).
// Each expense is shared four ways, which leaves six payments between the friends; netting them
// out leaves two: Atharva pays you ₹2,000 and Parva pays you ₹6,000.

export type PersonId = 'you' | 'atharva' | 'parva' | 'ruchi';

export const GROUP = {
  name: 'Goa Villa Trip',
  members: ['you', 'atharva', 'parva', 'ruchi'] as PersonId[],
  expenses: [
    { title: 'Villa Booking (3 nights)', payer: 'you' as PersonId, amount: 18000 },
    { title: 'Self-Drive Car Rental', payer: 'atharva' as PersonId, amount: 8000 },
    { title: 'Seafood Beach Dinner', payer: 'parva' as PersonId, amount: 4000 },
    { title: 'Scuba & Water Sports', payer: 'ruchi' as PersonId, amount: 10000 },
  ],
  total: 40000,
  share: 10000,
};

export const PAID: Record<PersonId, number> = { you: 18000, atharva: 8000, parva: 4000, ruchi: 10000 };
export const NET: Record<PersonId, number> = { you: 8000, atharva: -2000, parva: -6000, ruchi: 0 };
export const NAMES: Record<PersonId, string> = { you: 'You', atharva: 'Atharva', parva: 'Parva', ruchi: 'Ruchi' };
export const FULL_NAMES: Record<PersonId, string> = { you: 'You', atharva: 'Atharva Shewale', parva: 'Parva Shah', ruchi: 'Ruchita Shah' };

// Who owes whom, before and after netting out
export const RAW_DEBTS: { from: PersonId; to: PersonId; amount: number }[] = [
  { from: 'atharva', to: 'you', amount: 2500 },
  { from: 'parva', to: 'you', amount: 3500 },
  { from: 'ruchi', to: 'you', amount: 2000 },
  { from: 'parva', to: 'atharva', amount: 1000 },
  { from: 'atharva', to: 'ruchi', amount: 500 },
  { from: 'parva', to: 'ruchi', amount: 1500 },
];
export const NET_DEBTS: { from: PersonId; to: PersonId; amount: number }[] = [
  { from: 'atharva', to: 'you', amount: 2000 },
  { from: 'parva', to: 'you', amount: 6000 },
];

// The rest of the Split tab, for the overview
export const GROUPS = [
  { name: 'Goa Villa Trip', members: ['you', 'atharva', 'parva', 'ruchi'] as PersonId[], note: 'You are owed ₹8,000', tone: 'up' },
  { name: 'Flatmates · Bandra', members: ['you', 'parva', 'ruchi'] as PersonId[], note: 'You owe ₹1,250', tone: 'down' },
  { name: 'Office Lunch Club', members: ['you', 'atharva', 'ruchi'] as PersonId[], note: 'All settled', tone: 'flat' },
] as const;

export const RECENT_SPLITS = [
  { name: 'Goa Weekend', meta: 'Equal · 3 people', amount: 25000 },
  { name: 'Saffron Table', meta: 'Dutch · 4 people · scanned', amount: 2184 },
];

export const FRIEND_BALANCES = [
  { id: 'atharva' as PersonId, note: 'Owes you ₹2,000', tone: 'up' },
  { id: 'parva' as PersonId, note: 'Owes you ₹6,000', tone: 'up' },
  { id: 'ruchi' as PersonId, note: 'Settled', tone: 'flat' },
  { id: 'bharti', letter: 'B', note: 'You owe ₹1,250', tone: 'down' },
] as const;

export const SETTLE_CAPTIONS = [
  { title: 'Trips, flats, office lunches.', body: 'Put every shared expense in a group: ₹40,000 for Goa, paid by four different people.' },
  { title: 'Everyone’s balance, worked out.', body: 'Each paid their bit; the app knows who’s up and who’s down. You’re owed ₹8,000.' },
  { title: 'Six payments become two.', body: 'Net debts cancel out what people owe each other, so fewer transfers square everything.' },
  { title: 'Settle up in one tap, over UPI.', body: 'Request it, they pay, and the whole group is square.' },
];

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
