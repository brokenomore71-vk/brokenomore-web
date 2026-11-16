import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import LegalToc from './LegalToc';

// Shared frame for the Privacy, Terms and Delete Account pages: the navbar, a title block, a
// sticky contents list beside the text on wide screens, and links to the other two pages at the end.

export type TocItem = { id: string; title: string };

const LEGAL_PAGES = [
  { href: '/privacy', name: 'Privacy Policy' },
  { href: '/terms', name: 'Terms & Conditions' },
  { href: '/delete-account', name: 'Delete Account' },
];

export default function LegalLayout({
  eyebrow,
  title,
  updated,
  intro,
  toc,
  current,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  intro?: React.ReactNode;
  toc: TocItem[];
  current: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#121212]">
      <Navbar />

      {/* Title block */}
      <header className="border-b border-[#232323] bg-[radial-gradient(ellipse_at_top,rgba(107,70,193,0.18),transparent_60%)]">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-32 sm:px-6 sm:pb-16 sm:pt-36">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A890E6]">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">{title}</h1>
          {updated && <p className="mt-5 text-sm text-neutral-500">Last updated: {updated}</p>}
          {intro && <div className="mt-8 max-w-3xl space-y-3 text-base leading-relaxed text-neutral-300 sm:text-lg">{intro}</div>}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <LegalToc items={toc} />
          </div>
        </aside>

        <article className="min-w-0 max-w-3xl space-y-14 text-[15px] leading-relaxed text-neutral-400 sm:text-base">
          {children}

          {/* The other legal pages */}
          <nav aria-label="Legal pages" className="border-t border-[#232323] pt-10">
            <div className="flex flex-wrap gap-3">
              {LEGAL_PAGES.filter((p) => p.href !== current).map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="rounded-full border border-[#2a2a2a] px-5 py-2.5 text-sm text-neutral-300 transition-colors hover:border-[#6B46C1] hover:text-white"
                >
                  {p.name}
                </Link>
              ))}
            </div>
            <Link href="/" className="mt-8 inline-block text-sm font-medium text-[#C9B8F0] hover:text-white">
              ← Back to Home
            </Link>
          </nav>
        </article>
      </div>
    </main>
  );
}

// ---- Content building blocks, so the three pages read as plain text ----

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="mb-5 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-4 text-lg font-medium text-neutral-100">{children}</h3>;
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="relative pl-5">
          <span aria-hidden="true" className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-[#6B46C1]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#181818] p-5 text-neutral-200 sm:p-6">{children}</div>
  );
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-neutral-100">{children}</strong>;
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http');
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="font-medium text-[#C9B8F0] underline decoration-[#6B46C1] underline-offset-4 hover:text-white"
    >
      {children}
    </a>
  );
}
