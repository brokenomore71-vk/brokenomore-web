import type { MetadataRoute } from 'next';
import { FEATURE_PAGES } from '@/lib/featurePages';
import { CALCULATORS } from '@/lib/calculators';
import { SITE_URL } from '@/lib/site';

// /sitemap.xml: every page search engines should index, built from the same lists the site uses,
// so a new feature or calculator page is listed automatically
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' | 'yearly') => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page('', 1, 'weekly'),
    ...FEATURE_PAGES.map((f) => page(f.href, 0.9, 'monthly')),
    ...CALCULATORS.map((c) => page(`/features/calculators/${c.key}`, 0.8, 'monthly')),
    page('/privacy', 0.3, 'yearly'),
    page('/terms', 0.3, 'yearly'),
    page('/delete-account', 0.3, 'yearly'),
  ];
}
