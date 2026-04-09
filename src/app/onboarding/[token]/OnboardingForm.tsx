'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyInvite } from '@/app/actions/invite'

interface OnboardingFormProps {
  token: string
  ownerName?: string
  email?: string
}

export default function OnboardingForm({ token, ownerName, email }: OnboardingFormProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [emailVal, setEmailVal] = useState(email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const parts = ownerName?.trim().split(' ') ?? []
  const prefix = parts[0]?.match(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)$/i) ? parts[0] : ''
  const rest = prefix ? parts.slice(1) : parts
  const lastName = rest[rest.length - 1] ?? ''
  const displayFirst = prefix
    ? `${prefix} ${rest.slice(0, -1).join(' ')}`.trim()
    : rest.slice(0, -1).join(' ')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (code.length < 5) { setError('Please enter all 5 digits.'); return }
    if (!emailVal) { setError('Please enter your email.'); return }

    setPending(true)
    try {
      const result = await verifyInvite(token, code, emailVal)
      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(`/onboarding/${token}/welcome`)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: 'linear-gradient(145deg, #022616 0%, #1a3c2a 100%)' }}
    >
      {/* Paper texture */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }} />
      </div>

      {/* Left anchor */}
      <div className="fixed left-12 bottom-12 hidden lg:flex flex-col items-center opacity-40">
        <div className="h-64 w-px bg-gradient-to-t from-[#a9cfb6] to-transparent mb-6" />
        <p
          className="text-[#a9cfb6] font-serif italic text-xs tracking-[0.2em] select-none"
          style={{ writingMode: 'vertical-rl' }}
        >
          Est. MMXXIV SwearBy Clinical
        </p>
      </div>

      {/* Right status */}
      <div className="fixed right-12 top-12 hidden lg:block opacity-40">
        <p className="text-[#a9cfb6] text-[10px] uppercase tracking-[0.3em] mb-1 text-right">Status</p>
        <div className="flex items-center justify-end gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <p className="text-white text-[10px] uppercase tracking-widest">HIPAA Secure</p>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 w-full max-w-xl px-8 flex flex-col items-center">
        <div className="mb-16 text-center">
          <p className="text-[#a9cfb6] tracking-[0.4em] font-serif text-xs uppercase mb-10">
            Founding Partner Portal
          </p>
          <h1 className="text-white font-serif text-4xl md:text-5xl leading-tight mb-4 tracking-tight">
            {ownerName ? (
              <>{displayFirst && <>{displayFirst} </>}<em>{lastName}</em></>
            ) : (
              <>Welcome, <em>Doctor</em></>
            )}
          </h1>
          <p className="text-[#82a78f] text-sm tracking-widest uppercase opacity-80">
            Private Access
          </p>
        </div>

        <div className="w-full space-y-12">
          <form onSubmit={handleSubmit} className="space-y-10">

            <div className="relative group">
              <label className="block text-[#a9cfb6] text-[10px] uppercase tracking-[0.2em] mb-3 ml-1">
                5-Digit Access Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="0 0 0 0 0"
                className="w-full bg-white/5 border-none rounded-sm text-center font-serif text-3xl tracking-[0.5em] py-6 text-white focus:ring-1 focus:ring-[#a9cfb6] transition-all placeholder:text-white/10 outline-none"
              />
              <div className="absolute bottom-0 left-0 h-px w-full bg-white/10 group-focus-within:bg-[#a9cfb6] transition-colors" />
            </div>

            <div className="relative group">
              <label className="block text-[#a9cfb6] text-[10px] uppercase tracking-[0.2em] mb-3 ml-1">
                Verified Email Address
              </label>
              <input
                type="email"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                placeholder="clinical.director@swearby.com"
                className="w-full bg-white/5 border-none rounded-sm px-6 py-5 text-base text-white focus:ring-1 focus:ring-[#a9cfb6] transition-all placeholder:text-white/20 outline-none"
              />
              <div className="absolute bottom-0 left-0 h-px w-full bg-white/10 group-focus-within:bg-[#a9cfb6] transition-colors" />
            </div>

            {error && (
              <p className="text-red-300/70 text-[11px]">{error}</p>
            )}

            <div className="pt-4 flex flex-col items-center">
              <button
                type="submit"
                disabled={pending}
                className="w-full py-5 rounded-sm shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(145deg, #022616 0%, #1a3c2a 100%)' }}
              >
                <span className="text-white text-xs uppercase tracking-[0.3em] font-semibold flex items-center justify-center gap-3">
                  {pending ? 'Verifying…' : <>Continue <span className="text-lg leading-none">→</span></>}
                </span>
              </button>
              <p className="mt-8 text-[#82a78f]/40 text-[10px] uppercase tracking-widest">
                Authenticated Session Required
              </p>
            </div>

          </form>
        </div>

        <div className="mt-24 flex items-center gap-4 opacity-30">
          <div className="h-px w-12 bg-[#a9cfb6]" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#a9cfb6" className="opacity-80">
            <path d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z" />
          </svg>
          <div className="h-px w-12 bg-[#a9cfb6]" />
        </div>
      </main>
    </div>
  )
}
