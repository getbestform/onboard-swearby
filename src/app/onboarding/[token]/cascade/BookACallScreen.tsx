'use client'

import { COLORS } from './data'

export function BookACallScreen({ guestName, onComplete }: { guestName: string; onComplete?: () => void }) {
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
      <div className="absolute pointer-events-none select-none top-[65px] left-[-15px] w-[200px] h-[175px] z-0">
        <img src="/wlc-leaf.svg" alt="" className="w-full h-full" />
      </div>

      {/* Botanical decoration — bottom-left */}
      <div className="absolute pointer-events-none select-none bottom-[65px] right-[-15px] w-[200px] h-[175px] z-0">
        <img src="/wlc-leaf-down.svg" alt="" className="w-full h-full" />
      </div>


      <div className="relative z-10 flex flex-col items-center text-center">

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
        <button
          type="button"
          onClick={onComplete}
          className="mt-12 inline-flex items-center gap-3 group"
          style={{
            color: COLORS.gold,
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
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
        </button>

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
            height: 380,
            background: '#D3D3D3',
            borderRadius: 4,
          }}
          aria-label="Calendar embed placeholder"
        />
      </div>
    </section>
  )
}
