import OnboardingForm from './OnboardingForm'

const headers = (apiKey: string) => ({ Authorization: `Bearer ${apiKey}` })

async function fetchInviteAndDraft(token: string): Promise<{
  ownerName?: string
  email?: string
  verified?: boolean
}> {
  const apiUrl = process.env.VERTI_API_URL
  const apiKey = process.env.PARTNER_INVITE_API_KEY
  if (!apiUrl || !apiKey) return {}

  const [inviteRes, draftRes] = await Promise.all([
    fetch(`${apiUrl}/api/partner-invites/${token}`, { headers: headers(apiKey), next: { revalidate: 0 } }),
    fetch(`${apiUrl}/api/partner-invites/${token}/draft`, { headers: headers(apiKey), cache: 'no-store' }),
  ])

  const invite = inviteRes.ok ? await inviteRes.json() : {}
  const draft  = draftRes.ok  ? await draftRes.json()  : {}

  return {
    ownerName: invite.ownerName,
    email:     invite.email,
    verified:  draft?.data?.verified === true,
  }
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const { ownerName, email, verified } = await fetchInviteAndDraft(token)
  return <OnboardingForm token={token} ownerName={ownerName} email={email} initiallyVerified={verified} />
}
