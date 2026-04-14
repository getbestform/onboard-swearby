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
  if (forceWelcome) return 'welcome'
  if (!initiallyVerified) return 'verify'
  if (initialDraft?.welcomeDone === true) return 'wizard'
  return 'welcome'
}

export default function OnboardingForm({ token, ownerName, email, initiallyVerified, initialDraft }: OnboardingFormProps) {
  const searchParams = useSearchParams()
  const phaseParam   = searchParams.get('phase')
  const forceWelcome = phaseParam === 'welcome' || phaseParam === 'cascade'
  const initialPhase = phaseParam === 'cascade' ? 4 : 1
  const [step, setStep] = useState<FlowStep>(initialFlowStep(initiallyVerified, initialDraft, forceWelcome))

  if (step === 'verify') return <VerifyStep token={token} ownerName={ownerName} email={email} onVerified={() => setStep('welcome')} />
  if (step === 'welcome') return (
    <WelcomeStep
      ownerName={ownerName}
      initialPhase={initialPhase}
      onComplete={async () => {
        await saveDraft(token, { welcomeDone: true })
        setStep('wizard')
      }}
    />
  )
  if (step === 'wizard') return <OnboardingWizard token={token} initialDraft={initialDraft} onComplete={() => setStep('complete')} />
  return <CompleteStep />
}
