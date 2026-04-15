'use server'

import { createClient } from '@/lib/supabase/server'

type FieldErrors = Record<string, string | string[]>

type InviteState =
  | { success: true; token: string; code: string }
  | { fieldErrors: FieldErrors }
  | { error: string }
  | undefined

export async function sendInvite(prevState: InviteState, formData: FormData): Promise<InviteState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session expired. Please sign in again.' }
  }

  const body = {
    ownerName: formData.get('ownerName') as string,
    email: formData.get('email') as string,
    entityName: formData.get('entityName') as string,
    entityType: formData.get('entityType') as string,
    createdBy: user.id,
  }

  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    console.error('[invite] Missing env vars: VERTI_API_URL or PARTNER_INVITE_API_KEY')
    return { error: 'Server misconfiguration. Contact support.' }
  }

  const url = `${process.env.VERTI_API_URL}/api/partner-invites`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('[invite] fetch failed:', url, (err as Error)?.message)
    return { error: 'Network error. Check your connection and try again.' }
  }

  if (res.status === 401) {
    return { error: 'API authentication failed. Contact support.' }
  }

  const data = await res.json()

  if (res.status === 400) {
    return { fieldErrors: data.errors ?? {} }
  }

  if (!res.ok) {
    return { error: data?.error ?? 'Server error. Please try again.' }
  }

  return { success: true, token: data.token, code: data.code }
}

export type Invite = {
  id: string
  token: string
  ownerName: string
  email: string
  entityName: string
  entityType: string | null
  status: string
  expiresAt: string
  createdAt: string
}

export type DrugEntry = { drugName: string; doses: string; unitPrice: string; stateAvailability: string }

export type InviteDetail = {
  invite: Invite
  draft: {
    // business
    businessName?: string; ein?: string; npi?: string
    street?: string; city?: string; state?: string; zip?: string
    phone?: string; website?: string
    // prescribers
    prescriberName?: string; dea?: string; license?: string; licenseState?: string; specialty?: string
    // catalog
    drugs?: DrugEntry[]
    // billing — Stripe-safe fields only, never raw card data
    paymentIntentId?: string; paymentStatus?: string; paymentClientSecret?: string
    cardholderName?: string; last4?: string; brand?: string
    // intake
    displayName?: string; brandColor?: string; description?: string; yearsInPractice?: string; locations?: string; logoUrl?: string
    // schedule
    calBookingUid?: string; calBookingStartTime?: string
  } | null
}

export async function getInviteDetail(token: string): Promise<InviteDetail | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  const headers = { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` }
  const base = `${process.env.VERTI_API_URL}/api/partner-invites/${token}`
  try {
    const [inviteRes, draftRes] = await Promise.all([
      fetch(base, { headers, cache: 'no-store' }),
      fetch(`${base}/draft`, { headers, cache: 'no-store' }),
    ])
    if (!inviteRes.ok) return { error: inviteRes.status === 404 ? 'Invite not found.' : 'Failed to load invite.' }
    const inviteData = await inviteRes.json()
    const draftData = draftRes.ok ? await draftRes.json().catch(() => ({})) : {}
    return {
      invite: { ...inviteData, token },
      draft: draftData?.data ?? null,
    }
  } catch (err) {
    console.error('[getInviteDetail] fetch failed:', (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export type ListInvitesResult =
  | { data: Invite[]; total: number; page: number; limit: number }
  | { error: string }

export async function listInvites(params: {
  page?: number
  limit?: number
  status?: string
  entityType?: string
  search?: string
}): Promise<ListInvitesResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration. Contact support.' }
  }

  const qs = new URLSearchParams()
  if (params.page)       qs.set('page',       String(params.page))
  if (params.limit)      qs.set('limit',      String(params.limit))
  if (params.status)     qs.set('status',     params.status)
  if (params.entityType) qs.set('entityType', params.entityType)
  if (params.search)     qs.set('search',     params.search)

  const url = `${process.env.VERTI_API_URL}/api/partner-invites?${qs.toString()}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
      cache: 'no-store',
    })
    if (!res.ok) return { error: 'Failed to load invites.' }
    return await res.json()
  } catch (err) {
    console.error('[listInvites] fetch failed:', (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export async function saveDraft(
  token: string,
  data: Record<string, unknown>,
): Promise<{ success: true; updatedAt: string } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  try {
    const res = await fetch(`${process.env.VERTI_API_URL}/api/partner-invites/${token}/draft`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) return { error: 'Failed to save draft.' }
    return await res.json()
  } catch (err) {
    console.error('[saveDraft] fetch failed:', (err as Error)?.message)
    return { error: 'Network error.' }
  }
}

export async function loadDraft(
  token: string,
): Promise<{ data: Record<string, unknown> | null } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  try {
    const res = await fetch(`${process.env.VERTI_API_URL}/api/partner-invites/${token}/draft`, {
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
      cache: 'no-store',
    })
    if (!res.ok) return { error: 'Failed to load draft.' }
    return await res.json()
  } catch (err) {
    console.error('[loadDraft] fetch failed:', (err as Error)?.message)
    return { error: 'Network error.' }
  }
}

export async function submitApplication(
  token: string,
): Promise<{ success: true } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  const url = `${process.env.VERTI_API_URL}/api/partner-invites/${token}/submit`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data?.error ?? 'Submission failed. Please try again.' }
    }
    return { success: true }
  } catch (err) {
    console.error('[submitApplication] fetch failed:', url, (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export async function verifyInvite(
  token: string,
  code: string,
  email: string,
): Promise<{ success: true } | { error: string }> {
  if (!process.env.VERTI_API_URL) {
    return { error: 'Server misconfiguration.' }
  }
  const url = `${process.env.VERTI_API_URL}/api/partner-invites/${token}/verify`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data?.error ?? 'Invalid code or email. Please try again.' }
    }
    return { success: true }
  } catch (err) {
    console.error('[verifyInvite] fetch failed:', url, (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export async function createPaymentIntent(
  token: string,
): Promise<{ clientSecret: string } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  try {
    const res = await fetch(`${process.env.VERTI_API_URL}/api/partner-invites/${token}/payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to initialize payment. Please try again.' }
    return { clientSecret: data.clientSecret }
  } catch (err) {
    console.error('[createPaymentIntent]', (err as Error)?.message)
    return { error: 'Failed to initialize payment. Please try again.' }
  }
}

export async function approveInvite(
  token: string,
): Promise<{ success: true; clinicId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  const url = `${process.env.VERTI_API_URL}/api/partner-invites/${token}/approve`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to approve invite.' }
    return { success: true, clinicId: data.clinicId }
  } catch (err) {
    console.error('[approveInvite] fetch failed:', url, (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export async function denyInvite(
  token: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  const url = `${process.env.VERTI_API_URL}/api/partner-invites/${token}/deny`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to deny invite.' }
    return { success: true }
  } catch (err) {
    console.error('[denyInvite] fetch failed:', url, (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export async function markCallScheduled(
  token: string,
): Promise<{ success: true } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  const url = `${process.env.VERTI_API_URL}/api/partner-invites/${token}/schedule`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to mark call as scheduled.' }
    return { success: true }
  } catch (err) {
    console.error('[markCallScheduled] fetch failed:', url, (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export async function uploadClinicLogo(
  token: string,
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  try {
    const res = await fetch(`${process.env.VERTI_API_URL}/api/partner-invites/${token}/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to upload logo.' }
    return { url: data.url }
  } catch (err) {
    console.error('[uploadClinicLogo] fetch failed:', (err as Error)?.message)
    return { error: 'Network error. Please try again.' }
  }
}

export async function retrievePaymentDetails(
  token: string,
  paymentIntentId: string,
  cardholderName?: string,
): Promise<{ last4: string; brand: string } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  try {
    const res = await fetch(`${process.env.VERTI_API_URL}/api/partner-invites/${token}/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}`,
      },
      body: JSON.stringify({ paymentIntentId, cardholderName }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to retrieve payment details.' }
    return { last4: data.last4, brand: data.brand }
  } catch (err) {
    console.error('[retrievePaymentDetails]', (err as Error)?.message)
    return { error: 'Failed to retrieve payment details.' }
  }
}

export type AgreementStatus = {
  agreementType: 'msa' | 'rev_marketing' | 'baa'
  status: 'pending' | 'signed'
  signedAt: string | null
}

export async function fetchAgreements(
  token: string,
): Promise<{ agreements: AgreementStatus[] } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  try {
    const res = await fetch(`${process.env.VERTI_API_URL}/api/partner-invites/${token}/agreements`, {
      headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to fetch agreements.' }
    return { agreements: data.agreements }
  } catch (err) {
    console.error('[fetchAgreements]', (err as Error)?.message)
    return { error: 'Failed to fetch agreements.' }
  }
}

export async function requestSigningUrl(
  token: string,
  agreementType: 'msa' | 'rev_marketing' | 'baa',
): Promise<{ signingUrl: string } | { error: string }> {
  if (!process.env.VERTI_API_URL || !process.env.PARTNER_INVITE_API_KEY) {
    return { error: 'Server misconfiguration.' }
  }
  try {
    const res = await fetch(
      `${process.env.VERTI_API_URL}/api/partner-invites/${token}/agreements/${agreementType}/sign`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.PARTNER_INVITE_API_KEY}` },
      },
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data?.error ?? 'Failed to start signing session.' }
    return { signingUrl: data.signingUrl }
  } catch (err) {
    console.error('[requestSigningUrl]', (err as Error)?.message)
    return { error: 'Failed to start signing session.' }
  }
}
