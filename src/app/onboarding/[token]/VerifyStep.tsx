'use client'

import { useState, useRef, useCallback } from 'react'
import { verifyInvite, saveDraft } from '@/app/actions/invite'

const CODE_LENGTH = 5

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
    <main className="flex-1 flex flex-col justify-center px-8 md:px-12 mx-auto max-w-[1024px] w-full">
        <div className="mb-16 md:mb-20">
          <p className="text-[#c4a35a] text-xs md:text-sm font-plus-jakarta uppercase tracking-[0.35em] font-medium">
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
                  className={`w-full bg-transparent font-plus-jakarta border-0 border-b-2 text-3xl md:text-8xl text-center pb-3 outline-none transition-colors placeholder:text-white/10 disabled:opacity-50 caret-[#c4a35a] ${error ? 'border-red-400/70' : focusedIdx === i ? 'border-[#c4a35a]' : 'border-[#a9cfb6]/30'} ${lastTypedIdx === i || focusedIdx === i ? 'text-[#c4a35a]' : 'text-white'}`}
                  aria-label={`Digit ${i + 1}`}
                />
              </div>
            ))}
            {/* Fixed-width slot keeps digit boxes from shifting when loader appears */}
            <div className="w-9 flex-shrink-0 flex items-center pb-3">
              {pending && (
                <svg className="animate-spin w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#c4a35a" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#c4a35a" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
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
  )
}
