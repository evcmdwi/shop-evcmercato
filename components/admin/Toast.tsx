'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = []
let currentToasts: ToastMessage[] = []

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).slice(2)
  currentToasts = [...currentToasts, { id, message, type }]
  toastListeners.forEach((l) => l(currentToasts))
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id)
    toastListeners.forEach((l) => l(currentToasts))
  }, 3500)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (t: ToastMessage[]) => setToasts([...t])
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            t.type === 'success'
              ? 'bg-[#1D9E75]'
              : t.type === 'error'
              ? 'bg-red-500'
              : 'bg-[#534AB7]'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
