'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTransition } from 'react'
import { ShoppingBag } from 'lucide-react'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTanggal(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  item_count?: number
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Dibayar', className: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Diproses', className: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Dikirim', className: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Diterima', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
  expired: { label: 'Pesanan Kadaluarsa', className: 'bg-gray-100 text-gray-600' },
}

function OrderSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded-full w-24" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
      <div className="h-5 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleReorder = async (e: React.MouseEvent, orderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setReorderingId(orderId)
    try {
      const res = await fetch('/api/cart/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      if (res.ok) {
        startTransition(() => router.push('/keranjang'))
      } else {
        const json = await res.json()
        alert(json.error ?? 'Gagal menambahkan ke keranjang')
      }
    } catch {
      alert('Terjadi kesalahan. Coba lagi.')
    } finally {
      setReorderingId(null)
    }
  }

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders')
    if (res.status === 401) {
      router.push('/login?redirect_to=/orders')
      return
    }
    if (res.ok) {
      const { data } = await res.json()
      // Sort newest first
      const sorted = (data ?? []).sort(
        (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setOrders(sorted)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Pesanan Saya</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">Belum ada pesanan</p>
            <p className="text-sm text-gray-400 mb-4">Yuk, mulai belanja produk pilihan kamu!</p>
            <Link
              href="/katalog"
              className="inline-block px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: '#7FB300' }}
            >
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = statusConfig[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-700' }
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  prefetch={false}
                  className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{formatTanggal(order.created_at)}</p>
                  <p className="text-base font-bold" style={{ color: '#7FB300' }}>
                    {formatRupiah(order.total_amount)}
                  </p>
                  {order.status === 'expired' && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Pesanan ini kadaluarsa karena belum dibayar dalam 24 jam
                      </p>
                      <button
                        onClick={(e) => handleReorder(e, order.id)}
                        disabled={reorderingId === order.id}
                        className="mt-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E8F4D1] text-[#7FB300] hover:bg-[#d4ecaa] disabled:opacity-50 transition-colors"
                      >
                        {reorderingId === order.id ? 'Memproses...' : '🔄 Pesan Lagi'}
                      </button>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
