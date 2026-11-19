import type { MetadataRoute } from 'next';
import { FEATURE_PAGES } from '@/lib/featurePages';
import { CALCULATORS } from '@/lib/calculators';
import { SITE_URL } from '@/lib/site';

// /sitemap.xml: every page search engines should index, built dynamically from feature & calculator lists.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  ) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page('', 1.0, 'daily'),
    ...FEATURE_PAGES.map((f) => page(f.href, 0.9, 'weekly')),
    ...CALCULATORS.map((c) => page(`/features/calculators/${c.key}`, 0.85, 'weekly')),
    page('/about', 0.6, 'monthly'),
    page('/privacy', 0.3, 'yearly'),
    page('/terms', 0.3, 'yearly'),
    page('/delete-account', 0.3, 'yearly'),
  ];
}
