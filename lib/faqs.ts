// The website's FAQs, as edited in /admin/content/faqs. They live in the app backend (GET /faqs?platform=web,
// chatbot_backend/app/routers/faqs.py) next to the app's own copy, so one edit reaches both. Server-side only.
//
// The page is regenerated at most once a minute, so an admin's change shows up within about a minute. If the
// backend can't be reached, the built-in copy in lib/faqData.ts is shown instead, so the section never breaks.

import { FAQ_CATEGORIES, type FAQCategory } from '@/lib/faqData';
import { CMS_API_URL } from '@/lib/site';

const API = CMS_API_URL;
export const FAQ_REVALIDATE_SECONDS = 60;

type ApiResponse = { categories?: { name: string; items: { id: string; question: string; answer: string }[] }[] };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general';

export async function getWebFaqs(): Promise<FAQCategory[]> {
  if (!API) return FAQ_CATEGORIES;
  try {
    const res = await fetch(`${API}/faqs?platform=web`, {
      next: { revalidate: FAQ_REVALIDATE_SECONDS, tags: ['faqs'] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as ApiResponse;
    if (!Array.isArray(body.categories)) throw new Error('unexpected response');
    return body.categories
      .filter((c) => c.items?.length)
      .map((c, i) => ({
        id: `${slug(c.name)}-${i}`,
        name: c.name,
        items: c.items.map((q) => ({ id: q.id, question: q.question, answer: q.answer })),
      }));
  } catch (e) {
    console.error('[faqs] using the built-in FAQs:', e instanceof Error ? e.message : e);
    return FAQ_CATEGORIES;
  }
}
