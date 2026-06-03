'use client'

import { useState, useEffect } from 'react'
import { saveSubscription } from '@/app/actions/pushActions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

type State = 'checking' | 'unsupported' | 'denied' | 'subscribed' | 'prompt' | 'subscribing'

export function PushSubscribe({ volunteerId }: { volunteerId: string }) {
  const [state, setState] = useState<State>('checking')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription()
    ).then(sub => {
      setState(sub ? 'subscribed' : 'prompt')
    }).catch(() => setState('prompt'))
  }, [])

  async function subscribe() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return
    setState('subscribing')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON()
      const { error } = await saveSubscription(volunteerId, {
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      })
      setState(error ? 'prompt' : 'subscribed')
    } catch {
      setState('prompt')
    }
  }

  if (state === 'checking' || state === 'unsupported') return null

  if (state === 'subscribed') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#d1fae5] rounded-xl w-fit">
        <svg className="w-3.5 h-3.5 text-[#1D9E75] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <span className="text-xs font-medium text-[#1D9E75]">Notifications on</span>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <p className="text-xs text-gray-400">
        Notifications blocked — enable them in your browser settings to get callout alerts.
      </p>
    )
  }

  // prompt or subscribing
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#ede9ff] flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-4.5 h-4.5 text-[#7F77DD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Get instant callout alerts</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
          When the family needs last-minute help, you&apos;ll get a notification straight to your phone.
        </p>
      </div>
      <button
        onClick={subscribe}
        disabled={state === 'subscribing'}
        className="shrink-0 text-xs font-medium bg-[#7F77DD] hover:bg-[#5c55b8] text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-60 self-center"
      >
        {state === 'subscribing' ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  )
}
