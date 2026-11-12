import { Bricolage_Grotesque } from 'next/font/google';

// The site's one typeface: Bricolage Grotesque. Confident and a little quirky in big headlines,
// clean in small text (its optical-size axis adjusts the letters to the size they're set at).
// Loaded once here and used everywhere: the page through the --font-brand variable, and the
// canvas-drawn story layers through brand.style.fontFamily.
export const brand = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-brand',
});
