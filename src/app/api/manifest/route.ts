import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    name: 'Hope Train',
    short_name: 'Hope Train',
    description: 'Community care coordination for families in crisis',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#7F77DD',
    orientation: 'portrait',
    icons: [
      {
        src: '/api/apple-icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
