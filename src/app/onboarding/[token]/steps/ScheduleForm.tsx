'use client'

import { useEffect, useRef } from 'react'
import CalEmbed, { getCalApi } from '@calcom/embed-react'
import { type DraftData } from '../types'
import { Icon } from '../Icon'

export function ScheduleForm({
  data,
  onBooked,
  onContinue,
}: {
  data: DraftData
  onBooked: (uid: string, startTime: string) => void
  onContinue: () => void
}) {
  const raw = process.env.NEXT_PUBLIC_CAL_ONBOARDING_LINK

  // Keep a ref to the latest onBooked so we never call a stale version,
  // but the effect only runs once — preventing duplicate listener registration
  // which would cause the step to advance twice on a single booking.
  const onBookedRef = useRef(onBooked)
  onBookedRef.current = onBooked

  useEffect(() => {
    if (!raw || data.calBookingUid) return
    let cancelled = false

    getCalApi({ namespace: 'onboarding' }).then((cal) => {
      if (cancelled) return
      cal('on', {
        action: 'bookingSuccessfulV2',
        callback: (e: CustomEvent<{ data: { uid?: string; startTime?: string } }>) => {
          onBookedRef.current(e.detail.data.uid ?? '', e.detail.data.startTime ?? '')
        },
      })
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw])

  // Already booked — show confirmation instead of the widget
  if (data.calBookingUid) {
    const formattedTime = data.calBookingStartTime
      ? new Date(data.calBookingStartTime).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
          year: 'numeric', hour: 'numeric', minute: '2-digit',
        })
      : null

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-6 bg-[#f0f7f3] rounded-lg ring-1 ring-[#1A3C2A]/10">
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-[#1A3C2A] flex items-center justify-center">
            <Icon name="check" className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[#1A3C2A]">Onboarding call scheduled</p>
            {formattedTime && (
              <p className="text-sm text-[#424843] mt-1">{formattedTime}</p>
            )}
            <p className="text-xs text-[#424843]/60 mt-2">
              A confirmation email with the video link has been sent to you.
            </p>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onContinue}
            className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span>Continue</span>
            <Icon name="arrow" className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

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
