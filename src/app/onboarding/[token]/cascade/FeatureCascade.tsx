'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate, type MotionValue } from 'motion/react'
import { COMPETITORS, FEATURES, CORONATION_FEATURE_INDEX, COLORS, type Competitor } from './data'
import { VictorScreen } from './VictorScreen'
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
//   [outroStart, 1]      : outro dwell — Swearby alone with a gold line.
//
// Tune these to taste.
const N = FEATURES.length
const INTRO_VH = 45          // total intro budget (headline fade + line reveal)
const INTRO_HEADLINE_FRAC = 0.55   // first 55 % = headline fade, rest = line reveal
const SLOT_VH = 55          // scroll cost per feature
const OUTRO_VH = 60          // scroll cost of outro dwell
const TOTAL_VH = INTRO_VH + N * SLOT_VH + OUTRO_VH

const introEnd = INTRO_VH / TOTAL_VH
const headlineFadeEnd = introEnd * INTRO_HEADLINE_FRAC
const outroStart = (INTRO_VH + N * SLOT_VH) / TOTAL_VH
const slot = SLOT_VH / TOTAL_VH
const halfSpan = slot / 2

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
// The opacity curve wraps those: fade-in finishes just before the dwell, and
// fade-out starts exactly as the dwell ends. That way the bar lingers at
// full opacity the whole time it's parked over the logos.
//
// DWELL_END is relatively early (0.55) so the exit phase gets ~45% of the
// slot — enough scroll distance that the pill reads as rising rather than
// snapping off the top.
const DWELL_START = 0.25
const DWELL_END = 0.55
const FADE_IN_END = 0.20    // opacity reaches 1 just before the dwell starts

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
  const inputs = inOnly
    ? [0, slotStart + dwellEnd * slotLen, slotStart + slotLen]
    : [
      slotStart,
      slotStart + FADE_IN_END * slotLen,
      slotStart + dwellEnd * slotLen,
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
}: {
  competitor: Competitor
  scrollYProgress: MotionValue<number>
  swearbyGoldOpacity: MotionValue<number>
  aboveLineScaleY: MotionValue<number>
  belowLineSolidOpacity: MotionValue<number>
  belowLineDottedOpacity: MotionValue<number>
}) {
  const lineOpacity = useLineOpacity(competitor, scrollYProgress)
  return (
    <div className="flex-1 relative h-full">
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1.5px]"
        style={{ opacity: lineOpacity }}
      >
        {/* Above-logo: solid gold, faded at the top. Scales from 0→1 during
            the intro anchored at the bottom edge — reads as the line being
            pulled out of the top of the logo. */}
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
          }}
        />
        {/* Below-logo SOLID — the Phase 4 first-frame look. Fades out as the
            dotted overlay fades in during the intro. */}
        <motion.div
          className="absolute left-0 w-[1.5px]"
          style={{
            top: `calc(50% + ${LOGO_HALF_GAP}px)`,
            bottom: 0,
            background: COLORS.gold,
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 22%, black 100%)',
            maskImage: 'linear-gradient(to top, transparent 0%, black 22%, black 100%)',
            opacity: belowLineSolidOpacity,
          }}
        />
        {/* Below-logo DOTTED — the permanent cascade look. Fades in during
            the intro on top of the solid. */}
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
            opacity: belowLineDottedOpacity,
          }}
        />
        {/* Swearby gold overlay — fully opaque gold after coronation */}
        {competitor.isSwearby && (
          <motion.div
            className="absolute left-0 w-[1.5px]"
            style={{
              top: 0,
              bottom: `calc(50% + ${LOGO_HALF_GAP}px)`,
              opacity: swearbyGoldOpacity,
              background: COLORS.gold,
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
            }}
          />
        )}
      </motion.div>
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
  const guestName = ownerName ?? 'your partner'

  // `position: sticky` dies inside any ancestor with `overflow: hidden`,
  // `overflow: clip`, `overflow: auto`, or `overflow: scroll`. The onboarding
  // layout has at least two `overflow-hidden` ancestors, so we walk every
  // ancestor of the cascade section and force overflow/overflow-x/overflow-y
  // to `visible` (with !important so Tailwind utility classes can't beat us).
  //
  // We also hide the layout header/footer so the sticky section starts flush
  // with the viewport top — otherwise the page scrolls "normally" for ~70 px
  // before the animation begins.
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

    const root = document.getElementById('onboarding-root')
    if (root) {
      root.querySelectorAll<HTMLElement>(':scope > header, :scope > footer').forEach(el => {
        pushOverride(el, 'display', 'none')
      })
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
              viewport center regardless of headline height. */}
          <div
            className="absolute inset-x-0 z-10 px-6 text-center"
            style={{ top: 'clamp(56px, 7vh, 96px)' }}
          >
            <h2
              className="font-serif text-[#263C30]"
              style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 500 }}
            >
              Swearby
            </h2>
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

          {/* Scroll-down hint — anchored to viewport bottom */}
          <div
            className="absolute inset-x-0 z-10 flex flex-col items-center gap-2 pointer-events-none"
            style={{ bottom: 'clamp(24px, 4vh, 48px)' }}
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
          </div>
        </div>
      </section>

      {/* Victor — "They're built to take your money." */}
      <VictorScreen />

      {/* Book a call — "We're built to make you money." */}
      <BookACallScreen guestName={guestName} />
    </div>
  )
}
