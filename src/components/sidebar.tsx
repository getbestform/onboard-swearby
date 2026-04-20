'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

interface IconProps {
  active: boolean
}

interface NavItem {
  label: string
  href: string
  icon: (props: IconProps) => React.ReactElement
}

const nav: NavItem[] = [
  {
    label: 'Invites',
    href: '/invite',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" fill={active ? '#1A3C2A' : 'none'} stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={active ? '#FEF9F1' : '#6C7B70'} strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 flex flex-col bg-neutral h-screen sticky top-0 border-r border-secondary/10">
      <div className="px-5 pt-7 pb-8">
        <p className="font-display text-primary text-xl leading-tight">SwearBy Clinical</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-secondary mt-1">Onboarding Portal</p>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-secondary hover:bg-white/70 hover:text-primary'
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-5 border-t border-secondary/10 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-neutral text-xs font-semibold shrink-0">
          A
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-primary font-medium leading-tight">Admin Portal</p>
          <p className="text-[10px] text-secondary leading-tight mt-0.5">v2.4.0 Clinical</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Sign out"
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  )
}
