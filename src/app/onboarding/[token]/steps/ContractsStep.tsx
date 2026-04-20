'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

// If DocuSign takes longer than this to load in the iframe, assume it's being
// blocked (X-Frame-Options) and offer a new-tab fallback.
const IFRAME_LOAD_TIMEOUT_MS = 8000

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

  // Active signing session (iframe modal).
  const [activeSession, setActiveSession] = useState<
    | { type: AgreementType; signingUrl: string; iframeLoaded: boolean; frameBlocked: boolean }
    | null
  >(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

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
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000))
      const result = await fetchAgreements(token)
      if ('error' in result) break
      setStatuses(result.agreements)
      if (result.agreements.find((a) => a.agreementType === type)?.status === 'signed') break
    }
    setVerifying(null)
  }, [token])

  const closeSession = useCallback(() => {
    setActiveSession(null)
    setSigning(null)
  }, [])

  useEffect(() => {
    load()

    // The return page (rendered inside the iframe) posts a completion message.
    // Inside an iframe, window.opener is null, so it falls back to
    // window.parent.postMessage — we listen for it here.
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.data?.type !== 'docusign-complete') return
      const type = e.data.agreementType as AgreementType
      closeSession()
      if (e.data.event === 'signing_complete') {
        pollUntilSigned(type)
      } else {
        load()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [load, pollUntilSigned, closeSession])

  // Detect "frame refused to load" (X-Frame-Options / CSP): if the iframe
  // hasn't fired onLoad within the timeout, surface a new-tab fallback.
  useEffect(() => {
    if (!activeSession || activeSession.iframeLoaded || activeSession.frameBlocked) return
    const t = setTimeout(() => {
      setActiveSession((prev) => (prev ? { ...prev, frameBlocked: true } : prev))
    }, IFRAME_LOAD_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [activeSession])

  // Prevent background scroll while the modal is open.
  useEffect(() => {
    if (!activeSession) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [activeSession])

  // Escape-to-close.
  useEffect(() => {
    if (!activeSession) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSession()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeSession, closeSession])

  function statusOf(type: AgreementType): 'pending' | 'signed' {
    return statuses.find((s) => s.agreementType === type)?.status ?? 'pending'
  }

  const allSigned = AGREEMENTS.every((a) => statusOf(a.type) === 'signed')

  async function handleSign(type: AgreementType) {
    setError(null)
    setSigning(type)

    // Build an origin-aware returnUrl so DocuSign redirects to whatever origin
    // we are currently on (localhost / preview / prod). Backend should prefer
    // this value over its FRONTEND_URL env (with allowlist validation).
    const returnUrl = `${window.location.origin}/onboarding/${token}/agreements/return?type=${type}`

    try {
      const result = await requestSigningUrl(token, type, returnUrl)
      if ('error' in result) {
        setError(result.error)
        setSigning(null)
        return
      }
      setActiveSession({
        type,
        signingUrl: result.signingUrl,
        iframeLoaded: false,
        frameBlocked: false,
      })
    } catch {
      setSigning(null)
      setError('Failed to start signing session.')
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
          const status          = statusOf(agr.type)
          const signed          = status === 'signed'
          const pending         = signing === agr.type
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

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1b1c19]">{agr.label}</p>
                <p className="text-xs text-[#424843]/70 mt-0.5">{agr.description}</p>
              </div>

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
                  {pending ? 'Opening…' : 'Review & Sign'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!allSigned && (
        <p className="text-xs text-[#424843]/60 mb-8">
          All 3 agreements must be signed before you can proceed to payment.
        </p>
      )}

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

      {activeSession && (
        <SigningModal
          title={AGREEMENTS.find((a) => a.type === activeSession.type)?.label ?? 'Review & Sign'}
          signingUrl={activeSession.signingUrl}
          iframeLoaded={activeSession.iframeLoaded}
          frameBlocked={activeSession.frameBlocked}
          iframeRef={iframeRef}
          onIframeLoad={() =>
            setActiveSession((prev) => (prev ? { ...prev, iframeLoaded: true } : prev))
          }
          onClose={closeSession}
        />
      )}
    </div>
  )
}

function SigningModal({
  title,
  signingUrl,
  iframeLoaded,
  frameBlocked,
  iframeRef,
  onIframeLoad,
  onClose,
}: {
  title: string
  signingUrl: string
  iframeLoaded: boolean
  frameBlocked: boolean
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>
  onIframeLoad: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-[#e4e2dd] bg-[#fbf9f4]">
          <div className="flex items-center gap-3 min-w-0">
            <Icon name="contract" className="w-4 h-4 text-[#1A3C2A] shrink-0" />
            <p className="text-sm font-semibold text-[#1b1c19] truncate">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#424843]/70 hover:text-[#1A3C2A] transition-colors p-1 -m-1"
            aria-label="Close signing session"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="relative flex-1 bg-[#fbf9f4]">
          {!iframeLoaded && !frameBlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#424843]/70">
              <Icon name="spinner" className="w-6 h-6 text-[#1A3C2A]" />
              <p className="text-sm">Preparing your signing session…</p>
            </div>
          )}

          {frameBlocked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-sm font-semibold text-[#1b1c19]">
                We couldn&apos;t embed DocuSign on this page.
              </p>
              <p className="text-xs text-[#424843]/70 max-w-md">
                Your network or DocuSign&apos;s security settings prevented the signing page from loading here.
                Open the signing session in a new tab to continue.
              </p>
              <a
                href={signingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#1A3C2A] text-white text-xs font-bold uppercase tracking-widest rounded hover:opacity-90 transition-opacity"
              >
                Open DocuSign in a new tab
              </a>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={signingUrl}
              onLoad={onIframeLoad}
              title="DocuSign signing session"
              // allow-forms/scripts/same-origin/popups cover the full DocuSign flow;
              // allow-top-navigation is required so DocuSign can redirect the frame to
              // our return URL on completion.
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
              className="absolute inset-0 w-full h-full border-0"
            />
          )}
        </div>

        <footer className="px-5 py-3 border-t border-[#e4e2dd] bg-[#fbf9f4] flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-[#424843]/60">
            Secure signing session · DocuSign
          </p>
          <a
            href={signingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-widest text-[#1A3C2A] font-semibold hover:underline"
          >
            Open in new tab
          </a>
        </footer>
      </div>
    </div>
  )
}
