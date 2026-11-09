// All the story's numbers live here. Every set of shares below adds up to its total.

// ---- Equal split: a plain amount, shared evenly between three ----
export const EQUAL = {
  amount: 25000,
  typed: '25000', // what's keyed in, one digit at a time
  splitName: 'Goa Weekend',
  // Paise that don't divide evenly land on the last person, as in the app
  shares: [8333.33, 8333.33, 8333.34],
};

// ---- Dutch split: a scanned bill, each person paying for what they had ----
export const BILL = {
  merchant: 'SAFFRON TABLE',
  splitName: 'Saffron Table',
  items: [
    { name: 'Paneer Tikka', qty: 1, amount: 420 },
    { name: 'Butter Chicken', qty: 1, amount: 540 },
    { name: 'Dal Makhani', qty: 1, amount: 380 },
    { name: 'Garlic Naan', qty: 4, amount: 320 },
    { name: 'Mango Lassi', qty: 3, amount: 420 },
  ],
  subtotal: 2080,
  cgst: 52,
  sgst: 52,
  total: 2184,
};
// Tax is shared out in proportion to what each person ordered.
const TAX_RATE = (BILL.cgst + BILL.sgst) / BILL.subtotal;
// Which person (index into PEOPLE) had each item on the bill.
export const ITEM_OWNERS = [1, 0, 2, 1, 3];
export const itemWithTax = (i: number) => BILL.items[i].amount * (1 + TAX_RATE);

// Names of the two split modes shown on the in-phone toggle.
export const MODE_LABELS = { equal: 'Equal', dutch: 'Dutch' };

export interface Person {
  id: string;
  name: string;
  fullName: string;
  avatar: string;
  dutch: number;
}

const person = (id: string, name: string, fullName: string, index: number): Person => ({
  id,
  name,
  fullName,
  avatar: `/assets/images/split/${id}.png`,
  dutch: Math.round(ITEM_OWNERS.reduce((sum, owner, i) => (owner === index ? sum + itemWithTax(i) : sum), 0)),
});

// The first three share the Equal split; all four share the Dutch one.
export const PEOPLE: Person[] = [
  person('you', 'You', 'You', 0),
  person('atharva', 'Atharva', 'Atharva Shewale', 1),
  person('parva', 'Parva', 'Parva Shah', 2),
  person('ruchi', 'Ruchi', 'Ruchita Shah', 3),
];
export const EQUAL_MEMBERS = 3;

// The Select Friends list. `pick` is the order they're ticked in; Bharti has no picture.
export const FRIEND_LIST = [
  { id: 'atharva', name: 'Atharva Shewale', pick: 0 },
  { id: 'bharti', name: 'Bharti', pick: -1, letter: 'B' },
  { id: 'parva', name: 'Parva Shah', pick: 1 },
  { id: 'ruchi', name: 'Ruchita Shah', pick: -1 },
];

export const TO_COLLECT = PEOPLE.slice(1).reduce((sum, p) => sum + p.dutch, 0);

export const inr = (n: number, decimals = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export const CAPTIONS = [
  // Equal
  { title: 'Split it equally.', body: 'Type the total, give it a name, tap Split.' },
  { title: "Pick who's in.", body: 'Tick your friends off the list.' },
  { title: 'Tell it who paid.', body: 'Whoever covered it gets paid back by everyone else.' },
  { title: 'Everyone’s share, to the paisa.', body: `${inr(EQUAL.amount, 0)} between ${EQUAL_MEMBERS} is ${inr(EQUAL.shares[0])} each.` },
  // Dutch
  { title: 'Or go Dutch.', body: 'When everyone had something different, start with the bill.' },
  { title: "Point your phone. That's it.", body: "OCR reads the bill for you, so there's nothing to type." },
  { title: 'Every line, already entered.', body: 'Items, taxes and the total land straight in the app.' },
  { title: 'Everyone pays for what they had.', body: 'Tag each item to a friend. Tax is shared out to match.' },
  { title: 'Sent. Everyone knows their share.', body: `${inr(TO_COLLECT, 0)} to collect from 3 friends.` },
];
