import OnboardingForm from './OnboardingForm'

const authHeaders = (apiKey: string) => ({ Authorization: `Bearer ${apiKey}` })

async function fetchInviteAndDraft(token: string): Promise<{
  ownerName?: string
  email?: string
  verified?: boolean
  initialDraft?: Record<string, unknown>
}> {
  const apiUrl = process.env.VERTI_API_URL
  const apiKey = process.env.PARTNER_INVITE_API_KEY
  if (!apiUrl || !apiKey) return {}

  const [inviteRes, draftRes] = await Promise.all([
    fetch(`${apiUrl}/api/partner-invites/${token}`, { headers: authHeaders(apiKey), cache: 'no-store' }),
    fetch(`${apiUrl}/api/partner-invites/${token}/draft`, { headers: authHeaders(apiKey), cache: 'no-store' }),
  ])

  const invite = inviteRes.ok ? await inviteRes.json().catch(() => ({})) : {}
  const draft  = draftRes.ok  ? await draftRes.json().catch(() => ({}))  : {}
  const draftData: Record<string, unknown> | null = draft?.data ?? null

  return {
    ownerName:    invite.ownerName,
    email:        invite.email,
    verified:     draftData?.verified === true,
    initialDraft: draftData ?? undefined,
  }
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { ownerName, email, verified, initialDraft } = await fetchInviteAndDraft(token)
  return (
    <OnboardingForm
      token={token}
      ownerName={ownerName}
      email={email}
      initiallyVerified={verified}
      initialDraft={initialDraft}
    />
  )
}
