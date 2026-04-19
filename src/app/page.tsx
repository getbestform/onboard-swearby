import Link from 'next/link'

const steps = [
  {
    number: '01',
    title: 'Access Code',
    body: 'Enter your 6-digit onboarding code from your invite email to begin.',
  },
  {
    number: '02',
    title: 'Clinic Details',
    body: 'Provide your clinic information, NPI, DEA credentials, and state licenses.',
  },
  {
    number: '03',
    title: 'Agreements & Deposit',
    body: 'Sign the MSA and BAA via DocuSign, then submit the onboarding deposit.',
  },
  {
    number: '04',
    title: 'Platform Setup',
    body: 'Configure your formulary, add prescribers, and customize your clinic branding.',
  },
]

const pillars = [
  {
    label: 'HIPAA Compliant',
    body: 'End-to-end encryption, BAA execution, and role-based access controls built into every layer.',
  },
  {
    label: 'Credential Verification',
    body: 'Automated NPI and DEA validation with state license tracking for all prescribers.',
  },
  {
    label: 'DoseSpot Integration',
    body: 'Full e-prescribing with Surescripts certification — scripts sent directly to patient pharmacies.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text-primary">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-bg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-text-primary">swearby</span>
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-text-primary border border-primary/30 rounded px-4 h-9 hover:bg-primary hover:text-cream transition-all"
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
        <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-5">Clinic Onboarding Portal</p>
        <h1 className="font-display text-5xl md:text-7xl text-text-primary leading-[1.05] max-w-3xl mb-8">
          Get your clinic<br />
          <span className="text-text-secondary">set up on SwearBy.</span>
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed max-w-xl mb-12">
          This portal guides you through the onboarding process — from credentials and agreements to formulary setup and platform access. Use the access code from your invite email to get started.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-primary text-neutral text-xs uppercase tracking-widest font-semibold px-7 h-12 rounded hover:opacity-90 transition-opacity"
          >
            Start Onboarding
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <span className="text-xs text-text-muted/60 uppercase tracking-widest">Access code required</span>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* Onboarding Steps */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-3">Onboarding Process</p>
        <h2 className="font-display text-3xl text-text-primary mb-14">What to expect.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.number}>
              <span className="font-display text-4xl text-text-muted/20 block mb-5">{s.number}</span>
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">{s.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* Pillars */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-3">Platform Features</p>
        <h2 className="font-display text-3xl text-text-primary mb-14">What you get.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {pillars.map((p) => (
            <div key={p.label} className="bg-bg-card rounded-lg p-8 border border-border">
              <div className="w-8 h-0.5 bg-primary mb-6" />
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">{p.label}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-primary rounded-lg px-10 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">Already onboarded?</p>
            <h2 className="font-display text-3xl text-white leading-tight">Sign in to your clinic dashboard.</h2>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-bg text-primary text-xs uppercase tracking-widest font-semibold px-7 h-12 rounded hover:opacity-90 transition-opacity shrink-0"
          >
            Sign in
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-text-muted text-sm">swearby</span>
          <div className="flex gap-8">
            {['Privacy Policy', 'Terms of Service'].map((item) => (
              <span key={item} className="text-[10px] uppercase tracking-widest text-text-muted/50">{item}</span>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-text-muted/40">© 2026 SwearBy. HIPAA Compliant.</span>
        </div>
      </footer>

    </div>
  )
}
