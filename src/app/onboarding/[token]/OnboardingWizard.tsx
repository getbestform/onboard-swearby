'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { saveDraft, loadDraft } from '@/app/actions/invite'
import { validateStep, type FieldErrors } from './schemas'
import { type DraftData } from './types'
import { Icon } from './Icon'
import { BusinessInfoForm } from './steps/BusinessInfoForm'
import { PrescribersForm } from './steps/PrescribersForm'
import { DrugCatalogForm } from './steps/DrugCatalogForm'
import { BillingForm } from './steps/BillingForm'
import { IntakeForm } from './steps/IntakeForm'
import { ScheduleForm } from './steps/ScheduleForm'
import { ReviewForm } from './steps/ReviewForm'

const STEPS = [
  { id: 'business',    label: 'Business Info',  icon: 'business'  },
  { id: 'prescribers', label: 'Prescribers',    icon: 'medical'   },
  { id: 'catalog',     label: 'Drug Catalog',   icon: 'medication'},
  { id: 'billing',     label: 'Billing',        icon: 'payments'  },
  { id: 'intake',      label: 'Intake',         icon: 'intake'    },
  { id: 'schedule',    label: 'Schedule Call',  icon: 'calendar'  },
  { id: 'review',      label: 'Review',         icon: 'review'    },
]

const STEP_META = [
  { title: 'Clinic Foundation',  instruction: { heading: 'Identity Matters',          body: 'Provide the foundational details of your practice. This information will appear on patient communications, prescriptions, and billing statements.', note: 'Proof of Clinic Registration (IRS SS-4 or similar)' } },
  { title: 'Prescriber Details', instruction: { heading: 'Clinical Authority',         body: 'Enter DEA and licensing information for your primary prescriber. All prescribers must be verified before catalog access is granted.',             note: 'DEA Registration Certificate + State Medical License' } },
  { title: 'Drug Catalog Setup', instruction: { heading: 'Your Formulary',             body: 'Enter the drugs, doses, and pricing you intend to dispense. State availability determines where prescriptions can be filled.',                   note: 'State-specific formulary approval may be required' } },
  { title: 'Deposit & Billing',  instruction: { heading: 'Secure Your Position',       body: 'A $2,500 deposit confirms your allocation for the upcoming drug distribution cycle and operational integration.',                                note: 'PCI-compliant processing via Stripe / NMI' } },
  { title: 'Intake & Branding',  instruction: { heading: 'Your Practice, Your Identity', body: 'Upload your clinic logo and brand colors. These appear on patient-facing materials and your SwearBy portal.',                                  note: 'Logo should be PNG or SVG, minimum 512×512px' } },
  { title: 'Onboarding Call',    instruction: { heading: 'Book Your Kickoff',           body: "Schedule a 30-minute onboarding call with our clinical team. We'll walk through your setup, answer questions, and confirm your integration.",   note: 'Calendar powered by Cal.com — video link sent via email' } },
  { title: 'Review & Submit',    instruction: { heading: 'Final Review',               body: 'Verify all information is accurate before submitting. Our clinical team will review your application within 24 hours.',                          note: 'You will receive a confirmation email upon submission' } },
]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function OnboardingWizard({ token, initialDraft, onComplete }: { token: string; initialDraft?: Record<string, unknown>; onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<DraftData>((initialDraft ?? {}) as DraftData)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [loadingDraft, setLoadingDraft] = useState(!initialDraft)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const meta = STEP_META[step]

  // Restore draft on mount only when no SSR draft was provided
  useEffect(() => {
    if (initialDraft) return
    loadDraft(token).then((result) => {
      if ('data' in result && result.data) {
        setDraft(result.data as DraftData)
      }
      setLoadingDraft(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const draftRef = useRef(draft)
  draftRef.current = draft

  const handleChange = useCallback((patch: Partial<DraftData>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setSaveStatus('idle')
    setFieldErrors({})
  }, [])

  // Auto-save 1.5s after the user stops typing
  useEffect(() => {
    if (loadingDraft) return
    setSaveStatus('idle')
    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      const result = await saveDraft(token, draftRef.current as Record<string, unknown>)
      if ('error' in result) {
        setSaveStatus('error')
      } else {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }, 1500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, token, loadingDraft])

  async function handleSaveDraft() {
    setSaveStatus('saving')
    const result = await saveDraft(token, draftRef.current as Record<string, unknown>)
    if ('error' in result) {
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  function advanceStep() { setStep((s) => Math.min(STEPS.length - 1, s + 1)) }

  function renderStepForm() {
    const props = { data: draft, onChange: handleChange, errors: fieldErrors }
    switch (step) {
      case 0: return <BusinessInfoForm {...props} />
      case 1: return <PrescribersForm {...props} />
      case 2: return <DrugCatalogForm {...props} />
      case 3: return (
        <BillingForm
          token={token}
          data={draft}
          onChange={handleChange}
          onBack={() => setStep((s) => s - 1)}
          onAdvance={advanceStep}
        />
      )
      case 4: return <IntakeForm token={token} {...props} />
      case 5: return (
        <ScheduleForm
          onBooked={async (uid, startTime) => {
            const patch = { calBookingUid: uid, calBookingStartTime: startTime }
            handleChange(patch)
            // Save explicitly with the patch merged — draftRef.current is stale
            // until the next render, so we can't rely on handleSaveDraft here.
            await saveDraft(token, { ...draftRef.current, ...patch } as Record<string, unknown>)
            advanceStep()
          }}
        />
      )
      case 6: return <ReviewForm token={token} data={draft} onComplete={onComplete} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19]">

      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 border-b border-[#e4e2dd] bg-[#fbf9f4]">
        <span className="font-serif text-xl italic text-[#1A3C2A]">Clinical Editorial</span>
        <div className="flex items-center gap-6">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-[#424843]/40">
              <Icon name="spinner" className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-widest">Saving…</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-[#424843]/60">
              <Icon name="cloud" className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest">Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400">
              <span className="text-[10px] uppercase tracking-widest">Save failed</span>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-64 flex flex-col p-6 pt-24 border-r border-[#e4e2dd] bg-[#fbf9f4]">
        <div className="mb-10">
          <h1 className="font-serif text-xl font-bold text-[#1A3C2A]">Onboarding</h1>
          <p className="text-sm text-[#424843]/60 mt-0.5">Clinic Setup Wizard</p>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {STEPS.map((s, i) => {
            const active = i === step
            const done = i < step
            return (
              <button key={s.id} type="button" onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-3 px-4 py-3 rounded text-sm text-left transition-all ${active ? 'bg-[#e4e2dd]/70 text-[#1A3C2A] font-semibold' : done ? 'text-[#1A3C2A]/60 hover:bg-[#f0eee9] cursor-pointer' : 'text-[#424843]/50 cursor-default'}`}>
                <Icon name={s.icon} className="w-5 h-5 shrink-0" />
                <span>{s.label}</span>
                {done && <Icon name="check" className="w-3.5 h-3.5 ml-auto text-[#1A3C2A]/50" />}
              </button>
            )
          })}
        </div>

      </nav>

      {/* Main */}
      <main className="ml-64 pt-24 p-12 min-h-screen">
        {loadingDraft ? (
          <div className="flex items-center justify-center h-64">
            <Icon name="spinner" className="w-6 h-6 text-[#1A3C2A]" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Progress */}
            <div className="mb-12 flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#424843]/60 font-bold">
                  Step {String(step + 1).padStart(2, '0')} of {STEPS.length.toString().padStart(2, '0')}
                </span>
                <h2 className="font-serif text-5xl text-[#1A3C2A] leading-tight">{meta.title}</h2>
              </div>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1 w-8 transition-colors ${i <= step ? 'bg-[#1A3C2A]' : 'bg-[#e4e2dd]'}`} />
                ))}
              </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-4">
                <div className="p-6 bg-[#f5f3ee] rounded sticky top-32">
                  <h3 className="font-serif text-xl mb-3 text-[#1A3C2A]">{meta.instruction.heading}</h3>
                  <p className="text-sm leading-relaxed text-[#424843]">{meta.instruction.body}</p>
                  <div className="mt-6 pt-6 border-t border-[#e4e2dd]">
                    <span className="text-[10px] uppercase tracking-widest text-[#424843]/50">Required Document</span>
                    <p className="text-xs font-medium text-[#1b1c19] mt-1">{meta.instruction.note}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8">
                <div className="bg-white p-10 rounded shadow-sm ring-1 ring-black/5">
                  {renderStepForm()}

                  {/* Billing step manages its own navigation buttons */}
                  {step < 6 && step !== 3 && step !== 5 && (
                    <div className="pt-10 flex justify-end items-center gap-4">
                      {step > 0 && (
                        <button type="button" onClick={() => setStep((s) => s - 1)}
                          className="px-6 py-3 text-sm font-semibold text-[#424843] hover:text-[#1A3C2A] transition-colors">
                          Back
                        </button>
                      )}
                      <button type="button" onClick={async () => {
                          const errors = validateStep(step, draft as Record<string, unknown>)
                          if (errors) {
                            setFieldErrors(errors)
                            return
                          }
                          setFieldErrors({})
                          await handleSaveDraft()
                          advanceStep()
                        }}
                        className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2">
                        <span>Save &amp; Continue</span>
                        <Icon name="arrow" className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 px-2 flex items-start gap-3 opacity-50">
                  <Icon name="lock" className="w-4 h-4 text-[#424843] mt-0.5 shrink-0" />
                  <p className="text-[10px] leading-relaxed text-[#424843] uppercase tracking-widest font-medium">
                    Clinical data is encrypted and stored according to HIPAA and GDPR standards. SwearBy Clinical Editorial maintains a zero-knowledge architecture.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
