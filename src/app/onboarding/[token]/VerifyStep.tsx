'use client'

import { useState, useRef, useCallback } from 'react'
import { verifyInvite, saveDraft } from '@/app/actions/invite'

const CODE_LENGTH = 5

function LeafTopLeft() {
  return (
    <svg className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 opacity-25 pointer-events-none" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#a9cfb6" strokeWidth="0.8" opacity="0.6">
        <path d="M30 160 C50 120, 80 80, 140 40" />
        <path d="M30 160 C40 130, 60 110, 90 90" />
        <path d="M30 160 C45 140, 55 120, 70 105" />
        <path d="M50 130 C60 110, 80 90, 110 70" />
        <path d="M60 110 C70 95, 85 80, 100 65" />
        <path d="M40 145 C55 125, 70 100, 95 80" />
        <path d="M55 155 C65 135, 80 115, 100 95" />
        <ellipse cx="90" cy="60" rx="35" ry="50" transform="rotate(-40 90 60)" />
        <ellipse cx="60" cy="100" rx="25" ry="40" transform="rotate(-30 60 100)" />
        <ellipse cx="110" cy="45" rx="20" ry="35" transform="rotate(-50 110 45)" />
        <path d="M20 170 C30 155, 40 140, 50 125" />
        <path d="M35 165 C50 145, 65 125, 85 100" />
      </g>
    </svg>
  )
}

function LeafBottomRight() {
  return (
    <svg className="absolute bottom-0 right-0 w-48 h-48 md:w-64 md:h-64 opacity-25 pointer-events-none" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#a9cfb6" strokeWidth="0.8" opacity="0.6">
        <path d="M170 40 C150 80, 120 120, 60 160" />
        <path d="M170 40 C160 70, 140 90, 110 110" />
        <path d="M170 40 C155 60, 145 80, 130 95" />
        <path d="M150 70 C140 90, 120 110, 90 130" />
        <path d="M140 90 C130 105, 115 120, 100 135" />
        <path d="M160 55 C145 75, 130 100, 105 120" />
        <path d="M145 45 C135 65, 120 85, 100 105" />
        <ellipse cx="110" cy="140" rx="35" ry="50" transform="rotate(140 110 140)" />
        <ellipse cx="140" cy="100" rx="25" ry="40" transform="rotate(150 140 100)" />
        <ellipse cx="90" cy="155" rx="20" ry="35" transform="rotate(130 90 155)" />
        <path d="M180 30 C170 45, 160 60, 150 75" />
        <path d="M165 35 C150 55, 135 75, 115 100" />
      </g>
    </svg>
  )
}

export function VerifyStep({ token, ownerName, email, onVerified }: { token: string; ownerName?: string; email?: string; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [focusedIdx, setFocusedIdx] = useState<number | null>(0)
  const [lastTypedIdx, setLastTypedIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join('')

  const submit = useCallback(async (finalCode: string) => {
    setError(null)
    if (finalCode.length < CODE_LENGTH) { setError('Please enter all 5 digits.'); return }
    setPending(true)
    try {
      const result = await verifyInvite(token, finalCode, email ?? '')
      if ('error' in result) {
          setError('Wrong access code! Enter your 5-digit access code to continue.')
        } else {
        await saveDraft(token, { verified: true })
        onVerified()
      }
    } finally { setPending(false) }
  }, [token, email, onVerified])

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError(null)
    if (digit) setLastTypedIdx(index)

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const fullCode = next.join('')
    if (fullCode.length === CODE_LENGTH) {
      submit(fullCode)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(code)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = [...digits]
    for (let i = 0; i < CODE_LENGTH; i++) {
      next[i] = pasted[i] ?? ''
    }
    setDigits(next)
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()

    if (pasted.length === CODE_LENGTH) {
      submit(pasted)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    submit(code)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d2818 0%, #1a3c2a 40%, #1e4230 100%)' }}>

      <LeafTopLeft />
      <LeafBottomRight />

      <header className="relative z-10 px-8 md:px-12 pt-8 md:pt-10">
        <span className="text-white font-serif text-xl md:text-2xl font-bold tracking-wide">Swearby</span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-12 max-w-2xl">
        <div className="mb-16 md:mb-20">
          <p className="text-[#c4a35a] text-xs md:text-sm uppercase tracking-[0.35em] font-medium">
            Private Access
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-6 md:gap-8 mb-6" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <div key={i} className="flex-1 max-w-[100px]">
                <input
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={() => setFocusedIdx(i)}
                  onBlur={() => setFocusedIdx(null)}
                  disabled={pending}
                  autoFocus={i === 0}
                  className={`w-full bg-transparent border-0 border-b-2 font-serif text-2xl md:text-3xl text-center pb-3 outline-none transition-colors placeholder:text-white/10 disabled:opacity-50 caret-[#c4a35a] ${error ? 'border-red-400/70' : focusedIdx === i ? 'border-[#c4a35a]' : 'border-[#a9cfb6]/30'} ${lastTypedIdx === i || focusedIdx === i ? 'text-[#c4a35a]' : 'text-white'}`}
                  aria-label={`Digit ${i + 1}`}
                />
              </div>
            ))}
            {pending && (
              <div className="flex items-center pb-3 ml-2">
                <svg className="animate-spin w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#c4a35a" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#c4a35a" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>

          <p className="text-sm mb-8">
            {error ? (
              <>
                <span className="text-red-400/90">Wrong access code! </span>
                <span className="text-white">Enter your 5-digit access code to continue.</span>
              </>
            ) : (
              <span className="text-[#a9cfb6]/70">{pending ? 'Verifying…' : 'Enter your 5-digit access code to continue.'}</span>
            )}
          </p>

          <button type="submit" className="sr-only" tabIndex={-1}>Submit</button>
        </form>
      </main>

      <footer className="relative z-10 px-8 md:px-12 pb-8 md:pb-10">
        <p className="text-[#a9cfb6]/40 text-xs">
          &copy; 2026 SwearbyHealth&trade;. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
