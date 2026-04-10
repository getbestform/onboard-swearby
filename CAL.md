# Cal.com Integration Overview

> For full implementation details, see [CAL-COM-INTEGRATION.md](./CAL-COM-INTEGRATION.md).

---

## What it does

Doctors on the Swearby Health network get a Cal.com account so patients can book video consultations directly with them. The integration covers:

- **Doctor onboarding** — creating their Cal.com org user and adding them to the Doctors team
- **Patient booking** — inline calendar embed on the consult detail page
- **Cal Video** — embedded video room (no third-party video provider needed)
- **Booking lifecycle** — webhooks keep consult status in sync with Cal.com events

---

## How a doctor gets connected

1. Network admin opens the doctor's detail page → Cal.com tab → clicks **Connect**
2. `connectDoctorToCalCom()` creates the Cal.com org user and sends an invite email
3. `cal_user_id` is saved to the `doctor` row; `cal_username` stays `NULL` (invite pending)
4. Doctor accepts the email invite
5. Next time the Cal.com tab loads, `syncCalComDoctorStatus()` detects acceptance, assigns the doctor to all team event types, and saves `cal_username`

**Status derived from DB columns:**

| `cal_user_id` | `cal_username` | Status |
|---|---|---|
| `NULL` | `NULL` | Not Connected |
| set | `NULL` | Invite Sent |
| set | set | Connected |

---

## How a patient books

1. Consult reaches `not booked` status
2. Patient opens `/patient/consult/[id]` — Cal.com calendar embed loads inline
3. Booking URL carries the consult ID: `{doctorUsername}/video-consultation?metadata[verti_consult_id]={consultId}`
4. Patient picks a slot → Cal.com fires `BOOKING_CREATED` webhook
5. Webhook updates the consult: assigns doctor, sets `scheduledAt`, saves Cal Video URL
6. Page polls `router.refresh()` until status flips to `booked`

---

## Webhook events

| Event | Consult transition |
|---|---|
| `BOOKING_CREATED` | `not booked → booked` |
| `BOOKING_RESCHEDULED` | updates `scheduledAt` |
| `BOOKING_CANCELLED` | `→ cancelled` |
| `BOOKING_NO_SHOW_UPDATED` | `→ no_show` |
| `MEETING_STARTED` | `booked → in_progress` |
| `MEETING_ENDED` | `→ completed` |

All webhooks are verified with HMAC-SHA256 (`CAL_WEBHOOK_SECRET`) and have a 5-minute replay protection window.

---

## Key files

| File | Role |
|---|---|
| `lib/cal-api.ts` | Cal.com v2 API client |
| `app/actions/cal-doctor.ts` | `connectDoctorToCalCom`, `syncCalComDoctorStatus` |
| `app/api/webhooks/cal/consults/route.ts` | Consult booking webhook handler |
| `app/api/webhooks/cal/route.ts` | Referral funnel webhook (legacy) |
| `app/(portals)/patient/consult/[id]/status-content.tsx` | Inline calendar + Cal Video embed |
| `app/(portals)/network/doctors/doctor-calcom-section.tsx` | Network admin Cal.com tab UI |

---

## Environment variables

| Variable | Used for |
|---|---|
| `CAL_API_KEY` | Server-side API calls |
| `CAL_ORG_ID` | Org user/membership endpoints |
| `CAL_TEAM_ID` | Doctors team membership |
| `CAL_EVENT_SLUG` | Server-side booking URL construction |
| `CAL_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | Client-side booking URL |
| `NEXT_PUBLIC_CAL_ORG_SLUG` | Cal embed origin |
| `NEXT_PUBLIC_CAL_ORG_URL` | Doctor booking links in the admin UI |

---

## Known gaps

- No webhook fires when a doctor accepts their invite — status is checked lazily on page load
- If no doctor is assigned to the consult when it reaches `not booked`, the embed shows "Scheduling Unavailable"
- GHL booking flow runs in parallel (legacy); Cal.com is the target path
