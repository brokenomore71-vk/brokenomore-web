import Navbar from '@/app/components/Navbar';
import { FEATURE_PAGES } from '@/lib/featurePages';
import FeatureScroll from '@/components/FeatureScroll';

// A feature's own page: the navbar, the feature's section, and a small "See more" button that
// carries on to the next feature. `bleed` lets a section run edge to edge; the split story's
// pinned section must sit in a plain block instead (pinning inside a flex box would drop its
// scroll space).
export default function FeaturePageShell({ slug, bleed = true, children }: { slug: string; bleed?: boolean; children: React.ReactNode }) {
  const index = FEATURE_PAGES.findIndex((f) => f.slug === slug);
  const next = FEATURE_PAGES[(index + 1) % FEATURE_PAGES.length];
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black">
      <Navbar />
      <div className="relative z-10 px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-[72px]">
        <FeatureScroll next={next}>
          <div className={bleed ? '-mx-4 w-[calc(100%+2rem)] select-none sm:-mx-6 sm:w-[calc(100%+3rem)]' : 'w-full select-none'} suppressHydrationWarning>
            {children}
          </div>
        </FeatureScroll>
      </div>
    </main>
  );
}
