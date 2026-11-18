import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/app/components/Navbar';
import LogoMark from '@/components/about/LogoMark';

const DESCRIPTION =
  'BrokeNoMore is a free personal finance app for India, built by Kushagra Gandhi and Vruddhi Madhani. Track, split, save, invest and plan your money, all in one place.';

export const metadata: Metadata = {
  title: 'About Us',
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: { url: '/about', title: 'About Us | BrokeNoMore', description: DESCRIPTION },
};

const FOUNDERS = [
  { name: 'Kushagra Gandhi', role: 'Co-founder', photo: '/assets/images/founders/kushagra.jpeg', accent: 'from-[#E33CF0]/40' },
  { name: 'Vruddhi Madhani', role: 'Co-founder', photo: '/assets/images/founders/vruddhi.jpeg', accent: 'from-[#22B8F0]/40' },
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

      {/* The mark and what the app does */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-4 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:pt-36">
        <LogoMark className="mx-auto w-full max-w-[440px]" />

        <div className="text-center lg:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A890E6]">About us</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            One app for{' '}
            <span className="bg-gradient-to-r from-[#E33CF0] via-[#8B5CF6] to-[#22B8F0] bg-clip-text text-transparent">everything money.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg lg:mx-0">
            BrokeNoMore is a free personal finance app made in India. It brings everything you do with money into one simple place:
            tracking what you spend, splitting bills with friends, saving in digital gold, researching stocks with AI and planning
            your loans and bills, so staying on top of your finances never feels like a chore.
          </p>
        </div>
      </section>

      {/* The founders */}
      <section className="relative mx-auto mt-24 max-w-4xl px-4 pb-24 sm:mt-32 sm:px-6 sm:pb-32">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#A890E6]">The team</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Meet the founders</h2>
          <p className="mx-auto mt-3 max-w-lg text-neutral-400">The two people building BrokeNoMore.</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-8">
          {FOUNDERS.map((f) => (
            <figure
              key={f.name}
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
          ))}
        </div>
      </section>
    </main>
  );
}
