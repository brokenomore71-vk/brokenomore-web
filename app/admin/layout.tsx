import type { Metadata } from 'next';

// The admin area is unlisted: not in the sitemap, not linked from the site, and kept out of
// search engines (here and through the X-Robots-Tag header in next.config.ts).
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#1C1C20] text-[#F5F5F5]">{children}</div>;
}
