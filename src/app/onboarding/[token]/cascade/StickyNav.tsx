'use client'

import { COLORS } from './data'

export function StickyNav({ guestName }: { guestName: string }) {
  return (
    <nav
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3"
      style={{ background: COLORS.green }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/swearby-logo.svg"
          alt="Swearby"
          className="h-4 w-auto shrink-0"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <span
          className="text-[10px] uppercase truncate"
          style={{
            color: COLORS.cream,
            letterSpacing: '0.18em',
            opacity: 0.8,
          }}
        >
          Guest of <span style={{ color: COLORS.gold, opacity: 1 }}>{guestName}</span>
        </span>
      </div>
      <a
        href="#book-a-call"
        className="text-[10px] uppercase font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0"
        style={{
          color: COLORS.green,
          background: COLORS.gold,
          letterSpacing: '0.18em',
        }}
      >
        Book Call
      </a>
    </nav>
  )
}
