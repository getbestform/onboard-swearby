'use client'

import { useActionState, useState, useEffect } from 'react'
import { sendInvite } from '@/app/actions/invite'

const entityTypes = ['LLC', 'PLLC', 'Corporation', 'PC', 'Partnership', 'Sole Proprietor', 'Other']

type FieldErrors = Record<string, string | string[]>

function FieldError({ errors, field }: { errors: FieldErrors; field: string }) {
  const msg = errors[field]
  if (!msg) return null
  return (
    <p className="text-[11px] text-tertiary mt-1">
      {Array.isArray(msg) ? msg[0] : msg}
    </p>
  )
}

function Toast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 flex items-start gap-3 bg-white border border-secondary/20 rounded-xl shadow-lg px-4 py-3 w-80 z-50">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary">Invitation Successful</p>
        <p className="text-xs text-secondary mt-0.5">Invite sent and link copied to your clipboard.</p>
      </div>
      <button onClick={onClose} className="text-secondary hover:text-primary transition-colors shrink-0 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function InvitePage() {
  const [state, action, pending] = useActionState(sendInvite, undefined)
  const [entity, setEntity] = useState('LLC')
  const [showToast, setShowToast] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const fieldErrors: FieldErrors = (state && 'fieldErrors' in state) ? state.fieldErrors : {}
  const globalError = (state && 'error' in state) ? state.error : undefined

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      setShowToast(true)
      setFormKey((k) => k + 1)
      setEntity('LLC')
    }
  }, [state])

  return (
    <div className="max-w-4xl">
      <p className="text-[10px] uppercase tracking-[0.15em] text-secondary mb-3">
        New Practitioner Enrollment
      </p>
      <h1 className="font-serif text-4xl text-primary leading-tight">Invite to Onboard</h1>
      <div className="w-10 h-0.5 bg-primary mt-3 mb-8" />

      <div className="flex gap-8">
        <form key={formKey} action={action} className="flex-1 min-w-0">
          <div className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ownerName" className="text-[10px] uppercase tracking-widest text-secondary">
                Contact Name
              </label>
              <input
                id="ownerName" name="ownerName" type="text" required
                placeholder="e.g. Dr. Julian Thorne"
                className={`h-10 rounded border bg-white px-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors ${fieldErrors.ownerName ? 'border-tertiary/60' : 'border-secondary/25'}`}
              />
              <FieldError errors={fieldErrors} field="ownerName" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="entityName" className="text-[10px] uppercase tracking-widest text-secondary">
                Legal Business Name
              </label>
              <input
                id="entityName" name="entityName" type="text" required
                placeholder="e.g. Thorne Clinical Partners LLC"
                className={`h-10 rounded border bg-white px-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors ${fieldErrors.entityName ? 'border-tertiary/60' : 'border-secondary/25'}`}
              />
              <FieldError errors={fieldErrors} field="entityName" />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-secondary">
                  Email Address
                </label>
                <input
                  id="email" name="email" type="email" required
                  placeholder="julian@thorneclinical.com"
                  className={`h-10 rounded border bg-white px-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors w-full ${fieldErrors.email ? 'border-tertiary/60' : 'border-secondary/25'}`}
                />
                <FieldError errors={fieldErrors} field="email" />
              </div>

              <div className="flex flex-col gap-1.5 w-40 shrink-0">
                <label htmlFor="entityType" className="text-[10px] uppercase tracking-widest text-secondary">
                  Entity Type
                </label>
                <div className="relative">
                  <select
                    id="entityType" name="entityType"
                    value={entity} onChange={(e) => setEntity(e.target.value)}
                    className="h-10 w-full rounded border border-secondary/25 bg-white px-3 pr-8 text-sm text-primary outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                  >
                    {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {globalError && (
              <p className="text-xs text-tertiary bg-tertiary/8 border border-tertiary/20 rounded px-3 py-2">
                {globalError}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-secondary max-w-[220px] leading-relaxed">
                This invitation will remain valid for 7 days and provides secure portal access.
              </p>
              <button
                type="submit" disabled={pending}
                className="flex items-center gap-2 bg-primary text-neutral text-xs uppercase tracking-widest px-5 h-10 rounded hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
              >
                {pending ? 'Sending…' : 'Send Invite'}
                {!pending && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="rounded bg-secondary/10 p-4">
            <p className="text-xs font-medium text-primary mb-2">Security Protocol</p>
            <p className="text-xs text-secondary leading-relaxed">
              Invites are issued through our encrypted escrow system. Once the practitioner accepts, their entity type will be verified against state medical registries to ensure HIPAA and SOC2 compliance.
            </p>
          </div>

          <div className="rounded overflow-hidden bg-secondary/10 aspect-video flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-secondary/40">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-secondary mb-1.5">Audit Log</p>
            <p className="text-xs text-secondary leading-relaxed italic">
              "Last practitioner invited 4 hours ago: Dr. Sarah Chen (SC-880)"
            </p>
          </div>
        </div>
      </div>

      {showToast && <Toast onClose={() => setShowToast(false)} />}
    </div>
  )
}
