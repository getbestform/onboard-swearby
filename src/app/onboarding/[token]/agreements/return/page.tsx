'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * DocuSign embedded signing return page.
 *
 * DocuSign redirects here after the signer completes (or declines / times out).
 * This page runs in a popup — it notifies the opener and closes itself.
 *
 * URL: /onboarding/[token]/agreements/return?type=msa&event=signing_complete
 */
export default function DocuSignReturnPage() {
  const params = useSearchParams()
  const type   = params.get('type')
  const event  = params.get('event') // signing_complete | decline | cancel | ttl_expired

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'docusign-complete', agreementType: type, event },
        window.location.origin,
      )
    }
    // Small delay so the message is delivered before close
    const t = setTimeout(() => window.close(), 300)
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
