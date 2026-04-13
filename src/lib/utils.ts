// Lightweight class-name merger (no external deps required)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const inviteStatusClasses: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved:  'bg-blue-50 text-blue-700 border-blue-200',
  accepted:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  denied:    'bg-rose-50 text-rose-700 border-rose-200',
  expired:   'bg-red-50 text-red-600 border-red-200',
}

export function getInviteStatusClasses(status: string): string {
  return inviteStatusClasses[status] ?? 'bg-secondary/10 text-secondary border-secondary/20'
}

export function formatPhone(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export function formatEIN(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 9)
  return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d
}
