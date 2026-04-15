'use client'

import { useActionState, useState, useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { sendInvite, listInvites, approveInvite, denyInvite, type Invite } from '@/app/actions/invite'
import { fmtDate, getInviteStatusClasses } from '@/lib/utils'

const entityTypes = ['LLC', 'PLLC', 'Corporation', 'PC', 'Partnership', 'Sole Proprietor', 'Other']
const statusOptions = ['pending', 'completed', 'call_scheduled', 'approved', 'denied', 'expired']

type FieldErrors = Record<string, string | string[]>

function statusBadge(status: string) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium border ${getInviteStatusClasses(status)}`}>
      {status}
    </span>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function FieldError({ errors, field }: { errors: FieldErrors; field: string }) {
  const msg = errors[field]
  if (!msg) return null
  return <p className="text-[11px] text-tertiary mt-1">{Array.isArray(msg) ? msg[0] : msg}</p>
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

function NewInviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [state, action, pending] = useActionState(sendInvite, undefined)
  const [entity, setEntity] = useState('LLC')
  const [formKey, setFormKey] = useState(0)

  const fieldErrors: FieldErrors = (state && 'fieldErrors' in state) ? state.fieldErrors : {}
  const globalError = (state && 'error' in state) ? state.error : undefined

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      onSuccess()
      onClose()
    }
  }, [state, onSuccess, onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-neutral rounded-2xl shadow-xl w-full max-w-lg mx-4 p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-secondary mb-1">New Practitioner Enrollment</p>
            <h2 className="font-serif text-2xl text-primary leading-tight">Invite to Onboard</h2>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors mt-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form key={formKey} action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ownerName" className="text-[10px] uppercase tracking-widest text-secondary">Contact Name</label>
            <input
              id="ownerName" name="ownerName" type="text" required
              placeholder="e.g. Dr. Julian Thorne"
              className={`h-10 rounded border bg-white px-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors ${fieldErrors.ownerName ? 'border-tertiary/60' : 'border-secondary/25'}`}
            />
            <FieldError errors={fieldErrors} field="ownerName" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="entityName" className="text-[10px] uppercase tracking-widest text-secondary">Legal Business Name</label>
            <input
              id="entityName" name="entityName" type="text" required
              placeholder="e.g. Thorne Clinical Partners LLC"
              className={`h-10 rounded border bg-white px-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors ${fieldErrors.entityName ? 'border-tertiary/60' : 'border-secondary/25'}`}
            />
            <FieldError errors={fieldErrors} field="entityName" />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest text-secondary">Email Address</label>
              <input
                id="email" name="email" type="email" required
                placeholder="julian@thorneclinical.com"
                className={`h-10 rounded border bg-white px-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors w-full ${fieldErrors.email ? 'border-tertiary/60' : 'border-secondary/25'}`}
              />
              <FieldError errors={fieldErrors} field="email" />
            </div>
            <div className="flex flex-col gap-1.5 w-36 shrink-0">
              <label htmlFor="entityType" className="text-[10px] uppercase tracking-widest text-secondary">Entity Type</label>
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
            <p className="text-xs text-tertiary bg-tertiary/8 border border-tertiary/20 rounded px-3 py-2">{globalError}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-secondary max-w-[200px] leading-relaxed">
              Valid for 7 days. Provides secure portal access.
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
        </form>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function InvitesPage() {
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const [invites, setInvites] = useState<Invite[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEntityType, setFilterEntityType] = useState('')

  const [isPending, startTransition] = useTransition()
  const [actioning, setActioning] = useState<{ token: string; type: 'activate' | 'deny' } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback((opts: { page: number; search: string; status: string; entityType: string }) => {
    setError(null)
    startTransition(async () => {
      const result = await listInvites({
        page: opts.page,
        limit: PAGE_SIZE,
        search:     opts.search     || undefined,
        status:     opts.status     || undefined,
        entityType: opts.entityType || undefined,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setInvites(result.data)
        setTotal(result.total)
      }
    })
  }, [])

  useEffect(() => {
    load({ page, search, status: filterStatus, entityType: filterEntityType })
  }, [load, page, search, filterStatus, filterEntityType])

  function handleFilterChange(key: 'search' | 'status' | 'entityType', value: string) {
    setPage(1)
    if (key === 'search')     setSearch(value)
    if (key === 'status')     setFilterStatus(value)
    if (key === 'entityType') setFilterEntityType(value)
  }

  async function handleAction(token: string, type: 'activate' | 'deny') {
    setActioning({ token, type })
    setActionError(null)
    const result = type === 'activate' ? await approveInvite(token) : await denyInvite(token)
    setActioning(null)
    if ('error' in result) {
      setActionError(result.error)
    } else {
      setInvites((prev) => prev.map((inv) => inv.token === token ? { ...inv, status: type === 'activate' ? 'approved' : 'denied' } : inv))
    }
  }

  function handleNewInviteSuccess() {
    setShowToast(true)
    setPage(1)
    load({ page: 1, search, status: filterStatus, entityType: filterEntityType })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-secondary mb-1">Practitioner Enrollment</p>
          <h1 className="font-serif text-3xl text-primary leading-tight">Invites</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-neutral text-xs uppercase tracking-widest px-5 h-10 rounded hover:opacity-90 transition-opacity font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Invite
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search name, email, entity…"
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="h-9 w-full rounded border border-secondary/25 bg-white pl-8 pr-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-9 rounded border border-secondary/25 bg-white pl-3 pr-8 text-sm text-primary outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className="relative">
          <select
            value={filterEntityType}
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
            className="h-9 rounded border border-secondary/25 bg-white pl-3 pr-8 text-sm text-primary outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Entity Types</option>
            {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5 text-sm text-rose-700">
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError(null)} className="shrink-0 hover:opacity-70 transition-opacity">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-secondary/15 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary/10">
              <th className="text-left text-[10px] uppercase tracking-widest text-secondary font-medium px-5 py-3">Contact</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-secondary font-medium px-5 py-3">Entity</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-secondary font-medium px-5 py-3">Type</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-secondary font-medium px-5 py-3">Status</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-secondary font-medium px-5 py-3">Expires</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-secondary font-medium px-5 py-3">Invited</th>
              <th className="text-left text-[10px] uppercase tracking-widest text-secondary font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-secondary">Loading…</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-tertiary">{error}</td>
              </tr>
            ) : invites.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-secondary">No invites found.</td>
              </tr>
            ) : invites.map((inv) => (
              <tr key={inv.id} className="border-b border-secondary/8 hover:bg-secondary/5 transition-colors">
                <td className="px-5 py-3.5">
                  {['completed', 'call_scheduled', 'approved'].includes(inv.status) ? (
                    <Link href={`/invite/${inv.token}`} className="block group">
                      <p className="font-medium text-primary group-hover:underline">{inv.ownerName}</p>
                      <p className="text-xs text-secondary mt-0.5">{inv.email}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="font-medium text-primary">{inv.ownerName}</p>
                      <p className="text-xs text-secondary mt-0.5">{inv.email}</p>
                    </>
                  )}
                </td>
                <td className="px-5 py-3.5 text-secondary">{inv.entityName}</td>
                <td className="px-5 py-3.5 text-secondary">{inv.entityType ?? '—'}</td>
                <td className="px-5 py-3.5">{statusBadge(inv.status)}</td>
                <td className="px-5 py-3.5 text-secondary">{fmtDate(inv.expiresAt)}</td>
                <td className="px-5 py-3.5 text-secondary">{fmtDate(inv.createdAt)}</td>
                <td className="px-5 py-3.5">
                  {['completed', 'call_scheduled'].includes(inv.status) ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(inv.token, 'activate')}
                        disabled={actioning?.token === inv.token}
                        className="flex items-center gap-1.5 px-3 h-7 rounded border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actioning?.token === inv.token && actioning.type === 'activate' ? '…' : 'Activate Portal'}
                      </button>
                      <button
                        onClick={() => handleAction(inv.token, 'deny')}
                        disabled={actioning?.token === inv.token}
                        className="flex items-center gap-1.5 px-3 h-7 rounded border border-rose-200 bg-rose-50 text-[11px] font-medium text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actioning?.token === inv.token && actioning.type === 'deny' ? '…' : 'Deny'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-secondary/40 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {!isPending && !error && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-secondary/10">
            <p className="text-xs text-secondary">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-secondary/20 text-secondary hover:text-primary hover:border-secondary/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-secondary/20 text-secondary hover:text-primary hover:border-secondary/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <NewInviteModal
          onClose={() => setShowModal(false)}
          onSuccess={handleNewInviteSuccess}
        />
      )}

      {showToast && <Toast onClose={() => setShowToast(false)} />}
    </>
  )
}
