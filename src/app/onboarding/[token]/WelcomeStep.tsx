'use client'

import { useEffect, useRef, useState } from 'react'

type AnimState = 'idle' | 'exit-up' | 'exit-down' | 'enter-from-below' | 'enter-from-above'

const TOTAL_PHASES = 3

const BG: Record<number, string> = {
  1: '#263C30',
  2: '#263C30',
  3: '#FBF7F2',
}

export function WelcomeStep({ ownerName, onComplete: _onComplete }: { ownerName?: string; onComplete: () => void }) {
  const [phase, setPhase] = useState(1)
  const [anim, setAnim]   = useState<AnimState>('idle')

  const phaseRef   = useRef(phase)
  const animRef    = useRef(anim)
  const triggered  = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { animRef.current  = anim  }, [anim])

  const go = (direction: 'forward' | 'back') => {
    if (triggered.current) return
    if (animRef.current !== 'idle') return
    if (direction === 'forward' && phaseRef.current === TOTAL_PHASES) return
    if (direction === 'back'    && phaseRef.current === 1) return

    triggered.current = true
    const nextPhase = direction === 'forward' ? phaseRef.current + 1 : phaseRef.current - 1

    setAnim(direction === 'forward' ? 'exit-up' : 'exit-down')
    animRef.current = direction === 'forward' ? 'exit-up' : 'exit-down'

    setTimeout(() => {
      setPhase(nextPhase)
      phaseRef.current = nextPhase
      const enterAnim = direction === 'forward' ? 'enter-from-below' : 'enter-from-above'
      setAnim(enterAnim)
      animRef.current = enterAnim
      setTimeout(() => {
        setAnim('idle')
        animRef.current = 'idle'
        triggered.current = false
      }, 520)
    }, 500)
  }

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) go('forward')
      else if (e.deltaY < 0) go('back')
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') go('forward')
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')                     go('back')
    }
    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY }
    const onTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY
      if (diff > 40)       go('forward')
      else if (diff < -40) go('back')
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const name = ownerName ?? 'your partner'
  const isDark = phase < 3

  const mainStyle = (): React.CSSProperties => {
    const t = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
    switch (anim) {
      case 'exit-up':          return { opacity: 0, transform: 'translateY(-48px)', transition: t }
      case 'exit-down':        return { opacity: 0, transform: 'translateY(48px)',  transition: t }
      case 'enter-from-below': return { animation: 'enter-from-below 0.5s ease-out forwards' }
      case 'enter-from-above': return { animation: 'enter-from-above 0.5s ease-out forwards' }
      default:                 return { opacity: 1, transform: 'translateY(0)' }
    }
  }

  return (
    <div
      className="min-h-screen relative flex flex-col overflow-hidden transition-colors duration-700"
      style={{ background: BG[phase] }}
    >
      <style>{`
        @keyframes slide-down       { 0%,100% { transform:translateY(0) } 50% { transform:translateY(5px) } }
        @keyframes enter-from-below { from { opacity:0; transform:translateY(48px)  } to { opacity:1; transform:translateY(0) } }
        @keyframes enter-from-above { from { opacity:0; transform:translateY(-48px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

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
        <span
          className="text-sm font-medium tracking-wide transition-colors duration-700"
          style={{ color: isDark ? 'white' : '#263C30' }}
        >
          Swearby
        </span>
      </header>

      {/* Main content */}
      <main
        className="relative z-10 flex-1 flex flex-col justify-center px-10 md:px-20 lg:px-28 pb-20 pt-12"
        style={mainStyle()}
      >
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
        {phase === 1 && (
          <h1 className="font-sans font-bold leading-[1.08] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
            <span className="text-white">Referred by </span>
            <span style={{ color: '#BDA763' }}>{name}</span>
            <br />
            <span className="text-white">founding partner.</span>
          </h1>
        )}

        {phase === 2 && (
          <h1 className="font-sans font-bold leading-[1.08] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
            <span className="text-white">{"Here's why"}</span>
            <br />
            <span style={{ color: '#BDA763' }}>{name}</span>
            <span className="text-white"> sent you.</span>
          </h1>
        )}

        {phase === 3 && (
          <>
            <h1 className="font-sans font-bold leading-[1.06] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', color: '#1C1C1A' }}>
              Your software is<br />
              holding <span style={{ color: '#BDA763' }}>you back.</span>
            </h1>
            <p className="mt-6 text-sm leading-relaxed max-w-sm" style={{ color: '#4A4A45' }}>
              Every platform promises the world. But when your clinic needs real depth — telehealth, prescribing, AI charting, lab ordering, pharmacy routing — they all stop short. One by one.
            </p>
          </>
        )}

        {/* Scroll indicator */}
        <button
          type="button"
          onClick={() => go('forward')}
          className="mt-14 flex flex-col items-start gap-2 group w-fit"
        >
          <span
            className="text-[10px] uppercase tracking-[0.2em] transition-colors"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(38,60,48,0.4)' }}
          >
            Scroll down
          </span>
          <svg width="35" height="51" viewBox="0 0 35 51" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-7 opacity-50 group-hover:opacity-80 transition-opacity">
            <path d="M31.3054 27.1045L29.9704 26.1646C34.3372 19.9626 33.607 11.5616 28.2343 6.18885C22.1584 0.112877 12.2723 0.112959 6.19647 6.18877C0.847267 11.538 0.100903 19.916 4.42186 26.1096L3.08293 27.0437C0.799676 23.7709 -0.274034 19.7664 0.0596787 15.7678C0.39731 11.7216 2.16677 7.90958 5.04211 5.03433C11.7546 -1.67814 22.6765 -1.67805 29.3889 5.03424C32.2733 7.91872 34.0438 11.7433 34.3741 15.8033C34.7007 19.8166 33.6109 23.8301 31.3054 27.1045Z" fill={isDark ? 'white' : '#353331'}/>
            <g style={{ animation: 'slide-down 1.2s ease-in-out infinite' }}>
              <path d="M16.3604 14.5718H17.8183V49.0776H16.3604V14.5718Z" fill={isDark ? 'white' : '#353331'}/>
              <path d="M17.2151 50.0965L7.94727 40.8285L9.10179 39.6741L17.2151 47.7874L25.3286 39.6741L26.4831 40.8285L17.2151 50.0965Z" fill={isDark ? 'white' : '#353331'}/>
            </g>
          </svg>
        </button>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-10 pb-8">
        <p
          className="text-[10px] tracking-wide transition-colors duration-700"
          style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(38,60,48,0.35)' }}
        >
          © 2026 SwearbyHealth™. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
