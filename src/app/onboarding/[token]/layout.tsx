function LeafTopLeft() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/wlc-leaf.svg"
      alt=""
      aria-hidden="true"
      className="absolute top-20 left-0 w-48 h-44 md:w-64 md:h-60 pointer-events-none select-none"
    />
  )
}

function LeafBottomRight() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/wlc-leaf-down.svg"
      alt=""
      aria-hidden="true"
      className="absolute bottom-20 right-0 w-44 h-44 md:w-60 md:h-60 pointer-events-none select-none"
    />
  )
}

export default function OnboardingTokenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="onboarding-root"
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: '#263C30' }}
    >
      <LeafTopLeft />
      <LeafBottomRight />

      {/* Fixed so it stays pinned at viewport top and doesn't eat any scroll
          distance — critical for the FeatureCascade, which measures scroll
          from its own section top and can't afford a header that consumes
          ~80 px of the scrollable range before the animation even starts.
          `backgroundColor: inherit` picks up the root's dynamic phase-bg
          (green → cream) so scrolled content doesn't show through. */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex"
        style={{ backgroundColor: 'inherit' }}
      >
        <div className="mx-auto max-w-[1200px] w-full px-8 md:px-5 py-8 md:py-10 flex justify-center md:justify-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="onboarding-logo"
            src="/swearby-logo.svg"
            alt="Swearby"
            className="h-5 md:h-6 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      <footer className="hidden md:block relative z-10 px-8 md:px-5 pb-8 md:pb-10 mx-auto max-w-[1200px] w-full">
        <p id="onboarding-footer-text" className="text-[#a9cfb6]/40 text-xs">
          &copy; 2026 SwearbyHealth&trade;. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
