'use client'

import { useState } from 'react'
import { saveDraft, submitApplication } from '@/app/actions/invite'
import { type DraftData, sec } from '../types'
import { Icon } from '../Icon'

export function ReviewForm({ token, data, onComplete }: { token: string; data: DraftData; onComplete: () => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sections = [
    { label: 'Business Info',  summary: [data.businessName, data.ein, data.npi, data.city, data.phone].filter(Boolean).join(' · ') || 'No data entered' },
    { label: 'Prescribers',    summary: [data.prescriberName, data.dea, data.specialty].filter(Boolean).join(' · ') || 'No data entered' },
    { label: 'Drug Catalog',   summary: data.drugs?.filter(d => d.drugName).map(d => d.drugName).join(', ') || 'No data entered' },
    { label: 'Billing', summary: data.paymentIntentId && data.paymentStatus === 'succeeded' ? `${data.brand ? data.brand.charAt(0).toUpperCase() + data.brand.slice(1) : 'Card'}${data.last4 ? ` ••••${data.last4}` : ''} — Paid` : 'Payment not completed' },
    { label: 'Intake',         summary: [data.displayName, data.brandColor, data.logoUrl ? 'Logo uploaded' : ''].filter(Boolean).join(' · ') || 'No data entered' },
    { label: 'Onboarding Call', summary: data.calBookingStartTime ? new Date(data.calBookingStartTime).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not yet scheduled' },
  ]

  async function handleSubmit() {
    setError(null)
    setPending(true)
    try {
      // Ensure latest draft (including drug catalog) is persisted before submitting
      const saveResult = await saveDraft(token, data as Record<string, unknown>)
      if ('error' in saveResult) {
        setError('Failed to save your data. Please try again.')
        return
      }
      const result = await submitApplication(token)
      if ('error' in result) {
        setError(result.error)
      } else {
        onComplete()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.label} className="flex items-start gap-4 p-5 bg-[#f5f3ee] rounded">
            <div className="w-5 h-5 rounded-full bg-[#1A3C2A] flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="check" className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A3C2A] mb-0.5">{s.label}</p>
              <p className="text-xs text-[#424843]">{s.summary}</p>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
      <p className="text-[11px] text-[#424843]/60 uppercase tracking-widest leading-relaxed">
        By submitting you agree to the Swearby Clinical Master Services Agreement. Our team will review your application and be in touch within 24 hours.
      </p>
      <button type="button" onClick={handleSubmit} disabled={pending}
        className="w-full py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        <span>{pending ? 'Submitting…' : 'Submit Application'}</span>
        {!pending && <Icon name="arrow" className="w-4 h-4" />}
      </button>
    </div>
  )
}
