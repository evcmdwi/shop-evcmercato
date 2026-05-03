'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  id: string
  message: string
  type?: ToastType
  action?: { label: string; href: string }
  duration?: number
}

interface ToastItemProps extends ToastProps {
  onDismiss: (id: string) => void
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-[#1D9E75] text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-[#7FB300] text-white',
}

function ToastItem({ id, message, type = 'info', action, duration = 3000, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-[240px] max-w-[320px] ${typeStyles[type]}`}
    >
      <span className="flex-1">{message}</span>
      {action && (
        <Link
          href={action.href}
          className="underline underline-offset-2 whitespace-nowrap opacity-90 hover:opacity-100"
        >
          {action.label}
        </Link>
      )}
      <button
        onClick={() => onDismiss(id)}
        className="ml-1 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="Tutup"
      >
        ×
      </button>
    </div>
  )
}

// ----- Global toast store (singleton) -----
type Listener = (toasts: ToastProps[]) => void
let toasts: ToastProps[] = []
const listeners: Set<Listener> = new Set()

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

export const toast = {
  show(props: Omit<ToastProps, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    toasts = [...toasts, { id, ...props }]
    notify()
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  },
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastProps[]>([])

  useEffect(() => {
    listeners.add(setItems)
    return () => { listeners.delete(setItems) }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
      {items.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={toast.dismiss} />
      ))}
    </div>
  )
}
