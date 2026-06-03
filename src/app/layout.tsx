import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Hope Train',
  description: 'Community care coordination for families in crisis',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hope Train',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7F77DD',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>

      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
