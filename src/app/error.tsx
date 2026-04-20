'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f4] text-[#1b1c19] px-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#424843]/60 mb-4">Error</p>
      <h1 className="font-display text-4xl text-[#1A3C2A] mb-3">Something went wrong</h1>
      <p className="text-sm text-[#424843] mb-10">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="text-[10px] uppercase tracking-widest text-[#1A3C2A] border-b border-[#1A3C2A]/30 pb-0.5 hover:border-[#1A3C2A] transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}
