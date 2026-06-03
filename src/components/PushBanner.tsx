'use client'

import { useState, useEffect } from 'react'
import { saveSubscription } from '@/app/actions/pushActions'

const DISMISS_KEY = 'ht-push-banner-dismissed'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

export function PushBanner({ volunteerId }: { volunteerId: string }) {
  const [visible, setVisible] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission === 'denied') return
    if (localStorage.getItem(DISMISS_KEY)) return
    navigator.serviceWorker.ready
      .then(r => r.pushManager.getSubscription())
      .then(sub => { if (!sub) setVisible(true) })
      .catch(() => {})
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function enable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { dismiss(); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON()
      await saveSubscription(volunteerId, {
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      })
      setDone(true)
      setTimeout(() => setVisible(false), 2000)
    } catch {
      setSubscribing(false)
    }
  }

  if (!visible) return null

  return (
    <div className="bg-[#ede9ff] border border-[#c4bfff] rounded-2xl px-4 py-3 flex items-center gap-3">
      <svg className="w-4 h-4 text-[#7F77DD] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>

      {done ? (
        <p className="flex-1 text-sm font-medium text-[#5c55b8]">Notifications enabled ✓</p>
      ) : (
        <>
          <p className="flex-1 text-sm text-[#5c55b8]">
            <span className="font-medium">Enable notifications</span>
            <span className="hidden sm:inline"> — get instant callout alerts on your phone</span>
          </p>
          <button
            onClick={enable}
            disabled={subscribing}
            className="shrink-0 text-xs font-medium bg-[#7F77DD] hover:bg-[#5c55b8] text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {subscribing ? 'Enabling…' : 'Enable'}
          </button>
        </>
      )}

      {!done && (
        <button onClick={dismiss} className="shrink-0 text-[#7F77DD]/60 hover:text-[#7F77DD] p-0.5" aria-label="Dismiss">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
