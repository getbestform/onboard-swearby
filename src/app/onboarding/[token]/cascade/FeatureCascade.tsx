'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate, type MotionValue } from 'motion/react'
import { COMPETITORS, FEATURES, CORONATION_FEATURE_INDEX, COLORS, type Competitor } from './data'
import { BookACallScreen } from './BookACallScreen'

// useLayoutEffect warns on the server; swap to useEffect during SSR so the
// override still applies synchronously on the client without a hydration warning.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Motion's `useTransform(value, inputArray, outputArray, { clamp: true })` opts
// the value into WAAPI-accelerated scroll-driven animation. That path doesn't
// clamp correctly for multi-stop keyframes — values past the last input leak
// non-zero outputs, which shows up as ghost opacity on bars that should be
// fully gone. Passing a *function* transformer forces the JS interpolation
// path, which clamps properly. This helper builds a clamped piecewise-linear
// transformer from parallel input/output arrays.
function piecewise(inputs: number[], outputs: number[]): (v: number) => number {
  return v => {
    if (v <= inputs[0]) return outputs[0]
    const last = inputs.length - 1
    if (v >= inputs[last]) return outputs[last]
    for (let i = 0; i < last; i++) {
      const a = inputs[i]
      const b = inputs[i + 1]
      if (v <= b) {
        if (b === a) return outputs[i + 1]
        const t = (v - a) / (b - a)
        return outputs[i] + t * (outputs[i + 1] - outputs[i])
      }
    }
    return outputs[last]
  }
}

// --- Scroll pacing --------------------------------------------------------
//
// The cascade scrolls past a sticky viewport. Progress 0→1 maps to the full
// height of the sticky section. We carve it into three zones:
//
//   [0, introEnd)        : intro — split into two sequential sub-phases so
//                          they don't visually compete:
//                            • [0, headlineFadeEnd]        headline fades
//                            • [headlineFadeEnd, introEnd] lines reveal
//                          Feature 0 stays parked at STICK_Y_VH the whole time.
//   [introEnd, outroStart): main cascade — each feature gets one slot of
//                          scroll distance and enters/dwells/exits.
//   [outroStart, 1]      : outro — starts as a brief dwell on Swearby alone,
//                          then the Victor climax plays (crown drops, lines
//                          transform, "They're built to take your money."
//                          rises in). See CLIMAX_* constants below.
//
// Tune these to taste.
const N = FEATURES.length
const INTRO_VH = 45          // total intro budget (headline fade + line reveal)
const INTRO_HEADLINE_FRAC = 0.55   // first 55 % = headline fade, rest = line reveal
const SLOT_VH = 55          // scroll cost per feature
const OUTRO_VH = 150         // outro dwell + climax + end-frame hold
const TOTAL_VH = INTRO_VH + N * SLOT_VH + OUTRO_VH

const introEnd = INTRO_VH / TOTAL_VH
const headlineFadeEnd = introEnd * INTRO_HEADLINE_FRAC
const outroStart = (INTRO_VH + N * SLOT_VH) / TOTAL_VH
const slot = SLOT_VH / TOTAL_VH
const halfSpan = slot / 2

// --- Outro climax sub-phases ---------------------------------------------
//
// Fractions of the outro span at which each climax phase ends. The outro
// starts with a brief dwell, then plays the victor sequence, then holds.
//
//   [outroStart,      climaxDwellEnd] : hold the cascade end-state briefly
//   [climaxDwellEnd,  climaxCrownEnd] : crown drops in, above-line fades out
//   [climaxCrownEnd,  climaxLineEnd]  : below-line cross-fades dotted→solid
//                                        and its mask shrinks to a short
//                                        gold→cream gradient line
//   [climaxLineEnd,   climaxTextEnd]  : headline fades in + rises
//   [climaxTextEnd,   1]              : hold the end frame so the user can
//                                        read before scrolling to book-a-call
const CLIMAX_DWELL_FRAC = 0.08
const CLIMAX_CROWN_FRAC = 0.32
const CLIMAX_LINE_FRAC = 0.55
const CLIMAX_TEXT_FRAC = 0.82
const outroSpan = 1 - outroStart
const climaxDwellEnd = outroStart + CLIMAX_DWELL_FRAC * outroSpan
const climaxCrownEnd = outroStart + CLIMAX_CROWN_FRAC * outroSpan
const climaxLineEnd = outroStart + CLIMAX_LINE_FRAC * outroSpan
const climaxTextEnd = outroStart + CLIMAX_TEXT_FRAC * outroSpan

// Feature i is at the **centre of its slot** at this scroll progress. With
// the new stick-below-logos model the pill is NOT actually at y=0 here — it's
// dwelling at STICK_Y_VH. See useFeatureBarY / pillCrossLogos below.
function featureMeridian(i: number): number {
  return introEnd + (i + 0.5) * slot
}

// --- Headline opacity -----------------------------------------------------
//
// The Phase-4-style "Your software is holding you back." headline is visible
// at scroll 0 (matching the static mockup). It fades out during the FIRST
// sub-phase of the intro — before the line reveal starts — so the two
// transitions don't overlap.
function useHeadlineOpacity(scrollYProgress: MotionValue<number>) {
  return useTransform(scrollYProgress, piecewise([0, headlineFadeEnd], [1, 0]))
}

// --- Intro line reveal ----------------------------------------------------
//
// Phase 4 (scroll = 0) shows ONLY the logos with solid gold lines trailing
// *below* them — there's nothing above. After the headline is gone, three
// things happen together to prep the stage for the cascade:
//
//   1. The above-logo lines draw in from the logo edge upward (scaleY 0→1,
//      anchored at the bottom of the line element).
//   2. The below-logo SOLID lines fade out.
//   3. The below-logo DOTTED overlay fades in.
//
// This runs in the SECOND sub-phase of the intro [headlineFadeEnd, introEnd]
// so it doesn't overlap the headline fade.
function useAboveLineScaleY(scrollYProgress: MotionValue<number>) {
  return useTransform(scrollYProgress, piecewise([headlineFadeEnd, introEnd], [0, 1]))
}
function useBelowLineSolidOpacity(scrollYProgress: MotionValue<number>) {
  return useTransform(scrollYProgress, piecewise([headlineFadeEnd, introEnd], [1, 0]))
}
function useBelowLineDottedOpacity(scrollYProgress: MotionValue<number>) {
  return useTransform(scrollYProgress, piecewise([headlineFadeEnd, introEnd], [0, 1]))
}

// --- Stick position -------------------------------------------------------
//
// Every feature pill has the SAME resting spot: STICK_Y_VH below the meridian
// (i.e., just below the logo row). This matches the static Phase 4 mockup
// where "Online Booking" sits below the logos with breathing room. Pills
// enter from far below, rise to STICK_Y_VH, dwell there, then exit upward
// through the logos and off the top.
const STICK_Y_VH = 15

// --- Bar timing within a slot --------------------------------------------
//
// Every slot carves its scroll budget into three phases so each feature has
// time to read, not just flash past:
//
//   [ 0 %, DWELL_START ]  : enter — bar slides from +50vh up to meridian
//   [ DWELL_START, DWELL_END ]  : dwell — bar sits at meridian
//   [ DWELL_END, 100 % ]  : exit  — bar slides from meridian up to −50vh
//
// The opacity curve wraps those: fade-in finishes just before the dwell,
// full opacity is held through the dwell AND the first part of exit (while
// the pill is rising across the logo row), and fade-out only begins once the
// pill has visibly cleared the logos. That way the label is at full read
// while it's overlapping the logo — the exact moment it matters most.
//
// DWELL_END is relatively early (0.55) so the exit phase gets ~45% of the
// slot — enough scroll distance that the pill reads as rising rather than
// snapping off the top.
const DWELL_START = 0.25
const DWELL_END = 0.55
const FADE_IN_END = 0.20    // opacity reaches 1 just before the dwell starts

// Fraction into the exit phase at which fade-out begins. The pill crosses
// the logo row (y=0) at EXIT_CROSS_FRAC ≈ 0.23 of exit; we hold full opacity
// past that — around 0.4 of exit the pill is at y ≈ -11vh, visibly clear of
// the logos — then fade to 0 across the rest of the exit. Earlier values
// start the fade while the label still overlaps the logos, which reads as
// "vanishing too soon".
const EXIT_FADE_FRAC = 0.4

// Feature 0 is already parked at STICK_Y_VH throughout the intro — the user
// has been looking at it the whole time the lines draw in, so there's nothing
// left for a conventional dwell to earn. Give it the shortest possible hold
// and let the exit fill the rest of the slot. Side effect: no dead scroll
// between the intro ending and feature 1 arriving (feature 0's slow exit
// bridges the gap).
const DWELL_END_FIRST = 0.1

// --- Bar opacity ----------------------------------------------------------
//
// Feature 0 is already visible at scroll 0 (matches the static Phase 4 mockup)
// so it skips the fade-in and only fades on exit.
function useFeatureBarOpacity(i: number, scrollYProgress: MotionValue<number>) {
  const mid = featureMeridian(i)
  const slotLen = 2 * halfSpan
  const slotStart = mid - halfSpan
  const inOnly = i === 0
  const dwellEnd = inOnly ? DWELL_END_FIRST : DWELL_END
  // Fade begins partway into the exit phase so the pill stays solid while
  // it's passing through the logos. In slot-fraction terms:
  //   fadeOutStart = dwellEnd + EXIT_FADE_FRAC * (1 - dwellEnd)
  // The parameterisation in *exit fraction* (not slot fraction) keeps the
  // effective pill-y at fade-start the same across features — feature 0's
  // exit spans 0.9 of its slot while others span 0.45, but both fade from
  // the same point in space.
  const fadeOutStart = dwellEnd + EXIT_FADE_FRAC * (1 - dwellEnd)
  const inputs = inOnly
    ? [0, slotStart + fadeOutStart * slotLen, slotStart + slotLen]
    : [
      slotStart,
      slotStart + FADE_IN_END * slotLen,
      slotStart + fadeOutStart * slotLen,
      slotStart + slotLen,
    ]
  const outputs = inOnly ? [1, 1, 0] : [0, 1, 1, 0]
  return useTransform(scrollYProgress, piecewise(inputs, outputs))
}

// --- Bar Y motion ---------------------------------------------------------
//
// Each feature bar enters from below (+50vh), rises to STICK_Y_VH (the same
// "below logos" position the Phase 4 mockup uses for Online Booking), dwells
// there, then exits upward through the logos to −50vh. Feature 0 is pre-
// positioned at STICK_Y_VH at scroll 0 and stays there through the intro.
//
// Returns a scalar MotionValue<number> in vh units (not a string). The caller
// composes the final transform with useMotionTemplate so that `vh` resolves
// correctly in the CSS.
function useFeatureBarY(i: number, scrollYProgress: MotionValue<number>): MotionValue<number> {
  const mid = featureMeridian(i)
  const slotLen = 2 * halfSpan
  const slotStart = i === 0 ? introEnd : mid - halfSpan
  const enterY = i === 0 ? STICK_Y_VH : 50
  const dwellEnd = i === 0 ? DWELL_END_FIRST : DWELL_END
  return useTransform(
    scrollYProgress,
    piecewise(
      [
        slotStart,
        slotStart + DWELL_START * slotLen,
        slotStart + dwellEnd * slotLen,
        slotStart + slotLen,
      ],
      [enterY, STICK_Y_VH, STICK_Y_VH, -50],
    ),
  )
}

// --- Pill-crosses-logos timing -------------------------------------------
//
// During its exit phase (slot fraction [DWELL_END, 1]), a pill's y goes from
// +STICK_Y_VH (below logos) to −50 vh (above viewport). It crosses y = 0
// (the logos' resting line) at this fraction of the slot — that's the moment
// the killing pill visually meets the competitor logo. The dying logo uses
// this as its attach point so the hand-off is seamless (no snap).
const EXIT_CROSS_FRAC = STICK_Y_VH / (STICK_Y_VH + 50)        // 15 / 65 ≈ 0.231
const CROSS_SLOT_FRAC = DWELL_END + EXIT_CROSS_FRAC * (1 - DWELL_END)  // ≈ 0.808

// Scroll progress where feature i's pill crosses the logo row (y = 0).
function pillCrossLogos(i: number): number {
  return introEnd + (i + CROSS_SLOT_FRAC) * slot
}

// --- Dying logo transform -------------------------------------------------
//
// A dying logo's lifecycle has three moments:
//
//   snapStart  = crossAt − SNAP_SLOT_FRAC·slot
//     Logo begins lifting off its resting line toward the glue position
//     (GLUE_OFFSET_PX above the pill). This pre-empts the pill's arrival so
//     the two never look like they're jumping into each other.
//
//   crossAt    = pillCrossLogos(d)
//     The killing pill reaches y = 0. Logo is now at −GLUE_OFFSET_PX — a
//     clean 80 px above the pill. They're glued.
//
//   slotEnd    = end of d's slot
//     Pill is at −50 vh. Logo is at −50 vh − GLUE_OFFSET_PX — still 80 px
//     above. Both off-screen.
//
// During [snapStart, crossAt] only the px offset moves (logo "lifts"); during
// [crossAt, slotEnd] only the vh moves (logo "rides" with the pill at
// constant offset). The motion template composes both.
const GLUE_OFFSET_PX = 80
const SNAP_SLOT_FRAC = 0.05         // how much of a slot the pre-lift consumes
function useLogoTransform(competitor: Competitor, scrollYProgress: MotionValue<number>): MotionValue<string> {
  const d = competitor.deathFeatureIndex
  // Non-dying (Swearby): dummy monotonic range — piecewise gives constant 0.
  const crossAt = d != null ? pillCrossLogos(d) : 0.5
  const slotEnd = d != null ? introEnd + (d + 1) * slot : 1
  const snapStart = d != null ? crossAt - SNAP_SLOT_FRAC * slot : 0
  const yVh = useTransform(
    scrollYProgress,
    piecewise(
      [snapStart, crossAt, slotEnd],
      d != null ? [0, 0, -50] : [0, 0, 0],
    ),
  )
  const yPx = useTransform(
    scrollYProgress,
    piecewise(
      [snapStart, crossAt, slotEnd],
      d != null ? [0, -GLUE_OFFSET_PX, -GLUE_OFFSET_PX] : [0, 0, 0],
    ),
  )
  return useMotionTemplate`translate(-50%, calc(-50% + ${yVh}vh + ${yPx}px))`
}

// --- Logo opacity (fades near the end of its death ride) -----------------
function useLogoOpacity(competitor: Competitor, scrollYProgress: MotionValue<number>) {
  const d = competitor.deathFeatureIndex
  const crossAt = d != null ? pillCrossLogos(d) : 0
  const slotEnd = d != null ? introEnd + (d + 1) * slot : 1
  // Opaque through the first 60 % of the ride (snap + most of the ascent),
  // then fade to 0 by slotEnd so the logo doesn't clip the viewport edge.
  const plateauEnd = crossAt + 0.6 * (slotEnd - crossAt)
  return useTransform(
    scrollYProgress,
    piecewise(
      [crossAt, plateauEnd, slotEnd],
      d != null ? [1, 1, 0] : [1, 1, 1],
    ),
  )
}

// --- Line opacity per logo (fades fast as the logo begins to lift) -------
function useLineOpacity(competitor: Competitor, scrollYProgress: MotionValue<number>) {
  const d = competitor.deathFeatureIndex
  const crossAt = d != null ? pillCrossLogos(d) : 0
  const slotEnd = d != null ? introEnd + (d + 1) * slot : 1
  const snapStart = d != null ? crossAt - SNAP_SLOT_FRAC * slot : 0
  // Fade begins at snapStart (when the logo starts to lift) and finishes
  // within the first 30 % of the remaining slot, then stays at 0.
  const fadeEnd = snapStart + 0.3 * (slotEnd - snapStart)
  return useTransform(
    scrollYProgress,
    piecewise([snapStart, fadeEnd, 1], d != null ? [1, 0, 0] : [1, 1, 1]),
  )
}

// --- Swearby line gold transition (Coronation) ----------------------------
//
// After PatientNow dies (feature index 10), the Swearby line fades from
// green to gold across 0.5 of a slot.
function useSwearbyLineGoldOpacity(scrollYProgress: MotionValue<number>) {
  const start = featureMeridian(CORONATION_FEATURE_INDEX)
  return useTransform(scrollYProgress, piecewise([start, start + halfSpan], [0, 1]))
}

// --- Outro climax hooks ---------------------------------------------------
//
// After the last feature exits, the outro plays the victor moment:
//   1. Crown drops from above and lands just above the Swearby logo.
//   2. The above-logo line (and Swearby gold overlay) fade out.
//   3. The below-logo dotted line cross-fades to solid while its mask
//      shrinks — so the full-height cascade line "becomes a normal line
//      and animates to a faded, short line" (gold at top, fading to cream
//      at the bottom — matches the VictorScreen gradient).
//   4. "They're built to take your money." headline fades in + rises from
//      below the short line.
// Each hook below drives one of those transitions across a sub-phase of
// the outro (see CLIMAX_* constants at the top of the file).

// Crown resting position: centered horizontally on the Swearby column
// (column index 3, the middle of 7 → viewport center), and 73 px above
// the viewport's vertical center, which places the crown's bottom edge
// a few px above the top of the logo (logo is 96 px tall, centered at
// viewport 50% — top of logo is at 50% − 48 px).
const CROWN_REST_PX = -73
// Start the crown well above the viewport top so the descent feels like
// it comes from above the sticky section. The sticky div's overflow-hidden
// clips anything out of bounds, so a coarse value is safe.
const CROWN_START_PX = -500

function useCrownY(scrollYProgress: MotionValue<number>) {
  return useTransform(
    scrollYProgress,
    piecewise([climaxDwellEnd, climaxCrownEnd], [CROWN_START_PX, CROWN_REST_PX]),
  )
}
function useCrownOpacity(scrollYProgress: MotionValue<number>) {
  // Fade in over the first 40 % of the crown phase so the crown doesn't
  // pop in; the descent continues past full opacity.
  const fadeEnd = climaxDwellEnd + 0.4 * (climaxCrownEnd - climaxDwellEnd)
  return useTransform(
    scrollYProgress,
    piecewise([climaxDwellEnd, fadeEnd, climaxCrownEnd], [0, 1, 1]),
  )
}

// Above-logo line fade during the outro. Applied to every column's above
// line AND to Swearby's gold overlay. Non-Swearby columns are already at
// opacity 0 by this scroll position (their useLineOpacity went 1→0 at the
// death slot) so the multiply is a no-op there.
function useOutroAboveFade(scrollYProgress: MotionValue<number>) {
  return useTransform(
    scrollYProgress,
    piecewise([climaxDwellEnd, climaxCrownEnd], [1, 0]),
  )
}

// Below-line dotted → solid cross-fade during the outro. The existing
// belowLineSolidOpacity/belowLineDottedOpacity motion values are locked to
// their post-intro values (0 and 1 respectively) from introEnd onward, so
// these two hooks overlay fresh fades on top in the outro window.
function useOutroDottedFade(scrollYProgress: MotionValue<number>) {
  return useTransform(
    scrollYProgress,
    piecewise([climaxCrownEnd, climaxLineEnd], [1, 0]),
  )
}
function useOutroSolidRevive(scrollYProgress: MotionValue<number>) {
  return useTransform(
    scrollYProgress,
    piecewise([climaxCrownEnd, climaxLineEnd], [0, 1]),
  )
}

// Animated mask for the below-logo solid line.
//
// The intro's static mask is equivalent to
//   linear-gradient(to bottom, black 0%, black 78%, transparent 100%)
// (visible top 78 %, fade over the bottom 22 %). During the outro the stops
// animate in to shrink the visible region into a short gold→cream gradient:
//   linear-gradient(to bottom, black 0%, black 25%, transparent 55%)
// (visible top 25 %, fade 25–55 %, transparent below).
//
// Because the line's background is solid gold and the page background is
// cream, the faded-out bottom reads as a gold-to-cream gradient — no
// separate gradient background needed. The mask's percentage stops
// interpolate continuously, so the line appears to "shrink from the bottom
// up" with a soft moving fade zone.
const BELOW_MASK_BLACK_START = 78
const BELOW_MASK_BLACK_END = 25
const BELOW_MASK_TRANSPARENT_START = 100
const BELOW_MASK_TRANSPARENT_END = 55
function useOutroBelowMask(scrollYProgress: MotionValue<number>): MotionValue<string> {
  const blackStop = useTransform(
    scrollYProgress,
    piecewise(
      [climaxCrownEnd, climaxLineEnd],
      [BELOW_MASK_BLACK_START, BELOW_MASK_BLACK_END],
    ),
  )
  const transparentStop = useTransform(
    scrollYProgress,
    piecewise(
      [climaxCrownEnd, climaxLineEnd],
      [BELOW_MASK_TRANSPARENT_START, BELOW_MASK_TRANSPARENT_END],
    ),
  )
  return useMotionTemplate`linear-gradient(to bottom, black 0%, black ${blackStop}%, transparent ${transparentStop}%)`
}

// Headline fade-in + rise for "They're built to take your money."
function useOutroHeadlineOpacity(scrollYProgress: MotionValue<number>) {
  return useTransform(
    scrollYProgress,
    piecewise([climaxLineEnd, climaxTextEnd], [0, 1]),
  )
}
function useOutroHeadlineY(scrollYProgress: MotionValue<number>) {
  return useTransform(
    scrollYProgress,
    piecewise([climaxLineEnd, climaxTextEnd], [32, 0]),
  )
}

// Scroll-down hint fades out as the victor climax begins — the end frame
// is meant to hold quietly on the headline without competing scroll cues.
function useOutroScrollHintOpacity(scrollYProgress: MotionValue<number>) {
  return useTransform(
    scrollYProgress,
    piecewise([climaxDwellEnd, climaxCrownEnd], [1, 0]),
  )
}

// ==========================================================================
// Components
// ==========================================================================

function FeatureBar({
  index,
  feature,
  scrollYProgress,
}: {
  index: number
  feature: typeof FEATURES[number]
  scrollYProgress: MotionValue<number>
}) {
  const yVh = useFeatureBarY(index, scrollYProgress)
  const opacity = useFeatureBarOpacity(index, scrollYProgress)
  // Compose the full transform explicitly with useMotionTemplate so `vh`
  // units render correctly. The outer div sits at top:50%, then we shift up
  // by 50% of its own height (self-center) plus the scroll-driven yVh.
  const transform = useMotionTemplate`translateY(calc(-50% + ${yVh}vh))`
  return (
    <motion.div
      className="absolute inset-x-0 px-6 pointer-events-none"
      style={{ top: '50%', transform, opacity }}
    >
      <div
        className="w-full rounded-full border-2 text-[10px] font-semibold uppercase py-[14px] text-center bg-white"
        style={{
          borderColor: COLORS.gold,
          color: COLORS.gold,
          letterSpacing: '5px',
        }}
      >
        {feature.label}
      </div>
    </motion.div>
  )
}

// Gap around the logo so the line doesn't bleed through it. Matches logo
// half-height (48 px) plus breathing room.
const LOGO_HALF_GAP = 58

function LineColumn({
  competitor,
  scrollYProgress,
  swearbyGoldOpacity,
  aboveLineScaleY,
  belowLineSolidOpacity,
  belowLineDottedOpacity,
  outroAboveFade,
  outroDottedFade,
  outroSolidRevive,
  outroBelowMask,
}: {
  competitor: Competitor
  scrollYProgress: MotionValue<number>
  swearbyGoldOpacity: MotionValue<number>
  aboveLineScaleY: MotionValue<number>
  belowLineSolidOpacity: MotionValue<number>
  belowLineDottedOpacity: MotionValue<number>
  outroAboveFade: MotionValue<number>
  outroDottedFade: MotionValue<number>
  outroSolidRevive: MotionValue<number>
  outroBelowMask: MotionValue<string>
}) {
  const lineOpacity = useLineOpacity(competitor, scrollYProgress)
  // Per-element opacities compose three factors:
  //   (1) lineOpacity — kills the whole column after its competitor dies
  //       (Swearby stays at 1 throughout).
  //   (2) the intro motion value for that element (aboveLineScaleY is on
  //       scaleY, not opacity, so only the two below-line values apply here).
  //   (3) the outro fade for that element.
  // Non-Swearby columns end up at 0 for every element in the outro window
  // because lineOpacity is already 0 — the outro fades are no-ops for them.
  const aboveOpacity = useTransform(
    [lineOpacity, outroAboveFade],
    ([l, o]: number[]) => l * o,
  )
  const goldOpacity = useTransform(
    [lineOpacity, swearbyGoldOpacity, outroAboveFade],
    ([l, g, o]: number[]) => l * g * o,
  )
  const belowDottedOp = useTransform(
    [lineOpacity, belowLineDottedOpacity, outroDottedFade],
    ([l, d, o]: number[]) => l * d * o,
  )
  // Below-solid: intro fades it out (1→0), outro revives it (0→1). Take the
  // max so whichever phase is active wins — they never overlap.
  const belowSolidOp = useTransform(
    [lineOpacity, belowLineSolidOpacity, outroSolidRevive],
    ([l, s, r]: number[]) => l * Math.max(s, r),
  )
  return (
    <div className="flex-1 relative h-full">
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1.5px]">
        {/* Above-logo: solid gold, faded at the top. Scales from 0→1 during
            the intro anchored at the bottom edge — reads as the line being
            pulled out of the top of the logo. Fades out during outro. */}
        <motion.div
          className="absolute left-0 w-[1.5px]"
          style={{
            top: 0,
            bottom: `calc(50% + ${LOGO_HALF_GAP}px)`,
            background: COLORS.gold,
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
            scaleY: aboveLineScaleY,
            transformOrigin: 'bottom',
            opacity: aboveOpacity,
          }}
        />
        {/* Below-logo SOLID — the Phase 4 first-frame look. Fades out as the
            dotted overlay fades in during the intro, then REVIVES in the
            outro with an animated mask that shrinks the visible region into
            a short gold→cream gradient (the victor line). */}
        <motion.div
          className="absolute left-0 w-[1.5px]"
          style={{
            top: `calc(50% + ${LOGO_HALF_GAP}px)`,
            bottom: 0,
            background: COLORS.gold,
            WebkitMaskImage: outroBelowMask,
            maskImage: outroBelowMask,
            opacity: belowSolidOp,
          }}
        />
        {/* Below-logo DOTTED — the cascade look. Fades in during the intro
            on top of the solid, fades back out in the outro to hand off to
            the revived (but now shrinking) solid. */}
        <motion.div
          className="absolute left-0 w-[1.5px]"
          style={{
            top: `calc(50% + ${LOGO_HALF_GAP}px)`,
            bottom: 0,
            backgroundImage: `linear-gradient(${COLORS.gold} 50%, transparent 0%)`,
            backgroundSize: '1.5px 6px',
            backgroundRepeat: 'repeat-y',
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 22%, black 100%)',
            maskImage: 'linear-gradient(to top, transparent 0%, black 22%, black 100%)',
            opacity: belowDottedOp,
          }}
        />
        {/* Swearby gold overlay — fully opaque gold after coronation, fades
            out with the rest of the above-line during outro. */}
        {competitor.isSwearby && (
          <motion.div
            className="absolute left-0 w-[1.5px]"
            style={{
              top: 0,
              bottom: `calc(50% + ${LOGO_HALF_GAP}px)`,
              opacity: goldOpacity,
              background: COLORS.gold,
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
            }}
          />
        )}
      </div>
    </div>
  )
}

function LogoCell({
  competitor,
  scrollYProgress,
}: {
  competitor: Competitor
  scrollYProgress: MotionValue<number>
}) {
  const logoTransform = useLogoTransform(competitor, scrollYProgress)
  const logoOpacity = useLogoOpacity(competitor, scrollYProgress)
  return (
    <div className="flex-1 relative h-full">
      <motion.div
        className="absolute left-1/2 top-1/2 flex justify-center"
        style={{ transform: logoTransform, opacity: logoOpacity }}
      >
        <img
          src={competitor.logo}
          alt={competitor.name}
          className="object-contain"
          loading="eager"
          fetchPriority="high"
          style={{ height: 96, width: 'auto', maxWidth: 28 }}
        />
      </motion.div>
    </div>
  )
}

// ==========================================================================
// Main component
// ==========================================================================

export function FeatureCascade({ ownerName }: { ownerName?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const swearbyGoldOpacity = useSwearbyLineGoldOpacity(scrollYProgress)
  const headlineOpacity = useHeadlineOpacity(scrollYProgress)
  // Computed once, then shared across all 7 LineColumns — every column
  // animates in lockstep during the intro.
  const aboveLineScaleY = useAboveLineScaleY(scrollYProgress)
  const belowLineSolidOpacity = useBelowLineSolidOpacity(scrollYProgress)
  const belowLineDottedOpacity = useBelowLineDottedOpacity(scrollYProgress)

  // Outro climax motion values — shared across all line columns and also
  // drive the crown + headline elements below.
  const outroAboveFade = useOutroAboveFade(scrollYProgress)
  const outroDottedFade = useOutroDottedFade(scrollYProgress)
  const outroSolidRevive = useOutroSolidRevive(scrollYProgress)
  const outroBelowMask = useOutroBelowMask(scrollYProgress)
  const crownY = useCrownY(scrollYProgress)
  const crownOpacity = useCrownOpacity(scrollYProgress)
  const outroHeadlineOpacity = useOutroHeadlineOpacity(scrollYProgress)
  const outroHeadlineY = useOutroHeadlineY(scrollYProgress)
  const outroScrollHintOpacity = useOutroScrollHintOpacity(scrollYProgress)
  // Composed transforms — same pattern as FeatureBar (see gotcha #2 in the
  // architecture memory: motion's `y` shorthand mishandles mixed units, so
  // compose explicitly via useMotionTemplate).
  const crownTransform = useMotionTemplate`translate(-50%, calc(-50% + ${crownY}px))`
  const headlineTransform = useMotionTemplate`translateY(${outroHeadlineY}px)`

  const guestName = ownerName ?? 'your partner'

  // `position: sticky` dies inside any ancestor with `overflow: hidden`,
  // `overflow: clip`, `overflow: auto`, or `overflow: scroll`. The onboarding
  // layout has at least two `overflow-hidden` ancestors, so we walk every
  // ancestor of the cascade section and force overflow/overflow-x/overflow-y
  // to `visible` (with !important so Tailwind utility classes can't beat us).
  //
  // We used to also force-hide the layout header/footer so the sticky section
  // started flush with the viewport top — we've since put the Swearby branding
  // back in the page header, so the header stays visible and the page scrolls
  // "normally" for ~70px before the intro animation engages. That's fine;
  // piecewise clamps so nothing animates during that pre-roll.
  //
  // Restored on unmount.
  useIsoLayoutEffect(() => {
    const overrides: Array<{ el: HTMLElement; prop: string; prev: string; prevPriority: string }> = []
    const pushOverride = (el: HTMLElement, prop: string, value: string) => {
      overrides.push({
        el,
        prop,
        prev: el.style.getPropertyValue(prop),
        prevPriority: el.style.getPropertyPriority(prop),
      })
      el.style.setProperty(prop, value, 'important')
    }

    const node = sectionRef.current
    if (node) {
      // Walk up from the cascade <section> to <html>, fixing any clipping
      // ancestor. Overflow on the sticky element itself is fine (we keep its
      // `overflow-hidden` to clip feature bars that translate past -50vh) —
      // so start from the section's parent, not the sticky div.
      let cur: HTMLElement | null = node.parentElement
      while (cur) {
        const cs = getComputedStyle(cur)
        for (const prop of ['overflow-x', 'overflow-y'] as const) {
          const v = cs.getPropertyValue(prop)
          if (v && v !== 'visible') pushOverride(cur, prop, 'visible')
        }
        if (cur === document.documentElement) break
        cur = cur.parentElement
      }
    }

    return () => {
      for (const { el, prop, prev, prevPriority } of overrides) {
        if (prev) el.style.setProperty(prop, prev, prevPriority)
        else el.style.removeProperty(prop)
      }
    }
  }, [])

  return (
    <div
      className="[font-family:var(--font-plus-jakarta)] mx-auto relative"
      style={{ background: COLORS.cream, maxWidth: 520 }}
    >
      {/* Sticky cascade section */}
      <section
        ref={sectionRef}
        className="relative"
        style={{ height: `${TOTAL_VH}vh` }}
      >
        <div
          className="sticky top-0 h-screen overflow-hidden"
          style={{ background: COLORS.cream }}
        >
          {/* Botanical decorations */}
          <div className="absolute pointer-events-none select-none top-[65px] left-[-15px] w-[200px] h-[175px] z-0">
            <img src="/wlc-leaf.svg" alt="" className="w-full h-full" />
          </div>
          <div className="absolute pointer-events-none select-none bottom-[65px] right-[-15px] w-[200px] h-[175px] z-0">
            <img src="/wlc-leaf-down.svg" alt="" className="w-full h-full" />
          </div>

          {/* Headline — sits near the top of the viewport. Absolute so it
              doesn't shift the meridian; the meridian is pinned to the
              viewport center regardless of headline height. The "Swearby"
              wordmark that used to sit above the headline has been removed —
              the layout's page-level header handles that branding. */}
          <div
            className="absolute inset-x-0 z-10 px-6 text-center"
            style={{ top: 'clamp(56px, 7vh, 96px)' }}
          >
            <img
              src="/swearby-logo.svg"
              alt="Swearby"
              className="mx-auto mt-[-20px]"
              style={{ height: 22, width: 'auto' }}
            />
            <motion.h1
              className="mt-8 font-sans"
              style={{
                fontSize: 'clamp(2.25rem, 10.5vw, 2.5rem)',
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: COLORS.ink,
                opacity: headlineOpacity,
              }}
            >
              Your software is<br />
              holding you back.
            </motion.h1>
          </div>

          {/* Layer 1 (bottom) — vertical lines. Symmetrically inset from the
              top and bottom so lines don't run floor-to-ceiling; the equal
              insets keep the logo row exactly on the viewport center. */}
          <div
            className="absolute inset-x-0 z-0 flex"
            style={{
              top: 'clamp(120px, 18vh, 200px)',
              bottom: 'clamp(120px, 18vh, 200px)',
            }}
          >
            {COMPETITORS.map(c => (
              <LineColumn
                key={c.id}
                competitor={c}
                scrollYProgress={scrollYProgress}
                swearbyGoldOpacity={swearbyGoldOpacity}
                aboveLineScaleY={aboveLineScaleY}
                belowLineSolidOpacity={belowLineSolidOpacity}
                belowLineDottedOpacity={belowLineDottedOpacity}
                outroAboveFade={outroAboveFade}
                outroDottedFade={outroDottedFade}
                outroSolidRevive={outroSolidRevive}
                outroBelowMask={outroBelowMask}
              />
            ))}
          </div>

          {/* Layer 2 (middle) — logos. Sit between lines and bars. */}
          <div
            className="absolute inset-x-0 z-10 flex pointer-events-none"
            style={{
              top: 'clamp(120px, 18vh, 200px)',
              bottom: 'clamp(120px, 18vh, 200px)',
            }}
          >
            {COMPETITORS.map(c => (
              <LogoCell
                key={c.id}
                competitor={c}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          {/* Layer 3 (top) — feature bars. Pills cross IN FRONT of the logo
              column so the solid white pill reads clearly as it passes
              through (matches the Figma). */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {FEATURES.map((f, i) => (
              <FeatureBar
                key={f.id}
                index={i}
                feature={f}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          {/* Victor crown — drops in from above the viewport and lands just
              above the Swearby logo (Swearby is the middle column of 7, so
              left:50 % lines it up with the logo). */}
          <motion.div
            className="absolute left-1/2 z-30 pointer-events-none"
            style={{
              top: '50%',
              transform: crownTransform,
              opacity: crownOpacity,
            }}
          >
            <svg width="40" height="30" viewBox="0 0 40 30" fill="none" aria-hidden="true">
              <path
                d="M30.16 13.28L20 0L9.84 13.28L4.16 9.7L2.28 11.04L5.1 25.4L6.33 26.42H33.66L34.89 25.4L37.72 11.04L35.84 9.7L30.16 13.28Z"
                fill={COLORS.gold}
              />
            </svg>
          </motion.div>

          {/* Victor headline — "They're built to take your money."
              Anchored a fixed px distance below the viewport center (below
              the logo + its LOGO_HALF_GAP + the 74 px shrunk line + some
              breathing room) so it sits consistently across viewport heights.
              Fades + rises in during the final outro phase. */}
          <motion.div
            className="absolute inset-x-0 z-10 px-6 text-center pointer-events-none"
            style={{
              top: `calc(50% + ${LOGO_HALF_GAP + 74 + 28}px)`,
              opacity: outroHeadlineOpacity,
              transform: headlineTransform,
            }}
          >
            <h2
              className="font-sans mx-auto"
              style={{
                fontSize: 'clamp(1.75rem, 7vw, 2.25rem)',
                fontWeight: 700,
                lineHeight: 1.18,
                color: COLORS.ink,
                letterSpacing: '-0.01em',
                maxWidth: 340,
              }}
            >
              They&apos;re built to take your money.
            </h2>
          </motion.div>

          {/* Scroll-down hint — anchored to viewport bottom. Fades out
              during the victor climax so the end frame holds quietly on
              the headline. */}
          <motion.div
            className="absolute inset-x-0 z-10 flex flex-col items-center gap-2 pointer-events-none"
            style={{ bottom: 'clamp(24px, 4vh, 48px)', opacity: outroScrollHintOpacity }}
          >
            <style>{`@keyframes slide-down { 0%,100% { transform:translateY(0) } 50% { transform:translateY(5px) } }`}</style>
            <span className="text-[12px] tracking-[0.2em]" style={{ color: 'rgba(53, 51, 49, 1)' }}>
              Scroll down
            </span>
            <svg
              width="30"
              height="44"
              viewBox="0 0 35 51"
              fill="none"
              aria-hidden="true"
              className="overflow-visible"
            >
              <path d="M31.3054 27.1045L29.9704 26.1646C34.3372 19.9626 33.607 11.5616 28.2343 6.18885C22.1584 0.112877 12.2723 0.112959 6.19647 6.18877C0.847267 11.538 0.100903 19.916 4.42186 26.1096L3.08293 27.0437C0.799676 23.7709 -0.274034 19.7664 0.0596787 15.7678C0.39731 11.7216 2.16677 7.90958 5.04211 5.03433C11.7546 -1.67814 22.6765 -1.67805 29.3889 5.03424C32.2733 7.91872 34.0438 11.7433 34.3741 15.8033C34.7007 19.8166 33.6109 23.8301 31.3054 27.1045Z" fill="rgba(53, 51, 49, 1)" />
              <g style={{ animation: 'slide-down 1.2s ease-in-out infinite' }}>
                <path d="M16.3604 14.5718H17.8183V49.0776H16.3604V14.5718Z" fill="rgba(53, 51, 49, 1)" />
                <path d="M17.2151 50.0965L7.94727 40.8285L9.10179 39.6741L17.2151 47.7874L25.3286 39.6741L26.4831 40.8285L17.2151 50.0965Z" fill="rgba(53, 51, 49, 1)" />
              </g>
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Book a call — "We're built to make you money." */}
      <BookACallScreen guestName={guestName} />
    </div>
  )
}
