'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate, type MotionValue } from 'motion/react'
import { COMPETITORS, FEATURES, CORONATION_FEATURE_INDEX, COLORS, type Competitor } from './data'
import { StickyNav } from './StickyNav'
import { VictorScreen } from './VictorScreen'
import { BookACallScreen } from './BookACallScreen'

// --- Scroll pacing --------------------------------------------------------
//
// The cascade scrolls past a sticky viewport. Progress 0→1 maps to the full
// height of the sticky section. We carve it into three zones:
//   [0, introEnd)        : intro dwell — first feature sits just below the
//                          logo meridian (matches the static Phase 4 frame)
//   [introEnd, outroStart): main cascade — each feature gets one slot of
//                          scroll distance and travels from below the meridian
//                          through the meridian and off the top.
//   [outroStart, 1]      : outro dwell — Swearby alone with a gold line.
//
// Tune these to taste.
const N = FEATURES.length
const SLOT_VH    = 55          // scroll cost per feature
const OUTRO_VH   = 60          // scroll cost of outro dwell
const TOTAL_VH   = N * SLOT_VH + OUTRO_VH

const outroStart  = (N * SLOT_VH) / TOTAL_VH
const slot        = SLOT_VH / TOTAL_VH
const halfSpan    = slot / 2

// Feature i is at meridian (y = 0) at this scroll progress.
function featureMeridian(i: number): number {
  return (i + 0.5) * slot
}

// First-frame position of feature 0: just below the logo row, matching the
// static Phase 4 mockup. In vh units from meridian.
const FIRST_FRAME_Y_VH = 15

// --- Bar opacity ----------------------------------------------------------
//
// Opacity curve across the slot (0 % = enter, 100 % = exit):
//   0 %  : 0     (invisible, just about to enter from below)
//   20 % : 1     (fast reveal — quick fade-in as it clears the bottom edge)
//   60 % : 1     (stays fully visible while it crosses the meridian)
//   100 %: 0     (longer, gentler fade-out as it drifts off the top)
// The fade-out runs for 40 % of the slot so the bar isn't parked full-opacity
// near the top of the viewport.
//
// Feature 0 is already visible at scroll = 0 (first-frame state), so it only
// gets the exit half of the curve.
function useFeatureBarOpacity(i: number, scrollYProgress: MotionValue<number>) {
  const mid = featureMeridian(i)
  const slotLen = 2 * halfSpan
  const inOnly   = i === 0
  const enterA   = inOnly ? 0 : mid - halfSpan                   // 0 %
  const enterB   = inOnly ? 0 : mid - halfSpan + 0.2 * slotLen   // 20 %
  const exitA    = mid - halfSpan + 0.6 * slotLen                // 60 %
  const exitB    = mid + halfSpan                                // 100 %
  return useTransform(
    scrollYProgress,
    [enterA, enterB, exitA, exitB],
    [inOnly ? 1 : 0, 1, 1, 0],
    { clamp: true },
  )
}

// --- Bar Y motion ---------------------------------------------------------
//
// Each feature bar enters from below (+50vh), crosses meridian (0), exits top
// (-50vh) across its slot. Feature 0 is pre-positioned at FIRST_FRAME_Y_VH at
// scroll = 0 so the cascade opens with the Online Booking pill already visible
// just below the logos (matching the static Phase 4 mockup).
function useFeatureBarY(i: number, scrollYProgress: MotionValue<number>) {
  const mid = featureMeridian(i)
  const enterScroll = i === 0 ? 0                : mid - halfSpan
  const enterY      = i === 0 ? `${FIRST_FRAME_Y_VH}vh` : '50vh'
  return useTransform(
    scrollYProgress,
    [enterScroll, mid, mid + halfSpan],
    [enterY, '0vh', '-50vh'],
    { clamp: true },
  )
}

// --- Dying logo transform -------------------------------------------------
//
// A logo with deathFeatureIndex = d sits at the meridian (y = 0) until its
// death bar reaches it, then rides upward glued above the bar with a constant
// 80 px offset (logo half-height 48 + 0.5 rem 8 + bar half-height 24). The
// px offset is exact regardless of viewport height; the vh portion follows
// the bar's travel.
//
// Returns a full transform string with -50%/-50% self-center baked in, so
// the caller sets style.transform directly and doesn't have to compose with
// motion's y/translateY shorthands (which clobber static CSS transforms).
//
// Timing:
//   scroll = deathMid − 0.2·halfSpan  → logo begins attaching (smooth snap)
//   scroll = deathMid                 → bar at 0,       logo at 0 − 80 px
//   scroll = deathMid + halfSpan      → bar at −50 vh,  logo at −50 vh − 80 px
const GLUE_OFFSET_PX = 80
function useLogoTransform(competitor: Competitor, scrollYProgress: MotionValue<number>): MotionValue<string> {
  const d = competitor.deathFeatureIndex
  const deathMid = d != null ? featureMeridian(d) : 0
  const attachStart = deathMid - halfSpan * 0.2
  const yVh = useTransform(
    scrollYProgress,
    [attachStart, deathMid, deathMid + halfSpan],
    d != null ? [0, 0, -50] : [0, 0, 0],
    { clamp: true },
  )
  const yPx = useTransform(
    scrollYProgress,
    [attachStart, deathMid],
    d != null ? [0, -GLUE_OFFSET_PX] : [0, 0],
    { clamp: true },
  )
  return useMotionTemplate`translate(-50%, calc(-50% + ${yVh}vh + ${yPx}px))`
}

// --- Logo opacity (fade out slightly past death) --------------------------
function useLogoOpacity(competitor: Competitor, scrollYProgress: MotionValue<number>) {
  const d = competitor.deathFeatureIndex
  const deathMid = d != null ? featureMeridian(d) : 0
  return useTransform(
    scrollYProgress,
    [deathMid, deathMid + halfSpan * 0.6, deathMid + halfSpan],
    d != null ? [1, 1, 0] : [1, 1, 1],
    { clamp: true },
  )
}

// --- Line opacity per logo (fade out when logo dies) ----------------------
function useLineOpacity(competitor: Competitor, scrollYProgress: MotionValue<number>) {
  const d = competitor.deathFeatureIndex
  const deathMid = d != null ? featureMeridian(d) : 0
  return useTransform(
    scrollYProgress,
    [deathMid, deathMid + halfSpan * 0.5],
    d != null ? [1, 0] : [1, 1],
    { clamp: true },
  )
}

// --- Swearby line gold transition (Coronation) ----------------------------
//
// After PatientNow dies (feature index 10), the Swearby line fades from
// green to gold across 0.5 of a slot.
function useSwearbyLineGoldOpacity(scrollYProgress: MotionValue<number>) {
  const start = featureMeridian(CORONATION_FEATURE_INDEX)
  return useTransform(scrollYProgress, [start, start + halfSpan], [0, 1], { clamp: true })
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
  const y       = useFeatureBarY(index, scrollYProgress)
  const opacity = useFeatureBarOpacity(index, scrollYProgress)
  // The outer motion.div is anchored at `top: 50%` and translated up by the
  // scroll-driven y (no -50% on this element). The inner plain div handles
  // the self-center with `translateY(-50%)` — this keeps motion's transform
  // pipeline and the static CSS transform on separate elements so they can't
  // clobber each other.
  return (
    <motion.div
      className="absolute inset-x-0 px-6 pointer-events-none"
      style={{ top: '50%', y, opacity }}
    >
      <div
        className="w-full rounded-full border-[2px] text-[10px] font-semibold uppercase py-[14px] text-center bg-white"
        style={{
          borderColor: COLORS.gold,
          color: COLORS.gold,
          letterSpacing: '5px',
          transform: 'translateY(-50%)',
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
}: {
  competitor: Competitor
  scrollYProgress: MotionValue<number>
  swearbyGoldOpacity: MotionValue<number>
}) {
  const lineOpacity = useLineOpacity(competitor, scrollYProgress)
  return (
    <div className="flex-1 relative h-full">
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1.5px]"
        style={{ opacity: lineOpacity }}
      >
        {/* Above-logo: solid gold, faded at the top (viewport-edge side) */}
        <div
          className="absolute left-0 w-[1.5px]"
          style={{
            top: 0,
            bottom: `calc(50% + ${LOGO_HALF_GAP}px)`,
            background: COLORS.gold,
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
            maskImage:       'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
          }}
        />
        {/* Below-logo: dotted gold, faded at the bottom (viewport-edge side) */}
        <div
          className="absolute left-0 w-[1.5px]"
          style={{
            top: `calc(50% + ${LOGO_HALF_GAP}px)`,
            bottom: 0,
            backgroundImage: `linear-gradient(${COLORS.gold} 50%, transparent 0%)`,
            backgroundSize: '1.5px 6px',
            backgroundRepeat: 'repeat-y',
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 22%, black 100%)',
            maskImage:       'linear-gradient(to top, transparent 0%, black 22%, black 100%)',
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
              maskImage:       'linear-gradient(to bottom, transparent 0%, black 22%, black 100%)',
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
  const logoOpacity   = useLogoOpacity(competitor, scrollYProgress)
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
  const guestName = ownerName ?? 'your partner'

  return (
    <div className="[font-family:var(--font-plus-jakarta)]" style={{ background: COLORS.cream }}>
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

          <StickyNav guestName={guestName} />

          {/* Headline — sits near the top of the viewport. Absolute so it
              doesn't shift the meridian; the meridian is pinned to the
              viewport center regardless of headline height. */}
          <div
            className="absolute inset-x-0 z-10 px-6 text-center"
            style={{ top: 'clamp(80px, 10vh, 120px)' }}
          >
            <h2
              className="font-serif text-[#263C30]"
              style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 500 }}
            >
              Swearby
            </h2>
            <h1
              className="mt-6 font-sans"
              style={{
                fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
                fontWeight: 500,
                lineHeight: 1.18,
                color: COLORS.ink,
              }}
            >
              Your software is<br />
              holding you back.
            </h1>
          </div>

          {/* Layer 1 (bottom) — vertical lines. Symmetrically inset from the
              top and bottom so lines don't run floor-to-ceiling; the equal
              insets keep the logo row exactly on the viewport center. */}
          <div
            className="absolute inset-x-0 z-0 flex"
            style={{
              top:    'clamp(120px, 18vh, 200px)',
              bottom: 'clamp(120px, 18vh, 200px)',
            }}
          >
            {COMPETITORS.map(c => (
              <LineColumn
                key={c.id}
                competitor={c}
                scrollYProgress={scrollYProgress}
                swearbyGoldOpacity={swearbyGoldOpacity}
              />
            ))}
          </div>

          {/* Layer 2 (middle) — feature bars. Bars pass behind the logos. */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {FEATURES.map((f, i) => (
              <FeatureBar
                key={f.id}
                index={i}
                feature={f}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>

          {/* Layer 3 (top) — logos. Rendered above the bars so the logos stay
              visible while the bars cross through the meridian. Uses the same
              symmetric insets as the lines so each column lines up. */}
          <div
            className="absolute inset-x-0 z-20 flex pointer-events-none"
            style={{
              top:    'clamp(120px, 18vh, 200px)',
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
