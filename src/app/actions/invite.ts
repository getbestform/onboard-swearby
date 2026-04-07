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
