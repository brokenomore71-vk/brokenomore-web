import { Bricolage_Grotesque, Bebas_Neue } from 'next/font/google';

// The site's one typeface: Bricolage Grotesque. Confident and a little quirky in big headlines,
// clean in small text (its optical-size axis adjusts the letters to the size they're set at).
// Loaded once here and used everywhere: the page through the --font-brand variable, and the
// canvas-drawn story layers through brand.style.fontFamily.
export const brand = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-brand',
});

// Bold condensed display face for the Predictive Prosperity hero headline
export const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bebas',
});
