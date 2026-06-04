import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'

export async function GET() {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: '#ede9ff',
          borderRadius: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', width: 280, height: 260, display: 'flex' }}>
          <div style={{ position: 'absolute', left: 20, top: 80, width: 160, height: 90, background: '#7F77DD', borderRadius: 16 }} />
          <div style={{ position: 'absolute', left: 180, top: 50, width: 80, height: 120, background: '#5c55b8', borderRadius: 16 }} />
          <div style={{ position: 'absolute', left: 192, top: 66, width: 46, height: 40, background: '#c4bfff', borderRadius: 8 }} />
          <div style={{ position: 'absolute', left: 56, top: 38, width: 28, height: 44, background: '#7F77DD', borderRadius: 8 }} />
          <div style={{ position: 'absolute', left: 0, top: 206, width: 280, height: 14, background: '#7F77DD', borderRadius: 8 }} />
          <div style={{ position: 'absolute', left: 38, top: 164, width: 52, height: 52, background: '#5c55b8', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', left: 170, top: 164, width: 52, height: 52, background: '#5c55b8', borderRadius: '50%' }} />
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  )

  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new NextResponse(response.body, { status: response.status, headers })
}
