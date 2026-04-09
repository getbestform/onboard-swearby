import OnboardingForm from './OnboardingForm'

async function fetchInvite(token: string): Promise<{ ownerName?: string; email?: string }> {
  const apiUrl = process.env.VERTI_API_URL
  const apiKey = process.env.PARTNER_INVITE_API_KEY
  if (!apiUrl || !apiKey) return {}

  try {
    const res = await fetch(`${apiUrl}/api/partner-invites/${token}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 0 },
    })
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await fetchInvite(token)
  return <OnboardingForm token={token} ownerName={invite.ownerName} email={invite.email} />
}
