'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { saveDraft } from '@/app/actions/invite'
import { VerifyStep } from './VerifyStep'
import { WelcomeStep } from './WelcomeStep'
import { OnboardingWizard } from './OnboardingWizard'
import { CompleteStep } from './CompleteStep'

interface OnboardingFormProps {
  token: string
  ownerName?: string
  email?: string
  initiallyVerified?: boolean
  initialDraft?: Record<string, unknown>
}

type FlowStep = 'verify' | 'welcome' | 'wizard' | 'complete'

function initialFlowStep(
  initiallyVerified?: boolean,
  initialDraft?: Record<string, unknown>,
  forceWelcome?: boolean,
): FlowStep {
  if (!initiallyVerified) return 'verify'
  if (forceWelcome) return 'welcome'
  //if (initialDraft?.welcomeDone === true) return 'wizard'
  return 'wizard'
}

export default function OnboardingForm({ token, ownerName, email, initiallyVerified, initialDraft }: OnboardingFormProps) {
  const searchParams = useSearchParams()
  const forceWelcome = searchParams.get('phase') === 'welcome'
  const [step, setStep] = useState<FlowStep>(initialFlowStep(initiallyVerified, initialDraft, forceWelcome))

  if (step === 'verify') return <VerifyStep token={token} ownerName={ownerName} email={email} onVerified={() => setStep('welcome')} />
  if (step === 'welcome') return (
    <WelcomeStep
      ownerName={ownerName}
      onComplete={async () => {
        await saveDraft(token, { welcomeDone: true })
        setStep('wizard')
      }}
    />
  )
  if (step === 'wizard') return <OnboardingWizard token={token} initialDraft={initialDraft} ownerName={ownerName} email={email} onComplete={() => setStep('complete')} />
  return <CompleteStep />
}
