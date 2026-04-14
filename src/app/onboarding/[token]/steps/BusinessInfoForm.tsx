'use client'

import { type DraftData, field, lbl, sec } from '../types'
import type { FieldErrors } from '../schemas'
import { formatPhone, formatEIN } from '@/lib/utils'

export function BusinessInfoForm({ data, onChange, errors = {} }: { data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
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
