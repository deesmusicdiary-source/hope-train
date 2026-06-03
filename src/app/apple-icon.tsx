import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#ede9ff',
          borderRadius: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Train icon drawn with CSS boxes */}
        <div style={{ position: 'relative', width: 100, height: 90, display: 'flex' }}>
          {/* Body */}
          <div style={{
            position: 'absolute', left: 8, top: 28, width: 56, height: 32,
            background: '#7F77DD', borderRadius: 6,
          }} />
          {/* Cab */}
          <div style={{
            position: 'absolute', left: 64, top: 18, width: 28, height: 42,
            background: '#5c55b8', borderRadius: 6,
          }} />
          {/* Window on cab */}
          <div style={{
            position: 'absolute', left: 68, top: 24, width: 16, height: 14,
            background: '#c4bfff', borderRadius: 3,
          }} />
          {/* Smokestack */}
          <div style={{
            position: 'absolute', left: 20, top: 14, width: 10, height: 16,
            background: '#7F77DD', borderRadius: 3,
          }} />
          {/* Rail */}
          <div style={{
            position: 'absolute', left: 0, top: 72, width: 100, height: 5,
            background: '#7F77DD', borderRadius: 3,
          }} />
          {/* Wheel left */}
          <div style={{
            position: 'absolute', left: 14, top: 58, width: 18, height: 18,
            background: '#5c55b8', borderRadius: '50%',
          }} />
          {/* Wheel right */}
          <div style={{
            position: 'absolute', left: 60, top: 58, width: 18, height: 18,
            background: '#5c55b8', borderRadius: '50%',
          }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
