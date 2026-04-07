import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <OnboardingForm token={token} />
}
