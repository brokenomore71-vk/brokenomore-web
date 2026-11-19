// Frame 4 of the digital gold section: four tiles spelling G O L D, one big gold letter in each,
// with a feature of digital gold under each tile and a heading about digital gold above them all.
// The section's scroll timeline brings them in through the data-g hooks.

import { FEATURES } from './GoldFeatureCards';

const LETTERS = ['G', 'O', 'L', 'D'];

// The four tiles' widths are held to what fits the screen's height too (the heading and the
// captions take about 390px)
const ROW_WIDTH = 'min(1180px, 100%, calc((100svh - 72px - 390px) * 4 + 72px))';

export default function GoldWord() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-5 sm:px-8">
      {/* What digital gold is, above the tiles */}
      <div data-g="f4-heading" className="mb-6 max-w-3xl text-center sm:mb-8 lg:mb-10">
        <h2 className="text-[26px] xs:text-[30px] font-semibold leading-[1.1] tracking-tight text-[#F5F5F5] sm:text-4xl lg:text-5xl">
          Digital gold, made <span className="text-[#F5D76E]">simple.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-xs xs:text-sm leading-snug tracking-tight text-neutral-400 sm:mt-3 sm:text-base">
          Own 24K gold without a locker. Buy it, keep an eye on what you hold, have it delivered or sell it, all
          from one app.
        </p>
      </div>

      {/* The tiles: two by two on small screens, a row of four on wider ones */}
      <div className="grid w-full grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-6" style={{ maxWidth: ROW_WIDTH }}>
        {LETTERS.map((letter, i) => (
          <div key={letter} data-g="f4-tile">
            <div
              // A plain grey tile, lifted off the page by its shadow
              className="relative aspect-square overflow-hidden rounded-2xl bg-[#1c1c1e] ring-1 ring-white/[0.06] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9),0_4px_12px_rgba(0,0,0,0.6)]"
              style={{ containerType: 'inline-size' }}
            >
              {/* The letter */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  data-g="f4-letter"
                  className="inline-block font-bold leading-none"
                  style={{
                    fontSize: '64cqw',
                    backgroundImage: 'linear-gradient(180deg, #FFF4C8 0%, #F5D76E 30%, #D4AF37 60%, #8C6B20 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                  aria-hidden="true"
                >
                  {letter}
                </span>
              </div>
            </div>
            <div data-g="f4-caption" className="mt-3 sm:mt-4">
              <p className="text-[14px] sm:text-[15px] lg:text-[19px] font-semibold tracking-tight text-[#F5F5F5]">{FEATURES[i].label}</p>
              <p className="mt-1 text-[11.5px] sm:text-[12px] lg:text-[15px] leading-snug text-neutral-400">{FEATURES[i].body}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Read as one word by screen readers */}
      <span className="sr-only">GOLD</span>
    </div>
  );
}
