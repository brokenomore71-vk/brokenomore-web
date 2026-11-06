// All the story's numbers live here, and every share below adds up to BILL.total.

export const BILL = {
  merchant: 'SAFFRON TABLE',
  splitName: 'Saffron Table',
  groupName: 'Friday Dinner',
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

// Names of the two split modes shown on the in-phone toggle.
export const MODE_LABELS = { equal: 'Equal', dutch: 'Dutch' };

export interface Person {
  id: string;
  name: string;
  avatar: string;
  equal: number;
  dutch: number;
}

export const PEOPLE: Person[] = [
  { id: 'you', name: 'You', avatar: '/assets/images/split/you.png', equal: 546, dutch: 684 },
  { id: 'atharva', name: 'Atharva', avatar: '/assets/images/split/atharva.png', equal: 546, dutch: 560 },
  { id: 'parva', name: 'Parva', avatar: '/assets/images/split/parva.png', equal: 546, dutch: 480 },
  { id: 'ruchi', name: 'Ruchi', avatar: '/assets/images/split/ruchi.png', equal: 546, dutch: 460 },
];

export const TO_COLLECT = PEOPLE.slice(1).reduce((sum, p) => sum + p.dutch, 0);

export const inr = (n: number, decimals = 2) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export const CAPTIONS = [
  { title: 'Every split starts with a bill.', body: "The table's done, the machine's printing, and someone has to do the maths." },
  { title: "Point your phone. That's it.", body: "OCR reads the bill for you, so there's nothing to type." },
  { title: 'Every line, already entered.', body: 'Items, taxes and the total land straight in the app.' },
  { title: 'Split it with a friend.', body: 'Pick someone and halve it in a tap.' },
  { title: 'Or the whole group, equally.', body: 'Everyone pays the same share.' },
  { title: 'Or go Dutch.', body: 'Everyone pays for what they had.' },
  { title: 'Sent. Everyone knows their share.', body: `${inr(TO_COLLECT, 0)} to collect from 3 friends.` },
];
