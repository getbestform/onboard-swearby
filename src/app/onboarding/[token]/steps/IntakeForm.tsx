'use client'

import { useState, useRef } from 'react'
import { uploadClinicLogo } from '@/app/actions/invite'
import { type DraftData, field, lbl, sec } from '../types'
import type { FieldErrors } from '../schemas'
import { Icon } from '../Icon'

export function IntakeForm({ token, data, onChange, errors = {} }: { token: string; data: DraftData; onChange: (d: Partial<DraftData>) => void; errors?: FieldErrors }) {
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
