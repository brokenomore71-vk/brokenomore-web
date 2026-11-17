import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrokeNoMore: Expense Tracker & Personal Finance',
    short_name: 'BrokeNoMore',
    description:
      'All-in-one personal finance app for India: track expenses, split bills, buy digital gold, analyze stocks with AI, and plan loans.',
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#080808',
    icons: [
      {
        src: '/icon.png',
        sizes: '101x101',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '101x101',
        type: 'image/png',
      },
    ],
    categories: ['finance', 'productivity', 'utilities'],
  };
}
