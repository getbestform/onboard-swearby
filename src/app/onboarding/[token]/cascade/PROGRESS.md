# Feature Cascade — progress doc

Last touched: 2026-04-14

## What this is

A scroll-driven comparison animation at the end of the `WelcomeStep` flow.
Seven vertical competitor logos sit pinned at the viewport meridian; feature
bars ("Online Booking", "Payment Processing", …) rise from below, cross
through the meridian, and exit the top. When a feature is a "kill" for a
competitor, that competitor's logo glues to the bar and gets carried off the
top of the viewport. After PatientNow dies, Swearby is alone and its line
transitions from green to gold (the Coronation). Five Swearby-only features
then pass through the gold line, followed by the Victor screen ("They're
built to take your money.") and the Book-a-Call screen ("We're built to make
you money.").

Open `?phase=cascade` on any onboarding URL to jump straight into the cascade
and skip the preceding phases.

## File map

```
src/app/onboarding/[token]/
├── page.tsx                    ← adds SSR <link rel="preload"> for logos
├── OnboardingForm.tsx          ← forces phase=welcome when ?phase=cascade
├── WelcomeStep.tsx             ← returns <FeatureCascade /> when phase >= 4
└── cascade/
    ├── data.ts                 ← COMPETITORS + FEATURES + CORONATION_INDEX
    ├── FeatureCascade.tsx      ← main scroll-driven component
    ├── StickyNav.tsx           ← forest-green sticky nav (Swearby / Guest / Book Call)
    ├── VictorScreen.tsx        ← crown + "They're built to take your money."
    └── BookACallScreen.tsx     ← "We're built to make you money." + CTA + calendar placeholder
```

## Architecture

### Stacking (three layers, absolute positioned inside a 100vh sticky box)

| z   | Layer       | Contains                                                           |
| --- | ----------- | ------------------------------------------------------------------ |
| 0   | Lines       | Solid gold above the logo, dotted gold below, with a 58 px gap    |
| 10  | Feature bars| Pills that scroll past the meridian (pass *behind* the logos)      |
| 20  | Logos       | Vertical competitor logos (always on top, per Figma)               |

Line and logo layers use the same symmetric inset — `top/bottom: clamp(120px, 18vh, 200px)` — so each column aligns and the meridian lands exactly at `50vh` (viewport center).

### Scroll math

```
N         = 16 features
SLOT_VH   = 55    // scroll cost per feature
OUTRO_VH  = 60    // scroll cost of the outro dwell
TOTAL_VH  = N * SLOT_VH + OUTRO_VH
```

The section is `height: TOTAL_VH vh` and contains a `position: sticky; top: 0; h-screen` child that pins while scrolling through the section. `useScroll({ target: sectionRef, offset: ['start start', 'end end'] })` gives `scrollYProgress: 0 → 1`.

Feature `i` is at meridian at `scrollYProgress = (i + 0.5) * slot`.

### Bar motion

- **Y**: `+50vh → 0 → −50vh` across the slot (viewport bottom-edge → center → top-edge).
- **First-frame**: feature 0 is pre-positioned at `+15vh` so the Online Booking pill is visible just below the logos on page load (matches the static Phase 4 mockup).
- **Opacity**: 4-stop curve at slot positions `0% / 20% / 60% / 100%` → `0 / 1 / 1 / 0`. Fast reveal on entry, long plateau including the meridian crossing, gentle 40 %-of-slot fade-out as the bar drifts off the top.

### Logo death ("glue & lift")

`useLogoTransform` returns a full `useMotionTemplate` string:

```
translate(-50%, calc(-50% + {yVh}vh + {yPx}px))
```

- `yVh`: `0 → 0 → -50` across `[attachStart, deathMid, deathMid + halfSpan]`
- `yPx`: `0 → -80` across `[attachStart, deathMid]` (logo half + 0.5 rem + bar half)

The `px` portion keeps the 0.5 rem gap exact across viewport heights; the `vh` portion makes the glued logo travel with the bar. `attachStart = deathMid − 0.2·halfSpan` gives a small pre-impact snap so the motion doesn't look instantaneous.

Survivors stay at meridian — no reflow. Dead-logo slots remain empty (the spec calls for gaps: "they couldn't make it").

### Coronation (green → gold)

`useSwearbyLineGoldOpacity` fades a gold overlay onto the Swearby line across `[CORONATION_FEATURE_INDEX meridian, + halfSpan]`. `CORONATION_FEATURE_INDEX = 10` (the moment Multi-Pharmacy Routing kills PatientNow).

### Preload

`page.tsx` renders `<link rel="preload" as="image" href={c.logo}>` for every competitor in the initial SSR HTML so the browser starts fetching logos before hydration. The `<img>` tags also set `loading="eager"` and `fetchPriority="high"`.

## Why motion values use `useMotionTemplate` for transforms

Motion's `y` shorthand and CSS `translateY(-50%)` on the same element clobber each other — the self-center gets lost and the pill/logo ends up with its top edge on the meridian instead of centered. To dodge this:

- **FeatureBar**: outer `motion.div` owns `y` + `opacity`; an inner plain `<div>` owns `translateY(-50%)`. Two separate elements, two separate transforms.
- **LogoCell**: single `motion.div` whose `transform` is a complete `useMotionTemplate` string containing both the `-50% -50%` self-center and the scroll-driven `y` (vh + px) in one expression.

## Tuning knobs

| Knob                        | File                   | Notes                                        |
| --------------------------- | ---------------------- | -------------------------------------------- |
| `SLOT_VH`                   | FeatureCascade.tsx     | Raise for slower scroll pacing               |
| `FIRST_FRAME_Y_VH`          | FeatureCascade.tsx     | Where feature 0 sits at scroll=0             |
| Opacity curve stops         | `useFeatureBarOpacity` | Currently 0/20/60/100                        |
| `GLUE_OFFSET_PX`            | FeatureCascade.tsx     | Gap between dying logo and kill bar (80 px) |
| `LOGO_HALF_GAP`             | FeatureCascade.tsx     | Line cutout around the logo (58 px)         |
| Line container inset        | main render            | `clamp(120px, 18vh, 200px)` top & bottom    |
| Headline top                | main render            | `clamp(80px, 10vh, 120px)`                  |

## Open items / known iteration points

- **Victor screen**: rebuilt responsively in HTML + minimal SVG for trophy + vertical "Swearby Victor" rotated text. The user offered a Figma SVG file — if dropped at `public/victor-screen.svg`, we can swap to pixel-perfect fidelity.
- **Book a Call CTA**: plain `<a href="#">` for now (per user). The calendar embed is a grey placeholder; `@calcom/embed-react` is already installed for a later wire-up.
- **Sticky nav "BOOK CALL" link**: same, plain `<a>` scrolling to `#book-a-call`.
- **Cross-device QA**: tested on 430×932 (iPhone 14 Pro Max emulation). Needs a pass on short viewports (iPhone SE 667 px) and large desktops.

## Feedback history (for reference during iteration)

1. Line ran through the face of each logo → carved a `LOGO_HALF_GAP` cutout.
2. Pill was below viewport at scroll=0 → added `FIRST_FRAME_Y_VH` so Online Booking is visible immediately.
3. Scroll-up popped back to Phase 3 → gated `go()` on `phaseRef.current >= TOTAL_PHASES`.
4. Glued logo overlapped kill bar → 80 px `calc()` offset via `useMotionTemplate`.
5. Lines looked boxy → `mask-image` gradient on top/bottom 22 %.
6. Replaced my placeholder scroll-down with the original 35×51 SVG from Phase 4.
7. Logos loading one-by-one → SSR preload links in `page.tsx`.
8. Opacity was 0/100/0 curve → switched to 0/20/60/100.
9. Bars "appeared past 70 %" and didn't fully exit top → pinned meridian to `50vh` (viewport center) with absolute positioning, so 50vh offsets genuinely reach viewport edges on any screen.
10. Lines ran floor-to-ceiling → symmetric `clamp()` inset.
11. Bars overlapping logos → three-layer stacking (logos z-20, bars z-10, lines z-0).
