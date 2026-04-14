'use client'

import { COLORS } from './data'

export function BookACallScreen({ guestName }: { guestName: string }) {
  return (
    <section
      id="book-a-call"
      className="relative w-full overflow-hidden"
      style={{
        background: COLORS.cream,
        minHeight: '100vh',
        padding: '80px 24px 40px',
      }}
    >
      {/* Botanical decoration — top-left */}
      <svg
        className="absolute pointer-events-none"
        style={{ top: 40, left: -20, width: 220, height: 200, opacity: 0.2 }}
        viewBox="0 0 220 200"
        fill="none"
      >
        <path
          d="M20 20C60 30 110 60 140 100M50 40L90 70M80 50L100 80"
          stroke={COLORS.gold}
          strokeWidth="0.76"
          strokeLinecap="round"
        />
      </svg>

      {/* Botanical decoration — bottom-right */}
      <svg
        className="absolute pointer-events-none"
        style={{ bottom: 120, right: -30, width: 220, height: 200, opacity: 0.2 }}
        viewBox="0 0 220 200"
        fill="none"
      >
        <path
          d="M200 180C160 170 110 140 80 100M170 160L130 130"
          stroke={COLORS.gold}
          strokeWidth="0.76"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Swearby wordmark */}
        <h2
          className="font-serif"
          style={{
            color: COLORS.green,
            fontSize: 22,
            fontWeight: 500,
            fontStyle: 'italic',
          }}
        >
          Swearby
        </h2>

        {/* Positive headline */}
        <h1
          className="mt-14 font-sans"
          style={{
            fontSize: 'clamp(2rem, 8vw, 2.75rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            maxWidth: 340,
          }}
        >
          We&apos;re built to make you money.
        </h1>

        {/* Book a call CTA — plain link for now */}
        <a
          href="#"
          className="mt-12 inline-flex items-center gap-3 group"
          style={{
            color: COLORS.gold,
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ textDecoration: 'underline', textUnderlineOffset: 6 }}>Book a call</span>
          <svg
            width="28"
            height="16"
            viewBox="0 0 28 16"
            fill="none"
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          >
            <path
              d="M1 8H26M19 1l7 7-7 7"
              stroke={COLORS.gold}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        {/* Divider */}
        <div
          className="mt-14 w-full max-w-md"
          style={{ height: 1, background: '#E4DFD4' }}
        />

        {/* Sub-copy */}
        <p
          className="mt-8 text-sm"
          style={{ color: '#353331', opacity: 0.85 }}
        >
          Founding Partner spots are limited to 100 clinics.
          {guestName && guestName !== 'your partner' && (
            <>
              <br />
              <span style={{ opacity: 0.6 }}>Referred by {guestName}.</span>
            </>
          )}
        </p>

        {/* Calendar embed placeholder */}
        <div
          className="mt-8 w-full max-w-md"
          style={{
            height: 480,
            background: '#D3D3D3',
            borderRadius: 4,
          }}
          aria-label="Calendar embed placeholder"
        />
      </div>
    </section>
  )
}
