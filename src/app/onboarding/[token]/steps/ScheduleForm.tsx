'use client'

import { useEffect } from 'react'
import CalEmbed, { getCalApi } from '@calcom/embed-react'

export function ScheduleForm({ onBooked }: { onBooked: (uid: string, startTime: string) => void }) {
  const raw = process.env.NEXT_PUBLIC_CAL_ONBOARDING_LINK

  useEffect(() => {
    if (!raw) return
    let cancelled = false

    getCalApi({ namespace: 'onboarding' }).then((cal) => {
      if (cancelled) return
      cal('on', {
        action: 'bookingSuccessfulV2',
        callback: (e: CustomEvent<{ data: { uid?: string; startTime?: string } }>) => {
          onBooked(e.detail.data.uid ?? '', e.detail.data.startTime ?? '')
        },
      })
    })

    return () => { cancelled = true }
  }, [onBooked])

  if (!raw) {
    return (
      <div className="py-12 text-center text-[#424843]/50 text-sm">
        Scheduling is not configured. Set <code className="font-mono text-xs bg-[#e4e2dd] px-1 py-0.5 rounded">NEXT_PUBLIC_CAL_ONBOARDING_LINK</code> to enable this step.
      </div>
    )
  }

  let calOrigin = 'https://app.cal.com'
  let calLink = raw
  try {
    const u = new URL(raw)
    calOrigin = u.origin
    calLink = u.pathname.replace(/^\//, '')
  } catch {
    // raw is already a bare path — keep defaults
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#424843]">
        Pick a time that works for you. You&apos;ll receive a confirmation email with a video link.
      </p>
      <CalEmbed
        namespace="onboarding"
        calLink={calLink}
        calOrigin={calOrigin}
        config={{ layout: 'month_view' as const, theme: 'light', brandColor: '#1A3C2A' }}
        style={{ width: '100%', minHeight: 500, overflow: 'auto' }}
      />
    </div>
  )
}
