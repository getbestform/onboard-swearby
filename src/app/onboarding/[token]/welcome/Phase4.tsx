// Swearby sits in the centre (index 3). Competitors fill the surrounding 6 slots.
const LOGOS: { src: string; isSwearby?: boolean }[] = [
  { src: '/vertical-logo-1.svg' },
  { src: '/vertical-logo-2.svg' },
  { src: '/vertical-logo-3.svg' },
  { src: '/vertical-logo-4.svg', isSwearby: true },
  { src: '/vertical-logo-5.svg' },
  { src: '/vertical-logo-6.svg' },
  { src: '/vertical-logo-7.svg' },
]

export function Phase4() {
  return (
    <div className="flex flex-col w-full h-full">
      {/* Headline */}
      <h1
        className="font-sans text-center align-middle"
        style={{
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 500,
          fontSize: '40px',
          lineHeight: '120%',
          color: '#1C1C1A',
        }}
      >
        Your software is<br />
        holding you back.
      </h1>

      {/* Logo strip + lines section */}
      <div className="mt-28 w-full">

        {/* Logos row */}
        <div className="flex w-full mb-4">
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
        <div className="relative w-full" style={{ height: 300 }}>

          {/* Vertical lines — run full height behind the button */}
          <div className="absolute inset-0 flex w-full">
            {LOGOS.map((logo, i) => (
              <div key={i} className="flex justify-center flex-1 h-full">
                <div
                  className="w-[2px] rounded-full"
                  style={{
                    height: `${Math.max(80, 100 - Math.abs(i - (LOGOS.length - 1) / 2) * 12)}%`,
                    background: logo.isSwearby
                      ? 'linear-gradient(to bottom, #BDA763, rgba(189,167,99,0.06))'
                      : 'linear-gradient(to bottom, rgba(53,51,49,0.18), rgba(53,51,49,0.03))',
                  }}
                />
              </div>
            ))}
          </div>

          {/* ONLINE BOOKING button — floats over the lines at ~100px from top */}
          <div className="absolute inset-x-0" style={{ top: 100 }}>
            <button
              type="button"
              className="w-full rounded-full border-[2px] text-[10px] font-semibold uppercase py-[14px] transition-colors hover:bg-[#BDA763]/5"
              style={{
                borderColor: 'rgba(189, 167, 99, 1)',
                color: 'rgba(189, 167, 99, 1)',
                background: 'rgba(255, 255, 255, 1)',
                letterSpacing: '5px',
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
