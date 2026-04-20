'use client'

import { useState } from 'react'
import { type DraftData, field, lbl, sec } from '../types'
import { Icon } from '../Icon'

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok
        ? <Icon name="check" className="w-3.5 h-3.5 text-[#1A3C2A]" />
        : <span className="w-3.5 h-3.5 flex items-center justify-center text-[#424843]/30 text-[10px]">○</span>
      }
      <span className={`text-[11px] ${ok ? 'text-[#1A3C2A]' : 'text-[#424843]/50'}`}>{label}</span>
    </div>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function PasswordForm({
  data,
  onChange,
  ownerName,
  email,
  onBack,
  onAdvance,
}: {
  data: DraftData
  onChange: (d: Partial<DraftData>) => void
  ownerName?: string
  email?: string
  onBack?: () => void
  // receives the validated password so the wizard can save it explicitly before advancing
  onAdvance: (password: string) => Promise<void>
}) {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [errors, setErrors]           = useState<Record<string, string>>({})

  const firstName = ownerName?.split(' ')[0] ?? 'there'

  const reqs = {
    length:    password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  }
  const passwordValid = Object.values(reqs).every(Boolean)
  const passwordsMatch = password.length > 0 && password === confirm

  async function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!password)        errs.password = 'Password is required.'
    else if (!passwordValid) errs.password = 'Password does not meet all requirements.'
    if (!confirm)         errs.confirm  = 'Please confirm your password.'
    else if (password !== confirm) errs.confirm = 'Passwords do not match.'
    if (!data.tosAccepted)     errs.tos     = 'You must agree to the Terms of Service.'
    if (!data.privacyAccepted) errs.privacy = 'You must agree to the Privacy Policy.'

    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      await onAdvance(password)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* Welcome header */}
      <div className="pb-6 border-b border-[#e4e2dd]">
        <p className="text-[10px] uppercase tracking-widest text-[#424843]/50 mb-1">Private Activation</p>
        <h3 className="font-display text-3xl text-[#1A3C2A]">Welcome, {firstName}</h3>
        <p className="text-sm text-[#424843]/70 mt-1">We've prepared your private activation.</p>
        {data.displayName && (
          <p className="text-sm font-medium text-[#1b1c19] mt-3">
            {data.displayName}{' '}
            <span className="text-[#424843]/50">— Founding Partner Clinic</span>
          </p>
        )}
      </div>

      {/* Password fields */}
      <div className="space-y-6">
        <h4 className={sec}>Create Your Password</h4>

        {/* Locked email */}
        <div>
          <label className={lbl}>Email Address</label>
          <input
            className={`${field} opacity-60 cursor-not-allowed select-none`}
            type="email"
            value={email ?? ''}
            readOnly
            tabIndex={-1}
          />
        </div>

        {/* Password */}
        <div>
          <label className={lbl}>Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              className={`${field} pr-12 ${errors.password ? 'ring-1 ring-red-400 bg-red-50/30' : ''}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={password}
              autoComplete="new-password"
              onChange={e => {
                setPassword(e.target.value)
                setErrors(prev => ({ ...prev, password: '' }))
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#424843]/40 hover:text-[#424843] transition-colors"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {errors.password && <p className="text-[11px] text-red-500 mt-1.5">{errors.password}</p>}

          {/* Live requirements */}
          <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-4">
            <Req ok={reqs.length}    label="At least 12 characters" />
            <Req ok={reqs.uppercase} label="One uppercase letter" />
            <Req ok={reqs.number}    label="One number" />
            <Req ok={reqs.special}   label="One special character" />
          </div>
        </div>

        {/* Confirm */}
        <div>
          <label className={lbl}>Confirm Password <span className="text-red-500">*</span></label>
          <input
            className={`${field} ${errors.confirm ? 'ring-1 ring-red-400 bg-red-50/30' : passwordsMatch ? 'ring-1 ring-[#1A3C2A]/30' : ''}`}
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            value={confirm}
            autoComplete="new-password"
            onChange={e => {
              setConfirm(e.target.value)
              setErrors(prev => ({ ...prev, confirm: '' }))
            }}
          />
          {errors.confirm && <p className="text-[11px] text-red-500 mt-1.5">{errors.confirm}</p>}
          {!errors.confirm && passwordsMatch && (
            <p className="text-[11px] text-[#1A3C2A] mt-1.5 flex items-center gap-1">
              <Icon name="check" className="w-3 h-3" /> Passwords match
            </p>
          )}
        </div>
      </div>

      {/* Agreements */}
      <div className="space-y-3 pt-2">
        <h4 className={sec}>Agreements</h4>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={data.tosAccepted ?? false}
            className="mt-0.5 h-4 w-4 rounded border-[#c8c5bc] accent-[#1A3C2A] cursor-pointer"
            onChange={e => {
              onChange({ tosAccepted: e.target.checked })
              setErrors(prev => ({ ...prev, tos: '' }))
            }}
          />
          <span className="text-sm text-[#424843] group-hover:text-[#1b1c19] transition-colors">
            I agree to the Swearby{' '}
            <span className="text-[#1A3C2A] underline underline-offset-2">Terms of Service</span>
          </span>
        </label>
        {errors.tos && <p className="text-[11px] text-red-500 ml-7">{errors.tos}</p>}

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={data.privacyAccepted ?? false}
            className="mt-0.5 h-4 w-4 rounded border-[#c8c5bc] accent-[#1A3C2A] cursor-pointer"
            onChange={e => {
              onChange({ privacyAccepted: e.target.checked })
              setErrors(prev => ({ ...prev, privacy: '' }))
            }}
          />
          <span className="text-sm text-[#424843] group-hover:text-[#1b1c19] transition-colors">
            I agree to the Swearby{' '}
            <span className="text-[#1A3C2A] underline underline-offset-2">Privacy Policy</span>
          </span>
        </label>
        {errors.privacy && <p className="text-[11px] text-red-500 ml-7">{errors.privacy}</p>}
      </div>

      {/* Nav */}
      <div className="pt-4 flex justify-end items-center gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 text-sm font-semibold text-[#424843] hover:text-[#1A3C2A] transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-10 py-4 bg-[#1A3C2A] text-white text-sm font-bold rounded shadow-xl shadow-[#1A3C2A]/10 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {submitting
            ? <><Icon name="spinner" className="w-4 h-4" /><span>Saving…</span></>
            : <><span>Save &amp; Continue</span><Icon name="arrow" className="w-4 h-4" /></>
          }
        </button>
      </div>
    </div>
  )
}
