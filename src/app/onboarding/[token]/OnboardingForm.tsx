'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import CalEmbed from '@calcom/embed-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { verifyInvite, saveDraft, loadDraft, submitApplication, createPaymentIntent, retrievePaymentDetails, uploadClinicLogo } from '@/app/actions/invite'
import { validateStep, type FieldErrors } from './schemas'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe payment will not load.')
}
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

interface OnboardingFormProps {
  token: string
  ownerName?: string
  email?: string
  initiallyVerified?: boolean
  initialDraft?: Record<string, unknown>
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const cls = `shrink-0 ${className}`
  switch (name) {
    case 'business': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="1" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M2 12h20" />
      </svg>
    )
    case 'medical': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" />
      </svg>
    )
    case 'medication': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" />
      </svg>
    )
    case 'payments': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      </svg>
    )
    case 'intake': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    )
    case 'review': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    )
    case 'calendar': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )
    case 'cloud': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" /><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
      </svg>
    )
    case 'help': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
    case 'lock': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
    case 'arrow': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    )
    case 'user': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    )
    case 'check': return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
    case 'spinner': return (
      <svg className={`animate-spin ${cls}`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    )
    default: return null
  }
}

// ── Wizard steps ──────────────────────────────────────────────────────────────

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
  { title: 'Onboarding Call',    instruction: { heading: 'Book Your Kickoff',           body: 'Schedule a 30-minute onboarding call with our clinical team. We\'ll walk through your setup, answer questions, and confirm your integration.',   note: 'Calendar powered by Cal.com — video link sent via email' } },
  { title: 'Review & Submit',    instruction: { heading: 'Final Review',               body: 'Verify all information is accurate before submitting. Our clinical team will review your application within 24 hours.',                          note: 'You will receive a confirmation email upon submission' } },
]

// ── Shared input styles ───────────────────────────────────────────────────────

const field = 'w-full bg-[#e4e2dd] border-none rounded px-4 py-3 text-sm text-[#1b1c19] placeholder:text-[#1b1c19]/30 outline-none focus:ring-1 focus:ring-[#1A3C2A]/20 focus:bg-white transition-all'
const lbl   = 'block text-[10px] font-semibold text-[#424843] uppercase tracking-widest mb-2'
const sec   = 'text-[10px] font-bold uppercase tracking-[0.2em] text-[#424843]/60 border-b border-[#e4e2dd] pb-2 mb-6'

// ── Draft data shape ──────────────────────────────────────────────────────────

type DraftData = {
  // business
  businessName?: string; ein?: string; npi?: string
  street?: string; city?: string; state?: string; zip?: string
  phone?: string; website?: string
  // prescribers
  prescriberName?: string; dea?: string; license?: string; licenseState?: string; specialty?: string
  // catalog
  drugs?: { drugName: string; doses: string; unitPrice: string; stateAvailability: string }[]
  // billing — Stripe-safe fields only, never raw card data
  paymentIntentId?: string; paymentStatus?: string; paymentClientSecret?: string
  cardholderName?: string; last4?: string; brand?: string
  // intake
  displayName?: string; brandColor?: string; description?: string; yearsInPractice?: string; locations?: string; logoUrl?: string
}

// ── Step form components (controlled) ────────────────────────────────────────

function formatPhone(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function formatEIN(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 9)
  return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d
}

function BusinessInfoForm({ data, onChange, errors = {} }: { data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <h4 className={sec}>Legal Identity</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className={lbl}>Legal Business Name <span className="text-red-500">*</span></label>
            <input className={`${field} ${errors.businessName ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="e.g. SwearBy Clinical Group LLC" type="text" value={data.businessName ?? ''} onChange={e => onChange({ businessName: e.target.value })} />
            {errors.businessName && <p className="text-[11px] text-red-500 mt-1.5">{errors.businessName}</p>}
          </div>
          <div>
            <label className={lbl}>Tax ID / EIN</label>
            <input className={field} placeholder="XX-XXXXXXX" inputMode="numeric" type="text" value={data.ein ?? ''} onChange={e => onChange({ ein: formatEIN(e.target.value) })} />
          </div>
          <div>
            <label className={lbl}>Clinic NPI</label>
            <input className={field} placeholder="10-digit number" inputMode="numeric" maxLength={10} type="text" value={data.npi ?? ''} onChange={e => onChange({ npi: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h4 className={sec}>Operational Address</h4>
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-6">
            <label className={lbl}>Street Address</label>
            <input className={field} placeholder="Suite 400, Clinical Plaza" type="text" value={data.street ?? ''} onChange={e => onChange({ street: e.target.value })} />
          </div>
          <div className="col-span-3">
            <label className={lbl}>City</label>
            <input className={field} type="text" value={data.city ?? ''} onChange={e => onChange({ city: e.target.value })} />
          </div>
          <div className="col-span-1">
            <label className={lbl}>State</label>
            <input className={field} maxLength={2} placeholder="NY" type="text" value={data.state ?? ''} onChange={e => onChange({ state: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2) })} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Postal Code</label>
            <input className={field} inputMode="numeric" maxLength={5} placeholder="10001" type="text" value={data.zip ?? ''} onChange={e => onChange({ zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h4 className={sec}>Reach &amp; Communication</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={lbl}>Primary Phone</label>
            <input className={`${field} ${errors.phone ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="(555) 000-0000" inputMode="numeric" type="tel" value={data.phone ?? ''} onChange={e => onChange({ phone: formatPhone(e.target.value) })} />
            {errors.phone && <p className="text-[11px] text-red-500 mt-1.5">{errors.phone}</p>}
          </div>
          <div>
            <label className={lbl}>Public Website</label>
            <input className={`${field} ${errors.website ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="https://clinic.com" type="url" value={data.website ?? ''} onChange={e => onChange({ website: e.target.value })} />
            {errors.website && <p className="text-[11px] text-red-500 mt-1.5">{errors.website}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function PrescribersForm({ data, onChange, errors = {} }: { data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
  return (
    <div className="space-y-6">
      <h4 className={sec}>Primary Prescriber</h4>
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className={lbl}>Full Name <span className="text-red-500">*</span></label>
          <input className={`${field} ${errors.prescriberName ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="Dr. Jane Smith" type="text" value={data.prescriberName ?? ''} onChange={e => onChange({ prescriberName: e.target.value })} />
          {errors.prescriberName && <p className="text-[11px] text-red-500 mt-1.5">{errors.prescriberName}</p>}
        </div>
        <div>
          <label className={lbl}>DEA Number</label>
          <input className={field} placeholder="AB1234567" maxLength={9} type="text" value={data.dea ?? ''} onChange={e => onChange({ dea: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9) })} />
        </div>
        <div>
          <label className={lbl}>Medical License #</label>
          <input className={field} placeholder="State license number" type="text" value={data.license ?? ''} onChange={e => onChange({ license: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>Licensing State</label>
          <input className={field} maxLength={2} placeholder="NY" type="text" value={data.licenseState ?? ''} onChange={e => onChange({ licenseState: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2) })} />
        </div>
        <div>
          <label className={lbl}>Specialty</label>
          <input className={field} placeholder="e.g. Internal Medicine" type="text" value={data.specialty ?? ''} onChange={e => onChange({ specialty: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

const emptyDrug = () => ({ drugName: '', doses: '', unitPrice: '', stateAvailability: '' })

function DrugCatalogForm({ data, onChange, errors = {} }: { data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
  const drugs = data.drugs?.length ? data.drugs : [emptyDrug()]

  function updateDrug(index: number, patch: Partial<typeof drugs[0]>) {
    const next = drugs.map((d, i) => i === index ? { ...d, ...patch } : d)
    onChange({ drugs: next })
  }

  function addDrug() {
    onChange({ drugs: [...drugs, emptyDrug()] })
  }

  function removeDrug(index: number) {
    const next = drugs.filter((_, i) => i !== index)
    onChange({ drugs: next.length ? next : [emptyDrug()] })
  }

  return (
    <div className="space-y-6">
      {drugs.map((drug, i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className={sec}>Drug Entry {drugs.length > 1 ? i + 1 : ''}</h4>
            {drugs.length > 1 && (
              <button type="button" onClick={() => removeDrug(i)}
                className="text-[10px] font-semibold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className={lbl}>Drug Name <span className="text-red-500">*</span></label>
              <input className={`${field} ${errors[`drugs.${i}.drugName`] ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="e.g. Semaglutide" type="text" value={drug.drugName} onChange={e => updateDrug(i, { drugName: e.target.value })} />
              {errors[`drugs.${i}.drugName`] && <p className="text-[11px] text-red-500 mt-1.5">{errors[`drugs.${i}.drugName`]}</p>}
            </div>
            <div>
              <label className={lbl}>Available Doses <span className="text-red-500">*</span></label>
              <input className={`${field} ${errors[`drugs.${i}.doses`] ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="e.g. 0.25mg, 0.5mg, 1mg" type="text" value={drug.doses} onChange={e => updateDrug(i, { doses: e.target.value })} />
              {errors[`drugs.${i}.doses`] && <p className="text-[11px] text-red-500 mt-1.5">{errors[`drugs.${i}.doses`]}</p>}
            </div>
            <div>
              <label className={lbl}>Unit Price <span className="text-red-500">*</span></label>
              <input className={`${field} text-right ${errors[`drugs.${i}.unitPrice`] ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="$0.00" inputMode="decimal" type="text" value={drug.unitPrice} onChange={e => updateDrug(i, { unitPrice: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') })} />
              {errors[`drugs.${i}.unitPrice`] && <p className="text-[11px] text-red-500 mt-1.5">{errors[`drugs.${i}.unitPrice`]}</p>}
            </div>
            <div className="col-span-2">
              <label className={lbl}>State Availability <span className="text-red-500">*</span></label>
              <input className={`${field} ${errors[`drugs.${i}.stateAvailability`] ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="e.g. NY, CA, TX (comma separated)" type="text" value={drug.stateAvailability} onChange={e => updateDrug(i, { stateAvailability: e.target.value })} />
              {errors[`drugs.${i}.stateAvailability`] && <p className="text-[11px] text-red-500 mt-1.5">{errors[`drugs.${i}.stateAvailability`]}</p>}
            </div>
          </div>
          {i < drugs.length - 1 && <div className="border-t border-[#e4e2dd]" />}
        </div>
      ))}
      <button type="button" onClick={addDrug}
        className="w-full py-3 border border-dashed border-[#1A3C2A]/30 rounded text-[10px] font-semibold uppercase tracking-widest text-[#1A3C2A]/60 hover:border-[#1A3C2A]/60 hover:text-[#1A3C2A] transition-colors">
        + Add Another Drug
      </button>
    </div>
  )
}

// ── Stripe payment form ───────────────────────────────────────────────────────

function StripeCardForm({
  token,
  onChange,
  onBack,
  onAdvance,
}: {
  token: string
  onChange: (d: Partial<DraftData>) => void
  onBack: () => void
  onAdvance: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardholderName, setCardholderName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    if (!stripe || !elements) return
    if (!cardholderName.trim()) { setError('Please enter the cardholder name.'); return }
    setError(null)
    setPending(true)
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      })
      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed. Please try again.')
        return
      }
      if (paymentIntent?.status === 'succeeded') {
        const details = await retrievePaymentDetails(paymentIntent.id)
        if ('error' in details) console.error('[retrievePaymentDetails]', details.error)
        const patch: Partial<DraftData> = {
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'succeeded',
          cardholderName,
          last4: 'last4' in details ? details.last4 : undefined,
          brand: 'brand' in details ? details.brand : undefined,
        }
        // Persist before advancing — payment data is critical
        await saveDraft(token, patch as Record<string, unknown>)
        onChange(patch)
        onAdvance()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={lbl}>Cardholder Name <span className="text-red-500">*</span></label>
        <input
          className={field}
          placeholder="DR. ELIZA VANCE"
          type="text"
          value={cardholderName}
          onChange={e => setCardholderName(e.target.value)}
        />
      </div>
      <div>
        <label className={lbl}>Card Details <span className="text-red-500">*</span></label>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      <div className="pt-4 flex justify-end items-center gap-4">
        <button type="button" onClick={onBack}
          className="px-6 py-3 text-sm font-semibold text-[#424843] hover:text-[#1A3C2A] transition-colors">
          Back
        </button>
        <button type="button" onClick={handlePay} disabled={!stripe || !elements || pending}
          className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
          {pending && <Icon name="spinner" className="w-4 h-4" />}
          <span>{pending ? 'Processing…' : 'Pay $2,500 & Continue'}</span>
          {!pending && <Icon name="arrow" className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function BillingForm({
  token,
  data,
  onChange,
  onBack,
  onAdvance,
}: {
  token: string
  data: DraftData
  onChange: (d: Partial<DraftData>) => void
  onBack: () => void
  onAdvance: () => void
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(data.paymentClientSecret ?? null)
  const [initError, setInitError] = useState<string | null>(null)
  const intentRequested = useRef(false)

  useEffect(() => {
    if (data.paymentIntentId && data.paymentStatus === 'succeeded') return
    if (clientSecret) return // reuse intent from draft
    if (intentRequested.current) return // prevent double-fire in Strict Mode
    intentRequested.current = true
    createPaymentIntent(token).then((result) => {
      if ('error' in result) { setInitError(result.error); return }
      setClientSecret(result.clientSecret)
      saveDraft(token, { paymentClientSecret: result.clientSecret })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Already paid — show confirmation and let user proceed
  if (data.paymentIntentId && data.paymentStatus === 'succeeded') {
    const brandLabel = data.brand
      ? data.brand.charAt(0).toUpperCase() + data.brand.slice(1)
      : 'Card'
    return (
      <div className="space-y-6">
        <h4 className={sec}>Initial Deposit — $2,500.00</h4>
        <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <Icon name="check" className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Payment Successful</p>
            <p className="text-xs text-green-700 mt-0.5">
              {brandLabel} ••••{data.last4} — {data.cardholderName}
            </p>
          </div>
        </div>
        <div className="pt-4 flex justify-end items-center gap-4">
          <button type="button" onClick={onBack}
            className="px-6 py-3 text-sm font-semibold text-[#424843] hover:text-[#1A3C2A] transition-colors">
            Back
          </button>
          <button type="button" onClick={onAdvance}
            className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2">
            <span>Continue</span>
            <Icon name="arrow" className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="space-y-6">
        <h4 className={sec}>Initial Deposit — $2,500.00</h4>
        <p className="text-sm text-red-600">{initError}</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="space-y-6">
        <h4 className={sec}>Initial Deposit — $2,500.00</h4>
        <div className="flex items-center gap-2 text-[#424843]/60">
          <Icon name="spinner" className="w-4 h-4" />
          <span className="text-sm">Preparing payment…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h4 className={sec}>Initial Deposit — $2,500.00</h4>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#1A3C2A',
              colorBackground: '#e4e2dd',
              colorText: '#1b1c19',
              colorDanger: '#ef4444',
              borderRadius: '4px',
              fontFamily: 'Inter, sans-serif',
            },
          },
        }}
      >
        <StripeCardForm
          token={token}
          onChange={onChange}
          onBack={onBack}
          onAdvance={onAdvance}
        />
      </Elements>
    </div>
  )
}

function IntakeForm({ token, data, onChange, errors = {} }: { token: string; data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoFile(file: File) {
    setUploadError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadClinicLogo(token, fd)
      if ('error' in result) {
        setUploadError(result.error)
      } else {
        onChange({ logoUrl: result.url })
      }
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleLogoFile(file)
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <h4 className={sec}>Clinic Branding</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className={lbl}>Clinic Display Name <span className="text-red-500">*</span></label>
            <input className={`${field} ${errors.displayName ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`} placeholder="e.g. Thorne Clinical Partners" type="text" value={data.displayName ?? ''} onChange={e => onChange({ displayName: e.target.value })} />
            {errors.displayName && <p className="text-[11px] text-red-500 mt-1.5">{errors.displayName}</p>}
          </div>
          <div className="col-span-2">
            <label className={lbl}>Clinic Logo</label>
            <div
              className={`relative flex flex-col items-center justify-center gap-3 rounded border-2 border-dashed p-8 transition-colors cursor-pointer ${dragOver ? 'border-[#1A3C2A] bg-[#1A3C2A]/5' : 'border-[#c8c5bc] bg-[#e4e2dd]/40 hover:border-[#1A3C2A]/40'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {data.logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.logoUrl} alt="Clinic logo preview" className="max-h-24 max-w-full object-contain rounded" />
                  <p className="text-[11px] text-[#424843]/60">Click or drop to replace</p>
                </>
              ) : uploading ? (
                <div className="flex items-center gap-2 text-sm text-[#424843]">
                  <Icon name="spinner" className="w-4 h-4" />
                  Uploading…
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-[#424843]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm text-[#424843]">Drop your logo here or <span className="text-[#1A3C2A] font-medium">browse</span></p>
                  <p className="text-[11px] text-[#424843]/50">PNG, JPEG, WebP or SVG · max 5 MB · min 512×512 px recommended</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }}
              />
            </div>
            {uploadError && <p className="text-[11px] text-red-500 mt-1.5">{uploadError}</p>}
          </div>
          <div className="col-span-2">
            <label className={lbl}>Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={data.brandColor ?? '#1A3C2A'} onChange={e => onChange({ brandColor: e.target.value })} className="h-10 w-16 rounded cursor-pointer border-none bg-transparent p-0" />
              <input className={`${field} flex-1`} placeholder="#1A3C2A" type="text" value={data.brandColor ?? ''} onChange={e => onChange({ brandColor: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <h4 className={sec}>Business Details</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className={lbl}>Practice Description</label>
            <textarea className={`${field} resize-none h-24`} placeholder="Brief description of your practice and specialties…" value={data.description ?? ''} onChange={e => onChange({ description: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Years in Practice</label>
            <input className={field} placeholder="e.g. 8" type="number" min="0" value={data.yearsInPractice ?? ''} onChange={e => onChange({ yearsInPractice: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>Number of Locations</label>
            <input className={field} placeholder="e.g. 2" type="number" min="1" value={data.locations ?? ''} onChange={e => onChange({ locations: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleForm() {
  const raw = process.env.NEXT_PUBLIC_CAL_ONBOARDING_LINK

  if (!raw) {
    return (
      <div className="py-12 text-center text-[#424843]/50 text-sm">
        Scheduling is not configured. Set <code className="font-mono text-xs bg-[#e4e2dd] px-1 py-0.5 rounded">NEXT_PUBLIC_CAL_ONBOARDING_LINK</code> to enable this step.
      </div>
    )
  }

  let calOrigin = 'https://app.cal.com'
  let calLink = raw
  try {
    const u = new URL(raw)
    calOrigin = u.origin
    calLink = u.pathname.replace(/^\//, '')
  } catch {
    // raw is already a bare path — keep defaults
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#424843]">
        Pick a time that works for you. You&apos;ll receive a confirmation email with a video link.
      </p>
      <CalEmbed
        namespace="onboarding"
        calLink={calLink}
        calOrigin={calOrigin}
        config={{ layout: 'month_view' as const, theme: 'light', brandColor: '#1A3C2A' }}
        style={{ width: '100%', minHeight: 500, overflow: 'auto' }}
      />
    </div>
  )
}

function ReviewForm({ token, data, onComplete }: { token: string; data: DraftData; onComplete: () => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sections = [
    { label: 'Business Info',  summary: [data.businessName, data.ein, data.npi, data.city, data.phone].filter(Boolean).join(' · ') || 'No data entered' },
    { label: 'Prescribers',    summary: [data.prescriberName, data.dea, data.specialty].filter(Boolean).join(' · ') || 'No data entered' },
    { label: 'Drug Catalog',   summary: data.drugs?.filter(d => d.drugName).map(d => d.drugName).join(', ') || 'No data entered' },
    { label: 'Billing', summary: data.paymentIntentId && data.paymentStatus === 'succeeded' ? `${data.brand ? data.brand.charAt(0).toUpperCase() + data.brand.slice(1) : 'Card'}${data.last4 ? ` ••••${data.last4}` : ''} — Paid` : 'Payment not completed' },
    { label: 'Intake',         summary: [data.displayName, data.brandColor, data.logoUrl ? 'Logo uploaded' : ''].filter(Boolean).join(' · ') || 'No data entered' },
  ]

  async function handleSubmit() {
    setError(null)
    setPending(true)
    try {
      // Ensure latest draft (including drug catalog) is persisted before submitting
      const saveResult = await saveDraft(token, data as Record<string, unknown>)
      if ('error' in saveResult) {
        setError('Failed to save your data. Please try again.')
        return
      }
      const result = await submitApplication(token)
      if ('error' in result) {
        setError(result.error)
      } else {
        onComplete()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.label} className="flex items-start gap-4 p-5 bg-[#f5f3ee] rounded">
            <div className="w-5 h-5 rounded-full bg-[#1A3C2A] flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="check" className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A3C2A] mb-0.5">{s.label}</p>
              <p className="text-xs text-[#424843]">{s.summary}</p>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
      <p className="text-[11px] text-[#424843]/60 uppercase tracking-widest leading-relaxed">
        By submitting you agree to the SwearBy Clinical Master Services Agreement. Our team will review your application and be in touch within 24 hours.
      </p>
      <button type="button" onClick={handleSubmit} disabled={pending}
        className="w-full py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        <span>{pending ? 'Submitting…' : 'Submit Application'}</span>
        {!pending && <Icon name="arrow" className="w-4 h-4" />}
      </button>
    </div>
  )
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function OnboardingWizard({ token, initialDraft, onComplete }: { token: string; initialDraft?: Record<string, unknown>; onComplete: () => void }) {
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
      case 5: return <ScheduleForm />
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
                  {step < 6 && step !== 3 && (
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

// ── Step 1: Verify ────────────────────────────────────────────────────────────

function VerifyStep({ token, ownerName, email, onVerified }: { token: string; ownerName?: string; email?: string; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [emailVal, setEmailVal] = useState(email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const parts = ownerName?.trim().split(' ') ?? []
  const prefix = parts[0]?.match(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)$/i) ? parts[0] : ''
  const rest = prefix ? parts.slice(1) : parts
  const lastName = rest[rest.length - 1] ?? ''
  const displayFirst = prefix ? `${prefix} ${rest.slice(0, -1).join(' ')}`.trim() : rest.slice(0, -1).join(' ')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (code.length < 5) { setError('Please enter all 5 digits.'); return }
    if (!emailVal) { setError('Please enter your email.'); return }
    setPending(true)
    try {
      const result = await verifyInvite(token, code, emailVal)
      if ('error' in result) { setError(result.error) } else {
        await saveDraft(token, { verified: true })
        onVerified()
      }
    } finally { setPending(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: 'linear-gradient(145deg, #022616 0%, #1a3c2a 100%)' }}>
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }} />
      </div>
      <div className="fixed left-12 bottom-12 hidden lg:flex flex-col items-center opacity-40">
        <div className="h-64 w-px bg-gradient-to-t from-[#a9cfb6] to-transparent mb-6" />
        <p className="text-[#a9cfb6] font-serif italic text-xs tracking-[0.2em] select-none" style={{ writingMode: 'vertical-rl' }}>
          Est. MMXXIV SwearBy Clinical
        </p>
      </div>
      <div className="fixed right-12 top-12 hidden lg:block opacity-40">
        <p className="text-[#a9cfb6] text-[10px] uppercase tracking-[0.3em] mb-1 text-right">Status</p>
        <div className="flex items-center justify-end gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <p className="text-white text-[10px] uppercase tracking-widest">HIPAA Secure</p>
        </div>
      </div>
      <main className="relative z-10 w-full max-w-xl px-8 flex flex-col items-center">
        <div className="mb-16 text-center">
          <p className="text-[#a9cfb6] tracking-[0.4em] font-serif text-xs uppercase mb-10">Founding Partner Portal</p>
          <h1 className="text-white font-serif text-4xl md:text-5xl leading-tight mb-4 tracking-tight">
            {ownerName ? (<>{displayFirst && <>{displayFirst} </>}<em>{lastName}</em></>) : (<>Welcome, <em>Doctor</em></>)}
          </h1>
          <p className="text-[#82a78f] text-sm tracking-widest uppercase opacity-80">Private Access</p>
        </div>
        <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="relative group">
              <label className="block text-[#a9cfb6] text-[10px] uppercase tracking-[0.2em] mb-3 ml-1">5-Digit Access Code</label>
              <input type="text" inputMode="numeric" maxLength={5} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="0 0 0 0 0"
                className="w-full bg-white/5 border-none rounded-sm text-center font-serif text-3xl tracking-[0.5em] py-6 text-white focus:ring-1 focus:ring-[#a9cfb6] transition-all placeholder:text-white/10 outline-none" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-white/10 group-focus-within:bg-[#a9cfb6] transition-colors" />
            </div>
            <div className="relative group">
              <label className="block text-[#a9cfb6] text-[10px] uppercase tracking-[0.2em] mb-3 ml-1">Verified Email Address</label>
              <input type="email" value={emailVal} onChange={(e) => setEmailVal(e.target.value)} placeholder="clinical.director@swearby.com"
                className="w-full bg-white/5 border-none rounded-sm px-6 py-5 text-base text-white focus:ring-1 focus:ring-[#a9cfb6] transition-all placeholder:text-white/20 outline-none" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-white/10 group-focus-within:bg-[#a9cfb6] transition-colors" />
            </div>
            {error && <p className="text-red-300/70 text-[11px]">{error}</p>}
            <div className="pt-4 flex flex-col items-center">
              <button type="submit" disabled={pending} className="w-full py-5 rounded-sm shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(145deg, #022616 0%, #1a3c2a 100%)' }}>
                <span className="text-white text-xs uppercase tracking-[0.3em] font-semibold flex items-center justify-center gap-3">
                  {pending ? 'Verifying…' : <>Continue <span className="text-lg leading-none">→</span></>}
                </span>
              </button>
              <p className="mt-8 text-[#82a78f]/40 text-[10px] uppercase tracking-widest">Authenticated Session Required</p>
            </div>
          </form>
        </div>
        <div className="mt-24 flex items-center gap-4 opacity-30">
          <div className="h-px w-12 bg-[#a9cfb6]" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#a9cfb6"><path d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z" /></svg>
          <div className="h-px w-12 bg-[#a9cfb6]" />
        </div>
      </main>
    </div>
  )
}

// ── Complete ──────────────────────────────────────────────────────────────────

function CompleteStep() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #022616 0%, #1a3c2a 100%)' }}>
      <div className="text-center px-8">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
          <Icon name="check" className="w-7 h-7 text-white" />
        </div>
        <p className="text-[#a9cfb6] tracking-[0.4em] font-serif text-xs uppercase mb-4">Enrollment Confirmed</p>
        <h1 className="text-white font-serif text-4xl md:text-5xl leading-tight mb-6">You&apos;re In</h1>
        <p className="text-[#82a78f] text-sm max-w-sm mx-auto leading-relaxed">
          Your founding partner position has been secured. Our clinical team will be in touch within 24 hours.
        </p>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

type FlowStep = 'verify' | 'wizard' | 'complete'

export default function OnboardingForm({ token, ownerName, email, initiallyVerified, initialDraft }: OnboardingFormProps) {
  const [step, setStep] = useState<FlowStep>(initiallyVerified ? 'wizard' : 'verify')

  if (step === 'verify') return <VerifyStep token={token} ownerName={ownerName} email={email} onVerified={() => setStep('wizard')} />
  if (step === 'wizard') return <OnboardingWizard token={token} initialDraft={initialDraft} onComplete={() => setStep('complete')} />
  return <CompleteStep />
}
