// Swearby sits in the centre (index 3). Competitors fill the surrounding 6 slots.
const LOGOS: { src: string; isSwearby?: boolean }[] = [
  { src: '/logo-1.png' },
  { src: '/logo-2.png' },
  { src: '/logo-3.png' },
  { src: '/swearby-logo.png', isSwearby: true },
  { src: '/logo-4.png' },
  { src: '/logo-5.png' },
  { src: '/logo-6.png' },
]

export function Phase4() {
  return (
    <div className="flex flex-col w-full">
      {/* Headline */}
      <h1
        className="font-sans font-bold leading-[1.06] tracking-tight"
        style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', color: '#1C1C1A' }}
      >
        Your software is<br />
        holding <span style={{ color: '#BDA763' }}>you back.</span>
      </h1>

      {/* Logo strip + lines section */}
      <div className="mt-10 w-full">

        {/* Logos row */}
        <div className="flex w-full">
          {LOGOS.map((logo, i) => (
            <div key={i} className="flex justify-center flex-1">
              <img
                src={logo.src}
                alt=""
                aria-hidden="true"
                className="object-contain"
                style={{
                  height: 96,
                  width: 'auto',
                  maxWidth: 28,
                  opacity: logo.isSwearby ? 1 : 0.5,
                }}
              />
            </div>
          ))}
        </div>

        {/* Lines + ONLINE BOOKING button overlaid within the lines */}
        <div className="relative w-full" style={{ height: 220 }}>

          {/* Vertical lines — run full height behind the button */}
          <div className="absolute inset-0 flex w-full">
            {LOGOS.map((logo, i) => (
              <div key={i} className="flex justify-center flex-1 h-full">
                <div
                  className="w-px h-full rounded-full"
                  style={{
                    background: logo.isSwearby
                      ? 'linear-gradient(to bottom, #BDA763, rgba(189,167,99,0.06))'
                      : 'linear-gradient(to bottom, rgba(53,51,49,0.18), rgba(53,51,49,0.03))',
                  }}
                />
              </div>
            ))}
          </div>

          {/* ONLINE BOOKING button — floats over the lines at ~55px from top */}
          <div className="absolute inset-x-0" style={{ top: 55 }}>
            <button
              type="button"
              className="w-full rounded-full border text-[10px] font-semibold uppercase py-[14px] transition-colors hover:bg-[#BDA763]/5"
              style={{
                borderColor: '#BDA763',
                color: '#353331',
                background: '#FBF7F2',
                letterSpacing: '0.22em',
              }}
            >
              Online Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
