# Financial Calculators

The website's version of the app's calculators: EMI, SIP, Lumpsum, SWP, FD and PPF. They use the same formulas as the app (`lib/pages/features_pages/calculators.dart`).

## Routes

| URL | What it shows |
|---|---|
| `/features/calculators` | A grid of cards, one per calculator |
| `/features/calculators/[calc]` | One calculator, e.g. `/features/calculators/emi` |

Each calculator is a real page, linked with Next's `<Link>`, so the phone's Back button and shared links work. Old `#emi`-style links redirect to the matching page.

## Files

| File | Role |
|---|---|
| `lib/calculators.ts` | The maths and each calculator's inputs (`CALCULATORS`), plus the `inr`, `compact` and `inWords` formatters |
| `CalculatorsHub.tsx` | The grid (default export) and one calculator's page (`CalculatorPage`): inputs, summary, 3D donut, and the "What is…" section |
| `calcArt.tsx` | The cards' 3D-style SVG illustrations |
| `app/features/calculators/page.tsx` | The grid page |
| `app/features/calculators/[calc]/page.tsx` | The calculator pages (pre-rendered with `generateStaticParams`) |
| `app/globals.css` | Slider styles (`.ch-range`) and the illustrations' float (`.ch-float`) |

## Adding a calculator

1. Add an entry to `CALCULATORS` in `lib/calculators.ts` with:
   - `key`, `name`, `short`, `blurb`;
   - its `fields` (unit `inr`, `pct` or `yrs`, with min, max, step and default, and `log: true` for amount sliders);
   - a `run` function that returns a `Result`.
2. Add its text to `DESCRIPTIONS` and `ABOUT` in `CalculatorsHub.tsx`.
3. Add its illustration to `calcArt.tsx`, and its icon key to the `CalcKey` type.

Its page and card are then created automatically.

## Notes

- **Colours:** violet `#6E5BFF` is invested or principal, and cyan `#1A9BBD` is returns or interest. The pair is checked for colour-blind separation on the dark background, so keep them together.
- **Periods:** every period is in whole years, as in the app. SIP and SWP use the effective monthly rate, `(1 + R)^(1/12) − 1`, so their results come out slightly below calculators that use R/12.
- **Animation:** tilt and hover effects only run with a mouse, and all motion is turned off for reduced-motion users.
- **Earlier designs:** three earlier versions are kept but switched off (commented out in `app/features/calculators/page.tsx`):
  - `CalculatorsSection.tsx` (3D deck and bench);
  - `CalculatorDesk.tsx` (editable sentence and skyline);
  - `CalculatorStudio.tsx` with `vesselScene.ts` (glass vessel).

  The `question`, `sentence` and `answer` fields in `lib/calculators.ts` are only used by `CalculatorDesk`.
