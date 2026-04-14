'use client'

import { type DraftData, field, lbl, sec } from '../types'
import type { FieldErrors } from '../schemas'

export function PrescribersForm({ data, onChange, errors = {} }: { data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
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
