'use client'

import { useState } from 'react'
import { verifyInvite } from '@/app/actions/invite'

interface OnboardingFormProps {
  token: string
  ownerName?: string
  email?: string
}

type PaymentMode = 'card' | 'ach'

// ── Step 1: Verify ────────────────────────────────────────────────────────────

function VerifyStep({
  token,
  ownerName,
  email,
  onVerified,
}: {
  token: string
  ownerName?: string
  email?: string
  onVerified: () => void
}) {
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
        onVerified()
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
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }} />
      </div>

      <div className="fixed left-12 bottom-12 hidden lg:flex flex-col items-center opacity-40">
        <div className="h-64 w-px bg-gradient-to-t from-[#a9cfb6] to-transparent mb-6" />
        <p className="text-[#a9cfb6] font-serif italic text-xs tracking-[0.2em] select-none" style={{ writingMode: 'vertical-rl' }}>
          Est. MMXXIV SwearBy Clinical
        </p>
      </div>

      <div className="fixed right-12 top-12 hidden lg:block opacity-40">
        <p className="text-[#a9cfb6] text-[10px] uppercase tracking-[0.3em] mb-1 text-right">Status</p>
        <div className="flex items-center justify-end gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <p className="text-white text-[10px] uppercase tracking-widest">HIPAA Secure</p>
        </div>
      </div>

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
          <p className="text-[#82a78f] text-sm tracking-widest uppercase opacity-80">Private Access</p>
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

            {error && <p className="text-red-300/70 text-[11px]">{error}</p>}

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

// ── Step 2: Payment ───────────────────────────────────────────────────────────

function PaymentStep({ onComplete }: { onComplete: () => void }) {
  const [mode, setMode] = useState<PaymentMode>('card')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  const [accountName, setAccountName] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')

  function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`
    return digits
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      // TODO: wire up payment server action
      await new Promise((res) => setTimeout(res, 1200))
      onComplete()
    } catch {
      setError('Payment failed. Please try again.')
      setPending(false)
    }
  }

  const inputClass =
    'w-full bg-[#eae8e3] border-none rounded-md px-4 py-3 text-sm text-[#022616] placeholder:opacity-30 outline-none focus:ring-1 focus:ring-[#a9cfb6]/30 focus:bg-white transition-all'

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19]">
      <header className="bg-[#fbf9f4] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="text-xl font-bold tracking-[0.2em] text-[#1A3C2A] font-serif">PRIVATE ACCESS</div>
          <nav className="hidden md:flex gap-8 items-center text-sm tracking-widest uppercase">
            {['Invite', 'Access'].map((item) => (
              <span key={item} className="text-stone-400 cursor-default">{item}</span>
            ))}
            <span className="text-[#1A3C2A] font-bold border-b-2 border-[#1A3C2A] pb-0.5 cursor-default">Payment</span>
            <span className="text-stone-400 cursor-default">Drug Catalog</span>
          </nav>
          <div className="w-6 h-6 rounded-full border border-[#424843]/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#424843]">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        </div>
        <div className="bg-[#f2efe8] h-px w-full" />
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-16 items-start">

          <div className="w-full lg:w-5/12">
            <div className="mb-12">
              <span className="text-[10px] uppercase tracking-widest text-[#424843] mb-4 block">Secured Onboarding Phase 03</span>
              <h1 className="font-serif text-5xl lg:text-6xl text-[#022616] mb-6 leading-tight">Founding Partner Tier</h1>
              <p className="text-[#424843] text-lg leading-relaxed max-w-md">
                Secure your position within the clinical cohort. This deposit confirms your allocation for the upcoming drug distribution cycle and operational integration.
              </p>
            </div>

            <div className="bg-[#f5f3ee] p-8 rounded-lg mb-8">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm uppercase tracking-wider text-[#546258]">Initial Deposit</span>
                <span className="font-serif text-4xl text-[#022616]">$2,500.00</span>
              </div>
              <div className="bg-[#e4e2dd] h-px w-full my-6" />
              <ul className="space-y-4">
                {['Priority Drug Catalog Access', 'Dedicated Clinical Support Liaison', 'HIPAA Compliant Infrastructure'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#022616] mt-0.5 shrink-0">
                      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                    </svg>
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-6 pt-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['PCI Compliant', 'HIPAA Secure', 'AES-256 Bit Encryption'].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#022616]">
                    <path d="M12 2 4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-tighter">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-7/12">
            <div className="bg-white p-8 lg:p-12 shadow-[0_32px_64px_-12px_rgba(27,28,25,0.04)] rounded-lg">
              <div className="flex gap-1 bg-[#eae8e3] p-1 rounded-md mb-10 w-fit">
                {(['card', 'ach'] as PaymentMode[]).map((m) => (
                  <button
                    key={m} type="button" onClick={() => setMode(m)}
                    className={`px-6 py-2 rounded-sm text-xs uppercase tracking-widest font-medium transition-all ${mode === m ? 'bg-white text-[#022616] font-semibold shadow-sm' : 'text-[#424843] hover:bg-[#f0eee9]'}`}
                  >
                    {m === 'card' ? 'Credit Card' : 'ACH Transfer'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {mode === 'card' ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-2 block">Cardholder Name</label>
                      <input type="text" required value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="DR. ELIZA VANCE" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-2 block">Card Information</label>
                      <div className="relative">
                        <input type="text" inputMode="numeric" required value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="0000 0000 0000 0000" className={inputClass + ' pr-10 tracking-widest'} />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#424843]/40">
                          <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-2 block">Expiry Date</label>
                        <input type="text" inputMode="numeric" required value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM / YY" className={inputClass + ' text-center tracking-widest'} />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-2 block">Security Code</label>
                        <input type="text" inputMode="numeric" maxLength={4} required value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="CVC" className={inputClass + ' text-center'} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-2 block">Account Holder Name</label>
                      <input type="text" required value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="DR. ELIZA VANCE" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-2 block">Routing Number</label>
                      <input type="text" inputMode="numeric" maxLength={9} required value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="021000021" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-2 block">Account Number</label>
                      <input type="text" inputMode="numeric" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} placeholder="000123456789" className={inputClass} />
                    </div>
                  </div>
                )}

                <div className="bg-[#f5f3ee] -mx-8 lg:-mx-12 px-8 lg:px-12 py-8 mt-10">
                  <label className="text-[11px] uppercase tracking-widest text-[#424843] mb-6 block">Billing Address</label>
                  <div className="space-y-4">
                    <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street Address" className="w-full bg-[#e4e2dd] border-none rounded-md px-4 py-3 text-sm text-[#022616] placeholder:opacity-30 outline-none focus:ring-1 focus:ring-[#a9cfb6]/30 focus:bg-white transition-all" />
                    <div className="grid grid-cols-3 gap-4">
                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full bg-[#e4e2dd] border-none rounded-md px-4 py-3 text-sm text-[#022616] placeholder:opacity-30 outline-none focus:ring-1 focus:ring-[#a9cfb6]/30 focus:bg-white transition-all" />
                      <input type="text" maxLength={2} required value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="State" className="w-full bg-[#e4e2dd] border-none rounded-md px-4 py-3 text-sm text-[#022616] placeholder:opacity-30 outline-none focus:ring-1 focus:ring-[#a9cfb6]/30 focus:bg-white transition-all text-center" />
                      <input type="text" inputMode="numeric" maxLength={5} required value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="ZIP" className="w-full bg-[#e4e2dd] border-none rounded-md px-4 py-3 text-sm text-[#022616] placeholder:opacity-30 outline-none focus:ring-1 focus:ring-[#a9cfb6]/30 focus:bg-white transition-all text-center" />
                    </div>
                  </div>
                </div>

                {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

                <div className="pt-6">
                  <button
                    type="submit" disabled={pending}
                    className="w-full py-5 px-8 rounded-sm shadow-xl flex justify-between items-center group transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #022616 0%, #1a3c2a 100%)' }}
                  >
                    <span className="text-white uppercase tracking-[0.2em] font-semibold text-sm">
                      {pending ? 'Processing…' : 'Pay Deposit & Proceed'}
                    </span>
                    {!pending && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  <p className="text-center mt-6 text-[11px] text-[#424843]/60 uppercase tracking-tighter">
                    By proceeding, you agree to the SwearBy Clinical Master Services Agreement.
                  </p>
                </div>
              </form>
            </div>

            <div className="mt-8 flex justify-center items-center gap-4 opacity-40">
              <span className="text-[10px] tracking-widest uppercase text-[#424843]">Secure Processing via</span>
              <span className="font-serif font-bold text-lg tracking-tighter">stripe</span>
              <div className="w-px h-4 bg-[#424843]/30" />
              <span className="font-bold text-lg tracking-tight">NMI</span>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-[#fbf9f4] mt-16">
        <div className="bg-[#f2efe8] h-px w-full mb-12" />
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8 py-12">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-stone-400 font-serif tracking-widest">SWEARBY CLINICAL</span>
            <span className="uppercase tracking-widest text-[10px] text-stone-400">© 2024 SwearBy Clinical. HIPAA Compliant.</span>
          </div>
          <nav className="flex gap-8">
            {['Privacy Policy', 'Terms of Service', 'Security Disclosure'].map((item) => (
              <span key={item} className="uppercase tracking-widest text-[10px] text-stone-400 cursor-default">{item}</span>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}

// ── Step 3: Complete ──────────────────────────────────────────────────────────

function CompleteStep() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #022616 0%, #1a3c2a 100%)' }}
    >
      <div className="text-center px-8">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className="text-[#a9cfb6] tracking-[0.4em] font-serif text-xs uppercase mb-4">Enrollment Confirmed</p>
        <h1 className="text-white font-serif text-4xl md:text-5xl leading-tight mb-6">You&apos;re In</h1>
        <p className="text-[#82a78f] text-sm max-w-sm mx-auto leading-relaxed">
          Your founding partner position has been secured. Our clinical team will be in touch within 24 hours.
        </p>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

type Step = 'verify' | 'payment' | 'complete'

export default function OnboardingForm({ token, ownerName, email }: OnboardingFormProps) {
  const [step, setStep] = useState<Step>('verify')

  if (step === 'verify') {
    return (
      <VerifyStep
        token={token}
        ownerName={ownerName}
        email={email}
        onVerified={() => setStep('payment')}
      />
    )
  }

  if (step === 'payment') {
    return <PaymentStep onComplete={() => setStep('complete')} />
  }

  return <CompleteStep />
}
