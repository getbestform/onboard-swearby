import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Invite & Verification',
    body: 'Receive your exclusive invite link and confirm your identity with a one-time access code.',
  },
  {
    number: '02',
    title: 'Deposit & Agreements',
    body: 'Secure your founding partner position with a $2,500 deposit and sign the MSA, BAA, and marketing agreements via DocuSign.',
  },
  {
    number: '03',
    title: 'Configuration',
    body: 'Set up your drug catalog, prescriber credentials, clinic branding, and schedule your onboarding call.',
  },
  {
    number: '04',
    title: 'Platform Access',
    body: 'Upon manual approval after your onboarding call, receive full access to the SwearBy EMR platform.',
  },
]

const pillars = [
  {
    label: 'Invite-Only Access',
    body: 'Every partner clinic is personally vetted and invited by the SwearBy clinical team before onboarding begins.',
  },
  {
    label: 'HIPAA Compliant',
    body: 'AES-256 encrypted data handling, BAA execution, and PCI-compliant payment processing via Stripe.',
  },
  {
    label: 'Clinical Precision',
    body: 'Built for practitioners — DEA verification, state-specific formulary setup, and credentialed prescriber management.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral font-sans text-primary">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-neutral border-b border-secondary/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-widest text-primary">SWEARBY CLINICAL</span>
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-primary border border-primary/30 rounded px-4 h-9 hover:bg-primary hover:text-neutral transition-all"
          >
            Partner Login
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <p className="text-[10px] uppercase tracking-[0.2em] text-secondary mb-5">Invite-Only Partner Program</p>
        <h1 className="font-serif text-5xl md:text-7xl text-primary leading-[1.05] max-w-3xl mb-8">
          The Clinical Platform<br />
          <span className="italic text-secondary">Built for Founders.</span>
        </h1>
        <p className="text-secondary text-lg leading-relaxed max-w-xl mb-12">
          SwearBy Clinical is a precision EMR platform for independent practitioners. Onboarding is invite-only — each partner is personally vetted before access is granted.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-primary text-neutral text-xs uppercase tracking-widest font-semibold px-7 h-12 rounded hover:opacity-90 transition-opacity"
          >
            Access Portal
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <span className="text-xs text-secondary/60 uppercase tracking-widest">Invitation required</span>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-secondary/15" />
      </div>

      {/* Onboarding Steps */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-[10px] uppercase tracking-[0.2em] text-secondary mb-3">Onboarding Process</p>
        <h2 className="font-serif text-3xl text-primary mb-14">Four steps to full access.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.number}>
              <span className="font-serif text-4xl text-secondary/25 block mb-5">{s.number}</span>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{s.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-secondary/15" />
      </div>

      {/* Pillars */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-[10px] uppercase tracking-[0.2em] text-secondary mb-3">Platform Standards</p>
        <h2 className="font-serif text-3xl text-primary mb-14">Built on trust.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {pillars.map((p) => (
            <div key={p.label} className="bg-secondary/5 rounded-lg p-8">
              <div className="w-8 h-0.5 bg-primary mb-6" />
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{p.label}</h3>
              <p className="text-sm text-secondary leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-primary rounded-lg px-10 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral/50 mb-3">Already a partner?</p>
            <h2 className="font-serif text-3xl text-neutral leading-tight">Sign in to your portal.</h2>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-neutral text-primary text-xs uppercase tracking-widest font-semibold px-7 h-12 rounded hover:opacity-90 transition-opacity shrink-0"
          >
            Partner Login
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary/10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-serif font-bold tracking-widest text-secondary text-sm">SWEARBY CLINICAL</span>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service', 'Security Disclosure'].map((item) => (
              <span key={item} className="text-[10px] uppercase tracking-widest text-secondary/50">{item}</span>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-secondary/40">© 2024 SwearBy Clinical. HIPAA Compliant.</span>
        </div>
      </footer>

    </div>
  )
}
