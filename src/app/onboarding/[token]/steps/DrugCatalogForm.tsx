'use client'

import { type DraftData, field, lbl, sec } from '../types'
import type { FieldErrors } from '../schemas'

const emptyDrug = () => ({ drugName: '', doses: '', unitPrice: '', stateAvailability: '' })

export function DrugCatalogForm({ data, onChange, errors = {} }: { data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
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
