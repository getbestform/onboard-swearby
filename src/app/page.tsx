import Link from 'next/link'

/** Production clinic app — partner dashboard sign-in. */
const CLINIC_DASHBOARD_LOGIN = 'https://app.swearbyhealth.com/login'

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
    body: 'Full e-prescribing with Surescripts certification, scripts sent directly to pharmacies.',
  },
]

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-forest-dark via-forest to-forest-dark font-sans text-cream antialiased">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(189,167,99,0.12),transparent_55%)]"
        aria-hidden
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gold/20 bg-forest/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-cream tracking-tight">swearby</span>
          <Link
            href={CLINIC_DASHBOARD_LOGIN}
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-cream border border-gold/40 rounded px-4 h-9 hover:bg-gold/15 hover:border-gold/60 transition-all"
          >
            Partner Login
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="relative">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-5">Clinic Onboarding Portal</p>
          <h1 className="font-display text-5xl md:text-7xl text-cream leading-[1.05] max-w-3xl mb-8">
            Get your clinic<br />
            <span className="text-gold">set up on swearby.</span>
          </h1>
          <p className="text-cream/75 text-lg leading-relaxed max-w-xl mb-12">
            This portal guides you through the onboarding process — from credentials and agreements to formulary setup and platform access. Use the access code from your invite email to get started.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 bg-gold text-forest text-xs uppercase tracking-widest font-semibold px-7 h-12 rounded hover:bg-gold/90 transition-colors"
            >
              Start Onboarding
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <span className="text-xs text-gold/80 uppercase tracking-widest">Access code required</span>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-gold/20" />
        </div>

        {/* Onboarding Steps */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-3">Onboarding Process</p>
          <h2 className="font-display text-3xl text-cream mb-14">What to expect.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.number}>
                <span className="font-display text-4xl text-gold/25 block mb-5">{s.number}</span>
                <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">{s.title}</h3>
                <p className="text-sm text-cream/70 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-px bg-gold/20" />
        </div>

        {/* Pillars */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-3">Platform Features</p>
          <h2 className="font-display text-3xl text-cream mb-14">What you get.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {pillars.map((p) => (
              <div
                key={p.label}
                className="rounded-lg border border-gold/20 bg-forest-light/25 backdrop-blur-sm p-8 shadow-[inset_0_1px_0_0_rgba(189,167,99,0.08)]"
              >
                <div className="w-8 h-0.5 bg-gold mb-6" />
                <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">{p.label}</h3>
                <p className="text-sm text-cream/70 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="rounded-lg border border-gold/25 bg-forest-light/20 backdrop-blur-sm px-10 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8 shadow-[inset_0_1px_0_0_rgba(189,167,99,0.1)]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80 mb-3">Already onboarded?</p>
              <h2 className="font-display text-3xl text-cream leading-tight">Sign in to your clinic dashboard.</h2>
            </div>
            <Link
              href={CLINIC_DASHBOARD_LOGIN}
              className="inline-flex items-center gap-3 bg-gold text-forest text-xs uppercase tracking-widest font-semibold px-7 h-12 rounded hover:bg-gold/90 transition-colors shrink-0"
            >
              Partner Login
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gold/20">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-display font-bold text-cream/80 text-sm">swearby</span>
            <div className="flex gap-8">
              {['Privacy Policy', 'Terms of Service'].map((item) => (
                <span
                  key={item}
                  className="text-[10px] uppercase tracking-widest text-cream/70 underline underline-offset-4 decoration-gold/50"
                >
                  {item}
                </span>
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-cream/45">© 2026 SwearBy. HIPAA Compliant.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
