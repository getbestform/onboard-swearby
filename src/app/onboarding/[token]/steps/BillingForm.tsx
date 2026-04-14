'use client'

import { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { saveDraft, createPaymentIntent, retrievePaymentDetails } from '@/app/actions/invite'
import { type DraftData, field, lbl, sec } from '../types'
import { Icon } from '../Icon'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe payment will not load.')
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

function StripeCardForm({
  token,
  onChange,
  onBack,
  onAdvance,
}: {
  token: string
  onChange: (d: Partial<DraftData>) => void
  onBack: () => void
  onAdvance: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardholderName, setCardholderName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    if (!stripe || !elements) return
    if (!cardholderName.trim()) { setError('Please enter the cardholder name.'); return }
    setError(null)
    setPending(true)
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      })
      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed. Please try again.')
        return
      }
      if (paymentIntent?.status === 'succeeded') {
        const details = await retrievePaymentDetails(token, paymentIntent.id, cardholderName)
        if ('error' in details) console.error('[retrievePaymentDetails]', details.error)
        const patch: Partial<DraftData> = {
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'succeeded',
          cardholderName,
          last4: 'last4' in details ? details.last4 : undefined,
          brand: 'brand' in details ? details.brand : undefined,
        }
        // Persist before advancing — payment data is critical
        await saveDraft(token, patch as Record<string, unknown>)
        onChange(patch)
        onAdvance()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={lbl}>Cardholder Name <span className="text-red-500">*</span></label>
        <input
          className={field}
          placeholder="DR. ELIZA VANCE"
          type="text"
          value={cardholderName}
          onChange={e => setCardholderName(e.target.value)}
        />
      </div>
      <div>
        <label className={lbl}>Card Details <span className="text-red-500">*</span></label>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      <div className="pt-4 flex justify-end items-center gap-4">
        <button type="button" onClick={onBack}
          className="px-6 py-3 text-sm font-semibold text-[#424843] hover:text-[#1A3C2A] transition-colors">
          Back
        </button>
        <button type="button" onClick={handlePay} disabled={!stripe || !elements || pending}
          className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
          {pending && <Icon name="spinner" className="w-4 h-4" />}
          <span>{pending ? 'Processing…' : 'Pay $2,500 & Continue'}</span>
          {!pending && <Icon name="arrow" className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export function BillingForm({
  token,
  data,
  onChange,
  onBack,
  onAdvance,
}: {
  token: string
  data: DraftData
  onChange: (d: Partial<DraftData>) => void
  onBack: () => void
  onAdvance: () => void
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(data.paymentClientSecret ?? null)
  const [initError, setInitError] = useState<string | null>(null)
  const intentRequested = useRef(false)

  useEffect(() => {
    if (data.paymentIntentId && data.paymentStatus === 'succeeded') return
    if (clientSecret) return // reuse intent from draft
    if (intentRequested.current) return // prevent double-fire in Strict Mode
    intentRequested.current = true
    createPaymentIntent(token).then((result) => {
      if ('error' in result) { setInitError(result.error); return }
      setClientSecret(result.clientSecret)
      saveDraft(token, { paymentClientSecret: result.clientSecret })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Already paid — show confirmation and let user proceed
  if (data.paymentIntentId && data.paymentStatus === 'succeeded') {
    const brandLabel = data.brand
      ? data.brand.charAt(0).toUpperCase() + data.brand.slice(1)
      : 'Card'
    return (
      <div className="space-y-6">
        <h4 className={sec}>Initial Deposit — $2,500.00</h4>
        <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <Icon name="check" className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Payment Successful</p>
            <p className="text-xs text-green-700 mt-0.5">
              {brandLabel} ••••{data.last4} — {data.cardholderName}
            </p>
          </div>
        </div>
        <div className="pt-4 flex justify-end items-center gap-4">
          <button type="button" onClick={onBack}
            className="px-6 py-3 text-sm font-semibold text-[#424843] hover:text-[#1A3C2A] transition-colors">
            Back
          </button>
          <button type="button" onClick={onAdvance}
            className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2">
            <span>Continue</span>
            <Icon name="arrow" className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="space-y-6">
        <h4 className={sec}>Initial Deposit — $2,500.00</h4>
        <p className="text-sm text-red-600">{initError}</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="space-y-6">
        <h4 className={sec}>Initial Deposit — $2,500.00</h4>
        <div className="flex items-center gap-2 text-[#424843]/60">
          <Icon name="spinner" className="w-4 h-4" />
          <span className="text-sm">Preparing payment…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h4 className={sec}>Initial Deposit — $2,500.00</h4>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#1A3C2A',
              colorBackground: '#e4e2dd',
              colorText: '#1b1c19',
              colorDanger: '#ef4444',
              borderRadius: '4px',
              fontFamily: 'Inter, sans-serif',
            },
          },
        }}
      >
        <StripeCardForm
          token={token}
          onChange={onChange}
          onBack={onBack}
          onAdvance={onAdvance}
        />
      </Elements>
    </div>
  )
}
