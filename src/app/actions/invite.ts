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
  ownerName: string
  email: string
  entityName: string
  entityType: string | null
  status: string
  expiresAt: string
  createdAt: string
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

export async function verifyInvite(
  token: string,
  code: string,
  email: string,
): Promise<{ success: true } | { error: string }> {
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
