'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { COLORS } from './data'

// Entrance sequence timing (seconds). Each element waits for the one before
// it to settle, so the crown lands, then the line draws, then the headline
// rises. Tweak here — everything below reads from these constants.
const ENTER = {
  crown:    { delay: 0.15, duration: 0.65 },
  line:     { delay: 0.55, duration: 0.60 },
  headline: { delay: 0.95, duration: 0.55 },
}

export function VictorScreen() {
  const ref = useRef<HTMLElement>(null)
  // `once: true` so entering the viewport once locks the animation in — if
  // the user scrolls back up past the cascade and down again, nothing resets.
  // `amount: 0.3` waits until ~30% of the section is in view so the user
  // actually sees the crown land rather than missing it at the edge.
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section
      ref={ref}
      className="relative w-full flex flex-col items-center overflow-hidden"
      style={{
        background: COLORS.cream,
        minHeight: '100vh',
        padding: '60px 24px 40px',
      }}
    >
      {/* Botanical decoration — top-left */}
      <div className="absolute pointer-events-none select-none top-[65px] left-[-15px] w-[200px] h-[175px] z-0">
        <img src="/wlc-leaf.svg" alt="" className="w-full h-full" />
      </div>

      {/* Botanical decoration — bottom-left */}
      <div className="absolute pointer-events-none select-none bottom-[65px] right-[-15px] w-[200px] h-[175px] z-0">
        <img src="/wlc-leaf-down.svg" alt="" className="w-full h-full" />
      </div>

      {/* Swearby wordmark */}
      <img
        src="/swearby-logo.svg"
        alt="Swearby"
        className="relative z-10 mx-auto"
        style={{ height: 22, width: 'auto' }}
      />

      {/* Crown / trophy icon — drops onto the Swearby wordmark */}
      <motion.svg
        className="relative z-10 mt-40"
        width="40"
        height="30"
        viewBox="0 0 40 30"
        fill="none"
        initial={{ opacity: 0, y: -28, scale: 0.7 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{
          delay: ENTER.crown.delay,
          duration: ENTER.crown.duration,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transformOrigin: '50% 100%' }}
      >
        <path
          d="M30.16 13.28L20 0L9.84 13.28L4.16 9.7L2.28 11.04L5.1 25.4L6.33 26.42H33.66L34.89 25.4L37.72 11.04L35.84 9.7L30.16 13.28Z"
          fill={COLORS.gold}
        />
      </motion.svg>

      {/* Vertical "Swearby Victor" wordmark — rotated writing-mode. Fades in
          with the crown so the crown feels like it's landing on something. */}
      <motion.div
        className="relative z-10 mt-6"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          fontFamily: 'serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: COLORS.green,
          letterSpacing: '0.25em',
        }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{ delay: ENTER.crown.delay + 0.1, duration: 0.5 }}
      >
        Swearby Victor
      </motion.div>

      {/* Gold-to-cream gradient line — scales down from the wordmark. */}
      <motion.div
        className="relative z-10 mt-8 origin-top"
        style={{
          width: 2,
          height: 74,
          background: `linear-gradient(to bottom, ${COLORS.gold}, ${COLORS.cream})`,
          opacity: 0.5,
        }}
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : undefined}
        transition={{
          delay: ENTER.line.delay,
          duration: ENTER.line.duration,
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* Headline — "They're built to take your money." Rises in from below. */}
      <motion.h1
        className="relative z-10 mt-10 font-sans text-center"
        style={{
          fontSize: 'clamp(1.75rem, 7vw, 2.25rem)',
          fontWeight: 700,
          lineHeight: 1.18,
          color: '#353331',
          letterSpacing: '-0.01em',
          maxWidth: 340,
        }}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{
          delay: ENTER.headline.delay,
          duration: ENTER.headline.duration,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        They&apos;re built to take your money.
      </motion.h1>

      {/* Scroll-down hint — same mark as the rest of the flow */}
      <div className="relative z-10 mt-auto pt-16 flex flex-col items-center gap-2">
        <style>{`@keyframes slide-down { 0%,100% { transform:translateY(0) } 50% { transform:translateY(5px) } }`}</style>
        <span className="tracking-[0.2em]" style={{ color: '#353331', fontSize: 11, opacity: 0.7 }}>
          Scroll down
        </span>
        <svg width="30" height="44" viewBox="0 0 35 51" fill="none" aria-hidden="true" className="overflow-visible">
          <path d="M31.3054 27.1045L29.9704 26.1646C34.3372 19.9626 33.607 11.5616 28.2343 6.18885C22.1584 0.112877 12.2723 0.112959 6.19647 6.18877C0.847267 11.538 0.100903 19.916 4.42186 26.1096L3.08293 27.0437C0.799676 23.7709 -0.274034 19.7664 0.0596787 15.7678C0.39731 11.7216 2.16677 7.90958 5.04211 5.03433C11.7546 -1.67814 22.6765 -1.67805 29.3889 5.03424C32.2733 7.91872 34.0438 11.7433 34.3741 15.8033C34.7007 19.8166 33.6109 23.8301 31.3054 27.1045Z" fill="rgba(53, 51, 49, 1)" />
          <g style={{ animation: 'slide-down 1.2s ease-in-out infinite' }}>
            <path d="M16.3604 14.5718H17.8183V49.0776H16.3604V14.5718Z" fill="rgba(53, 51, 49, 1)" />
            <path d="M17.2151 50.0965L7.94727 40.8285L9.10179 39.6741L17.2151 47.7874L25.3286 39.6741L26.4831 40.8285L17.2151 50.0965Z" fill="rgba(53, 51, 49, 1)" />
          </g>
        </svg>
      </div>
    </section>
  )
}
