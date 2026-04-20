import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/**
 * Fetches the DM Serif Display regular font so the favicon can render in the
 * brand font. Satori (powering ImageResponse) only supports TTF / OTF / WOFF —
 * NOT WOFF2 — so we send an old-browser UA that causes Google Fonts to respond
 * with a TTF URL instead of the modern WOFF2 default.
 */
async function loadDmSerifDisplay(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
        },
      },
    ).then((r) => r.text())

    const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)
    if (!match) return null

    return await fetch(match[1]).then((r) => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Icon() {
  const fontData = await loadDmSerifDisplay()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#263C30',
          color: '#F5F1E8',
          fontFamily: fontData ? 'DM Serif Display' : 'serif',
          fontSize: 48,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        S
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: 'DM Serif Display', data: fontData, weight: 400, style: 'normal' }]
        : undefined,
    },
  )
}
