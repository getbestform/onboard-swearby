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
    label: 'Invite',
    href: '/invite',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" fill={active ? '#1A3C2A' : 'none'} stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={active ? '#FEF9F1' : '#6C7B70'} strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    label: 'Access',
    href: '/access',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" fill={active ? '#1A3C2A' : 'none'} />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    label: 'Payment',
    href: '/payment',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" fill={active ? '#1A3C2A' : 'none'} />
        <path d="M2 10h20" stroke={active ? '#FEF9F1' : '#6C7B70'} />
      </svg>
    ),
  },
  {
    label: 'Agreements',
    href: '/agreements',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill={active ? '#1A3C2A' : 'none'} />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={active ? '#FEF9F1' : '#6C7B70'} />
      </svg>
    ),
  },
  {
    label: 'Drug Catalog',
    href: '/drug-catalog',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" fill={active ? '#1A3C2A' : 'none'} />
        <path d="M12 8v8M8 12h8" stroke={active ? '#FEF9F1' : '#6C7B70'} />
      </svg>
    ),
  },
  {
    label: 'Intake',
    href: '/intake',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" fill={active ? '#1A3C2A' : 'none'} />
        <rect x="8" y="2" width="8" height="4" rx="1" fill={active ? '#1A3C2A' : 'none'} stroke={active ? '#1A3C2A' : '#6C7B70'} />
        <path d="M9 12h6M9 16h4" stroke={active ? '#FEF9F1' : '#6C7B70'} />
      </svg>
    ),
  },
  {
    label: 'Schedule',
    href: '/schedule',
    icon: ({ active }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#1A3C2A' : '#6C7B70'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" fill={active ? '#1A3C2A' : 'none'} />
        <path d="M16 2v4M8 2v4M3 10h18" stroke={active ? '#FEF9F1' : '#6C7B70'} />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 flex flex-col bg-neutral min-h-screen border-r border-secondary/10">
      <div className="px-5 pt-7 pb-8">
        <p className="font-serif text-primary text-xl leading-tight">SwearBy Clinical</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-secondary mt-1">Onboarding Portal</p>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
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

      <div className="px-5 py-5 border-t border-secondary/10">
        <form action={logout}>
          <button type="submit" className="flex items-center gap-2.5 w-full text-left">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-neutral text-xs font-semibold shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-xs text-primary font-medium leading-tight">Admin Portal</p>
              <p className="text-[10px] text-secondary leading-tight mt-0.5">v2.4.0 Clinical</p>
            </div>
          </button>
        </form>
      </div>
    </aside>
  )
}
