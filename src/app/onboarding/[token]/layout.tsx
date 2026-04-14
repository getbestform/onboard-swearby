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

      <header className="relative z-10 px-8 md:px-12 py-8 md:py-10 mx-auto max-w-[1024px] w-full flex justify-center md:justify-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          id="onboarding-logo"
          src="/swearby-logo.svg"
          alt="Swearby"
          className="h-5 md:h-6 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </header>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      <footer className="hidden md:block relative z-10 px-8 md:px-12 pb-8 md:pb-10 mx-auto max-w-[1024px] w-full">
        <p id="onboarding-footer-text" className="text-[#a9cfb6]/40 text-xs">
          &copy; 2026 SwearbyHealth&trade;. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
