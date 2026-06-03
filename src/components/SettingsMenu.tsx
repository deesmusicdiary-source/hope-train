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

type PushState = 'checking' | 'unsupported' | 'denied' | 'subscribed' | 'prompt' | 'subscribing'

function usePushState(volunteerId: string) {
  const [state, setState] = useState<PushState>('checking')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported'); return
    }
    if (Notification.permission === 'denied') { setState('denied'); return }
    navigator.serviceWorker.ready
      .then(r => r.pushManager.getSubscription())
      .then(sub => setState(sub ? 'subscribed' : 'prompt'))
      .catch(() => setState('prompt'))
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
    } catch { setState('prompt') }
  }

  return { state, subscribe }
}

type Props = {
  volunteerId: string
  volunteerName: string
  familyName: string
  trainName: string
}

export function SettingsMenu({ volunteerId, volunteerName, familyName, trainName }: Props) {
  const [open, setOpen] = useState(false)
  const { state: pushState, subscribe } = usePushState(volunteerId)

  return (
    <>
      {/* Clickable train logo + name */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 -ml-1 px-1 py-1 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="Account settings"
      >
        <div className="w-8 h-8 rounded-xl bg-[#ede9ff] flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#7F77DD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M2 20h20" />
            <circle cx="8" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
            <path d="M3 9h12v7h-12z" />
            <path d="M15 6h5v10h-5z" />
            <path d="M5 9v-3" />
            <path d="M4 6h2" />
            <path d="M16 8h3v3h-3z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-xs">
          {trainName}
        </span>
      </button>

      {/* Bottom sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-w-lg mx-auto overflow-y-auto max-h-[90dvh]">
            {/* Grip */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-5 pb-8 pt-2 space-y-6">
              {/* Identity */}
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-full bg-[#ede9ff] flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-[#5c55b8]">
                    {volunteerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{volunteerName}</p>
                  <p className="text-xs text-gray-400">Part of {familyName}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="ml-auto text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Install as app */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Install the app</p>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">📱 iPhone or iPad</p>
                    <ol className="space-y-1.5 text-xs text-gray-600 list-none">
                      <li className="flex gap-2"><span className="text-gray-400 shrink-0">1.</span><span>Open Hope Train in <span className="font-medium">Safari</span> (not Chrome)</span></li>
                      <li className="flex gap-2"><span className="text-gray-400 shrink-0">2.</span><span>Tap the <span className="font-medium">Share</span> button (the square with the arrow pointing up)</span></li>
                      <li className="flex gap-2"><span className="text-gray-400 shrink-0">3.</span><span>Tap <span className="font-medium">"Add to Home Screen"</span> and then Add</span></li>
                      <li className="flex gap-2"><span className="text-gray-400 shrink-0">4.</span><span>Open from your home screen to enable notifications (iOS 16.4+ required)</span></li>
                    </ol>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">🤖 Android</p>
                    <ol className="space-y-1.5 text-xs text-gray-600 list-none">
                      <li className="flex gap-2"><span className="text-gray-400 shrink-0">1.</span><span>Open Hope Train in <span className="font-medium">Chrome</span></span></li>
                      <li className="flex gap-2"><span className="text-gray-400 shrink-0">2.</span><span>Tap the <span className="font-medium">⋮</span> menu</span></li>
                      <li className="flex gap-2"><span className="text-gray-400 shrink-0">3.</span><span>Tap <span className="font-medium">"Add to Home Screen"</span> or <span className="font-medium">"Install app"</span></span></li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notifications</p>

                {pushState === 'subscribed' && (
                  <div className="flex items-center gap-3 bg-[#d1fae5] rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-[#1D9E75] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#1D9E75]">App notifications on</p>
                      <p className="text-xs text-[#1D9E75]/70 mt-0.5">You&apos;ll be notified instantly when the family sends a callout.</p>
                    </div>
                  </div>
                )}

                {(pushState === 'prompt' || pushState === 'subscribing') && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">App notifications off</p>
                      <p className="text-xs text-gray-500 mt-0.5">Get an instant alert when the family needs last-minute help.</p>
                      <button
                        onClick={subscribe}
                        disabled={pushState === 'subscribing'}
                        className="mt-2.5 text-xs font-medium bg-[#7F77DD] hover:bg-[#5c55b8] text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {pushState === 'subscribing' ? 'Enabling…' : 'Enable notifications'}
                      </button>
                    </div>
                  </div>
                )}

                {pushState === 'denied' && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-amber-800">Notifications blocked</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      To enable, go to your browser or phone settings and allow notifications for this site.
                    </p>
                  </div>
                )}

                {pushState === 'unsupported' && (
                  <p className="text-xs text-gray-400">
                    Push notifications aren&apos;t supported in this browser. Install the app to get notifications.
                  </p>
                )}

                {/* Email note */}
                <div className="flex items-start gap-2 mt-3">
                  <svg className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <p className="text-xs text-gray-400">Email notifications coming soon.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
