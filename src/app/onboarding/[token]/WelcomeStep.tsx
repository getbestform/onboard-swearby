'use client'

export function WelcomeStep({ ownerName, onComplete }: { ownerName?: string; onComplete: () => void }) {
  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden" style={{ background: '#263C30' }}>

      {/* Botanical decoration — top-left */}
      <div className="absolute top-0 left-0 pointer-events-none select-none opacity-20 w-56 h-56">
        <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M30 200 Q60 120 110 80 Q80 140 30 200Z" stroke="#a9cfb6" strokeWidth="1" fill="none"/>
          <path d="M30 200 Q90 150 150 60 Q100 130 30 200Z" stroke="#a9cfb6" strokeWidth="1" fill="none"/>
          <path d="M30 200 Q50 100 120 40" stroke="#a9cfb6" strokeWidth="1"/>
          <path d="M75 130 Q55 100 40 90" stroke="#a9cfb6" strokeWidth="0.8"/>
          <path d="M95 105 Q80 75 85 55" stroke="#a9cfb6" strokeWidth="0.8"/>
          <path d="M108 88 Q110 60 130 40" stroke="#a9cfb6" strokeWidth="0.8"/>
          <path d="M30 200 Q10 160 5 120" stroke="#a9cfb6" strokeWidth="1"/>
          <path d="M18 165 Q5 150 2 130" stroke="#a9cfb6" strokeWidth="0.7"/>
        </svg>
      </div>

      {/* Top bar */}
      <header className="relative z-10 px-10 pt-8">
        <span className="text-white text-sm font-medium tracking-wide">Swearby</span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-10 md:px-20 lg:px-28 pb-20 pt-12">
        {/* Badge */}
        <div className="flex items-center gap-2.5 mb-8">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 0L7.35 4.65L12 6L7.35 7.35L6 12L4.65 7.35L0 6L4.65 4.65L6 0Z" fill="#BDA763"/>
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: '#BDA763' }}>
            Access Verified
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-sans font-bold leading-[1.08] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
          <span className="text-white">Referred by </span>
          <span style={{ color: '#BDA763' }}>{ownerName ?? 'your partner'}</span>
          <br />
          <span className="text-white">founding partner.</span>
        </h1>

        {/* Scroll / continue indicator */}
        <button
          type="button"
          onClick={onComplete}
          className="mt-14 flex flex-col items-start gap-2 group w-fit"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">
            Scroll down
          </span>
          <div className="w-7 h-10 rounded-full border border-white/30 group-hover:border-white/60 flex items-start justify-center pt-2 transition-colors">
            <div className="w-px h-3 bg-white/50 group-hover:bg-white/80 rounded-full transition-colors animate-bounce" />
          </div>
        </button>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-10 pb-8">
        <p className="text-[10px] text-white/30 tracking-wide">
          © 2026 SwearbyHealth™. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
