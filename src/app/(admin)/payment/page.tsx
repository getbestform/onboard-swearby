'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PaymentMode = 'card' | 'ach'

export default function PaymentPage() {
  const router = useRouter()
  const [mode, setMode] = useState<PaymentMode>('card')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Card fields
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  // ACH fields
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  // Billing
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
      // Stub: replace with actual payment server action
      await new Promise((res) => setTimeout(res, 1200))
      router.push('/drug-catalog')
    } catch {
      setError('Payment failed. Please try again.')
      setPending(false)
    }
  }

  const inputClass =
    'w-full bg-secondary/8 border border-secondary/20 rounded px-4 py-3 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-primary/40 focus:bg-white transition-all'

  return (
    <div className="max-w-5xl">
      <p className="text-[10px] uppercase tracking-[0.15em] text-secondary mb-3">
        Secured Onboarding Phase 03
      </p>
      <h1 className="font-serif text-4xl text-primary leading-tight mb-1">Founding Partner Tier</h1>
      <div className="w-10 h-0.5 bg-primary mt-3 mb-10" />

      <div className="flex flex-col lg:flex-row gap-12 items-start">

        {/* Left: Plan Details */}
        <div className="w-full lg:w-5/12 flex flex-col gap-8">
          <p className="text-secondary text-sm leading-relaxed max-w-sm">
            Secure your position within the clinical cohort. This deposit confirms your allocation for the upcoming drug distribution cycle and operational integration.
          </p>

          <div className="bg-secondary/8 border border-secondary/15 rounded-lg p-6">
            <div className="flex justify-between items-end mb-5">
              <span className="text-[11px] uppercase tracking-widest text-secondary">Initial Deposit</span>
              <span className="font-serif text-3xl text-primary">$2,500.00</span>
            </div>
            <div className="h-px bg-secondary/15 mb-5" />
            <ul className="space-y-3">
              {[
                'Priority Drug Catalog Access',
                'Dedicated Clinical Support Liaison',
                'HIPAA Compliant Infrastructure',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-5 opacity-50">
            {[
              { label: 'PCI Compliant' },
              { label: 'HIPAA Secure' },
              { label: 'AES-256 Encryption' },
            ].map(({ label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                  <path d="M12 2 4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="w-full lg:w-7/12">
          <div className="bg-white border border-secondary/15 rounded-lg p-8 shadow-sm">

            {/* Mode toggle */}
            <div className="flex gap-1 bg-secondary/10 p-1 rounded mb-8 w-fit">
              {(['card', 'ach'] as PaymentMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-5 py-2 rounded text-xs uppercase tracking-widest font-medium transition-all ${
                    mode === m
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {m === 'card' ? 'Credit Card' : 'ACH Transfer'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'card' ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-secondary">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="DR. ELIZA VANCE"
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-secondary">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        className={inputClass + ' pr-10'}
                      />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M2 10h20" />
                      </svg>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-secondary">Expiry Date</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM / YY"
                        className={inputClass + ' text-center'}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-secondary">Security Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="CVC"
                        className={inputClass + ' text-center'}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-secondary">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="DR. ELIZA VANCE"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-secondary">Routing Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      required
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="021000021"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-secondary">Account Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="000123456789"
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {/* Billing Address */}
              <div className="border-t border-secondary/10 pt-6 space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-secondary">Billing Address</p>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street Address"
                  className={inputClass}
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="State"
                    className={inputClass + ' text-center'}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="ZIP"
                    className={inputClass + ' text-center'}
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-tertiary bg-tertiary/8 border border-tertiary/20 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-primary text-neutral py-4 px-8 rounded flex justify-between items-center group transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="uppercase tracking-[0.2em] font-semibold text-sm">
                    {pending ? 'Processing…' : 'Pay Deposit & Proceed'}
                  </span>
                  {!pending && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
                <p className="text-center mt-4 text-[10px] text-secondary/50 uppercase tracking-tight">
                  By proceeding, you agree to the SwearBy Clinical Master Services Agreement.
                </p>
              </div>
            </form>
          </div>

          <div className="mt-6 flex justify-center items-center gap-3 opacity-40">
            <span className="text-[10px] tracking-widest uppercase text-secondary">Secure Processing via</span>
            <span className="font-serif font-bold tracking-tighter">stripe</span>
            <div className="w-px h-3 bg-secondary/40" />
            <span className="font-bold tracking-tight text-sm">NMI</span>
          </div>
        </div>

      </div>
    </div>
  )
}
