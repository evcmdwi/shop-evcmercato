'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface OrderSummary {
  id: string
  status: string
  total_amount: number
  items: {
    id: string
    product_name: string
    variant_name?: string
    quantity: number
    subtotal: number
  }[]
}

const statusBadge: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Lunas', className: 'bg-green-100 text-green-800' },
}

export default function OrderSuksesPage() {
  const params = useParams()
  const id = params?.id as string

  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [pollExhausted, setPollExhausted] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  const fetchOrder = useCallback(async (): Promise<OrderSummary | null> => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) {
        const { data } = await res.json()
        setOrder(data)
        return data as OrderSummary
      }
    } finally {
      setLoading(false)
    }
    return null
  }, [id])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    fetchOrder().then((data) => {
      if (data?.status === 'pending') {
        setPolling(true)
        let attempts = 0
        interval = setInterval(async () => {
          attempts++
          const updated = await fetchOrder()
          if (updated?.status !== 'pending' || attempts >= 10) {
            if (interval) clearInterval(interval)
            setPolling(false)
            if (attempts >= 10 && updated?.status === 'pending') {
              setPollExhausted(true)
            }
          }
        }, 3000)
      }
    })

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchOrder])

  const badge = order ? (statusBadge[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-700' }) : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-[#1D9E75]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">🎉 Pesanan Berhasil Dibuat!</h1>

        {loading ? (
          <div className="animate-pulse space-y-3 mt-4">
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
        ) : order ? (
          <>
            <p className="text-sm text-gray-500 mb-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-2xl font-bold mb-3" style={{ color: '#7FB300' }}>
              {formatRupiah(order.total_amount)}
            </p>

            {badge && (
              <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${badge.className}`}>
                {badge.label}
              </span>
            )}

            {polling && order?.status === 'pending' && (
              <div className="text-center text-sm text-gray-500 mb-4">
                <span className="animate-pulse">⏳ Menunggu konfirmasi pembayaran...</span>
              </div>
            )}

            {pollExhausted && order?.status === 'pending' && (
              <div className="text-center text-sm text-amber-600 mb-4">
                Coba refresh halaman jika status belum berubah.
              </div>
            )}

            {/* Items ringkas */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-2">
              {order.items?.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 flex-1 truncate">
                    {item.product_name}{item.variant_name ? ` · ${item.variant_name}` : ''} ×{item.quantity}
                  </span>
                  <span className="font-medium ml-2">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
              {(order.items?.length ?? 0) > 3 && (
                <p className="text-xs text-gray-400 text-center">+{order.items.length - 3} item lainnya</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 my-4">Pesanan berhasil dibuat.</p>
        )}

        {/* Email spam notice */}
        <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mt-4">
          <span className="text-base flex-shrink-0">📧</span>
          <p>
            Email konfirmasi sudah dikirim ke <strong>{userEmail || 'email kamu'}</strong>.
            Periksa folder <strong>Spam</strong> jika belum ada di Inbox utama.
          </p>
        </div>

        <div className="space-y-3 mt-4">
          <Link
            href={`/orders/${id}`}
            className="block w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: '#7FB300' }}
          >
            Lihat Detail Pesanan
          </Link>
          <Link
            href="/katalog"
            className="block w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Belanja Lagi
          </Link>
        </div>
      </div>
    </div>
  )
}
