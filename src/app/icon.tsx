import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#7F77DD',
          borderRadius: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '-0.5px',
          fontFamily: 'sans-serif',
        }}
      >
        HT
      </div>
    ),
    { ...size }
  )
}
