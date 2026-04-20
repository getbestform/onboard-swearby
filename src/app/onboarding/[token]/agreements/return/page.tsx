'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * DocuSign embedded signing return page.
 *
 * DocuSign redirects here after the signer completes (or declines / times out).
 * This page may be loaded inside:
 *   - an iframe embedded in the wizard (`window.parent`), or
 *   - a popup window opened by the wizard (`window.opener`, legacy fallback).
 *
 * URL: /onboarding/[token]/agreements/return?type=msa&event=signing_complete
 */
export default function DocuSignReturnPage() {
  const params = useSearchParams()
  const type   = params.get('type')
  const event  = params.get('event') // signing_complete | decline | cancel | ttl_expired

  useEffect(() => {
    const payload = { type: 'docusign-complete', agreementType: type, event }
    const origin  = window.location.origin

    // Iframe embedding: parent !== self when we're framed.
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, origin)
    }
    // Popup fallback (preserved for legacy flow and manual "Open in new tab").
    if (window.opener) {
      window.opener.postMessage(payload, origin)
    }

    const t = setTimeout(() => {
      if (window.opener) window.close()
    }, 300)
    return () => clearTimeout(t)
  }, [type, event])

  const signed = event === 'signing_complete'

  return (
    <div className="min-h-screen bg-[#fbf9f4] flex items-center justify-center">
      <div className="text-center space-y-3 p-8">
        {signed ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#1A3C2A] text-white flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-semibold text-[#1A3C2A]">Agreement signed</p>
            <p className="text-sm text-[#424843]/70">This window will close automatically.</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-[#1b1c19]">Signing cancelled</p>
            <p className="text-sm text-[#424843]/70">This window will close automatically.</p>
          </>
        )}
      </div>
    </div>
  )
}
