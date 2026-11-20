import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/app/components/Navbar';
import AboutHero from '@/components/about/AboutHero';
import Footer from '@/components/Footer';

const DESCRIPTION =
  'BrokeNoMore is a free personal finance app for India, built by Kushagra Gandhi and Vruddhi Madhani. Track, split, save, invest and plan your money, all in one place.';

export const metadata: Metadata = {
  title: 'About Us',
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { url: '/about', title: 'About Us | BrokeNoMore', description: DESCRIPTION },
};

const FOUNDERS = [
  {
    name: 'Kushagra Gandhi',
    role: 'Co-founder',
    photo: '/assets/images/founders/kushagra.jpeg',
    accent: 'from-[#E33CF0]/40',
    linkedin: 'https://www.linkedin.com/in/kushagra-gandhi-841274259/',
  },
  {
    name: 'Vruddhi Madhani',
    role: 'Co-founder',
    photo: '/assets/images/founders/vruddhi.jpeg',
    accent: 'from-[#22B8F0]/40',
    linkedin: 'https://www.linkedin.com/in/vruddhi-madhani-116815299/',
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#080808] text-white">
      <Navbar />

      {/* Soft violet light from the top, like the other pages' headers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(ellipse_at_top,rgba(107,70,193,0.22),transparent_62%)]"
      />

        {/* The animated mark and what the app does */}
        <AboutHero />

      {/* The founders */}
      <section className="relative mx-auto mt-24 max-w-4xl px-4 pb-24 sm:mt-32 sm:px-6 sm:pb-32">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A890E6]">The team</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Meet the founders</h2>
          <p className="mx-auto mt-3 max-w-lg text-neutral-400">The two people building BrokeNoMore.</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-8">
          {FOUNDERS.map((f) => (
            <a
              key={f.name}
              href={f.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${f.name} on LinkedIn (opens in a new tab)`}
              className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A890E6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
            >
              <figure
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f10] transition-colors duration-300 hover:border-white/20"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Image
                    src={f.photo}
                    alt={`${f.name}, ${f.role} of BrokeNoMore`}
                    fill
                    sizes="(min-width: 640px) 420px, 100vw"
                    className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  {/* Darkens the bottom so the name reads, tinted with the logo's colours */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${f.accent} via-transparent to-transparent opacity-60`} aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" aria-hidden="true" />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-2xl font-semibold tracking-tight">{f.name}</p>
                  <p className="mt-0.5 text-sm text-neutral-300">{f.role}</p>
                </figcaption>
              </figure>
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
