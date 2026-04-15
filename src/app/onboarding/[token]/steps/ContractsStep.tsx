'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchAgreements, requestSigningUrl, type AgreementStatus } from '@/app/actions/invite'
import { Icon } from '../Icon'
import { sec } from '../types'

type AgreementType = AgreementStatus['agreementType']

const AGREEMENTS: { type: AgreementType; label: string; description: string }[] = [
  {
    type: 'msa',
    label: 'Master Services Agreement',
    description: 'Governs the overall service relationship between your clinic and SwearBy.',
  },
  {
    type: 'rev_marketing',
    label: 'Revenue & Marketing Agreement',
    description: 'Outlines revenue share terms and co-marketing obligations.',
  },
  {
    type: 'baa',
    label: 'Business Associate Agreement',
    description: 'Required under HIPAA for any entity handling protected health information.',
  },
]

export function ContractsStep({
  token,
  onAllSigned,
  onBack,
}: {
  token: string
  onAllSigned: () => void
  onBack: () => void
}) {
  const [statuses, setStatuses]     = useState<AgreementStatus[]>([])
  const [loading, setLoading]       = useState(true)
  const [signing, setSigning]       = useState<AgreementType | null>(null)
  const [verifying, setVerifying]   = useState<AgreementType | null>(null)
  const [error, setError]           = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await fetchAgreements(token)
    if ('error' in result) {
      setError(result.error)
    } else {
      setStatuses(result.agreements)
    }
    setLoading(false)
  }, [token])

  // Poll until the given agreement type appears as signed, or we time out.
  const pollUntilSigned = useCallback(async (type: AgreementType) => {
    setVerifying(type)
    const deadline = Date.now() + 30_000 // 30 s max
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000))
      const result = await fetchAgreements(token)
      if ('error' in result) break
      setStatuses(result.agreements)
      if (result.agreements.find((a) => a.agreementType === type)?.status === 'signed') break
    }
    setVerifying(null)
  }, [token])

  useEffect(() => {
    load()

    // Listen for the return-page popup posting a completion message
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.data?.type !== 'docusign-complete') return
      setSigning(null)
      if (e.data.event === 'signing_complete') {
        // Webhook may not have fired yet — poll until the DB catches up
        pollUntilSigned(e.data.agreementType as AgreementType)
      } else {
        load()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [load, pollUntilSigned])

  function statusOf(type: AgreementType): 'pending' | 'signed' {
    return statuses.find((s) => s.agreementType === type)?.status ?? 'pending'
  }

  const allSigned = AGREEMENTS.every((a) => statusOf(a.type) === 'signed')

  async function handleSign(type: AgreementType) {
    setError(null)
    setSigning(type)
    try {
      const result = await requestSigningUrl(token, type)
      if ('error' in result) {
        setError(result.error)
        setSigning(null)
        return
      }
      // Open DocuSign embedded signing in a popup window
      // Keep signing state set — cleared when the popup posts its return message
      const popup = window.open(
        result.signingUrl,
        'docusign-signing',
        'width=900,height=700,scrollbars=yes,resizable=yes',
      )
      if (!popup) {
        setError('Popup was blocked. Please allow popups for this site and try again.')
        setSigning(null)
      }
    } catch {
      setSigning(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="spinner" className="w-6 h-6 text-[#1A3C2A]" />
      </div>
    )
  }

  return (
    <div>
      <p className={sec}>Required Agreements</p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 mb-10">
        {AGREEMENTS.map((agr) => {
          const status    = statusOf(agr.type)
          const signed    = status === 'signed'
          const pending   = signing === agr.type
          const awaitingWebhook = verifying === agr.type

          return (
            <div
              key={agr.type}
              className={`flex items-center gap-4 p-5 rounded border transition-all ${
                signed
                  ? 'bg-[#f0faf4] border-[#1A3C2A]/20'
                  : 'bg-white border-[#e4e2dd] hover:border-[#1A3C2A]/30'
              }`}
            >
              {/* Status icon */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  signed ? 'bg-[#1A3C2A] text-white' : 'bg-[#e4e2dd] text-[#424843]/50'
                }`}
              >
                {signed ? (
                  <Icon name="check" className="w-4 h-4" />
                ) : (
                  <Icon name="contract" className="w-4 h-4" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1b1c19]">{agr.label}</p>
                <p className="text-xs text-[#424843]/70 mt-0.5">{agr.description}</p>
              </div>

              {/* Action */}
              {signed ? (
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#1A3C2A] shrink-0">
                  Signed
                </span>
              ) : awaitingWebhook ? (
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-[#424843]/60 shrink-0">
                  <Icon name="spinner" className="w-3 h-3" />
                  Verifying…
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleSign(agr.type)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[#1A3C2A] text-white rounded hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
                >
                  {pending && <Icon name="spinner" className="w-3 h-3" />}
                  {pending ? 'Signing…' : 'Review & Sign'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress note */}
      {!allSigned && (
        <p className="text-xs text-[#424843]/60 mb-8">
          All 3 agreements must be signed before you can proceed to payment.
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-sm font-semibold text-[#424843] hover:text-[#1A3C2A] transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!allSigned}
          onClick={onAllSigned}
          className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continue to Payment</span>
          <Icon name="arrow" className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
