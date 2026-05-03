'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Check } from 'lucide-react'

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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface OrderItem {
  id: string
  product_name: string
  variant_name?: string
  quantity: number
  price: number
}

interface OrderDetail {
  id: string
  status: string
  total_amount: number
  subtotal: number
  shipping_cost: number
  shipping_cost_discount: number
  service_fee: number
  service_fee_discount: number
  points_earned: number
  created_at: string
  xendit_invoice_url?: string
  tracking_number?: string
  delivery_note?: string | null
  // flat shipping fields from API
  shipping_recipient_name: string
  shipping_phone: string
  shipping_full_address: string
  shipping_city: string
  shipping_province: string
  shipping_postal_code: string
  order_items: OrderItem[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Dibayar', className: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Diproses', className: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Dikirim', className: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Diterima', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800' },
}

const timelineSteps = [
  { key: 'created', label: 'Pesanan Dibuat' },
  { key: 'paid', label: 'Pembayaran' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'delivered', label: 'Diterima' },
]

const statusOrder: Record<string, number> = {
  pending: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/orders/${id}`)
    if (res.status === 401) {
      router.push('/login?redirect_to=/orders')
      return
    }
    if (res.status === 404 || !res.ok) {
      router.push('/orders')
      return
    }
    const { data } = await res.json()
    setOrder(data)
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleCopyTracking = () => {
    if (!order?.tracking_number) return
    navigator.clipboard.writeText(order.tracking_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat detail pesanan...</div>
      </div>
    )
  }

  if (!order) return null

  const status = statusConfig[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-700' }
  const currentStep = statusOrder[order.status] ?? 0
  const evcPoints = order.points_earned ?? Math.floor((order.subtotal ?? 0) / 1000)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/orders')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Detail Pesanan</h1>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Order #{order.id.slice(0, 8).toUpperCase()} · {formatTanggal(order.created_at)}
            </p>

            {/* Timeline */}
            {order.status !== 'cancelled' && (
              <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
                {timelineSteps.map((step, idx) => {
                  const done = idx <= currentStep
                  const active = idx === currentStep
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                            done
                              ? 'bg-[#7FB300] border-[#7FB300] text-white'
                              : 'bg-white border-gray-300 text-gray-400'
                          } ${active ? 'ring-2 ring-[#E8F4D1]' : ''}`}
                        >
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] text-center mt-1 leading-tight ${done ? 'text-[#7FB300] font-medium' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div className={`h-0.5 w-6 mx-0.5 flex-shrink-0 ${idx < currentStep ? 'bg-[#7FB300]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pesan untuk Kurir */}
          {order.delivery_note && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Pesan untuk Kurir</p>
              <p className="text-sm text-gray-800">{order.delivery_note}</p>
            </div>
          )}

          {/* Alamat Pengiriman */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Alamat Pengiriman</h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-900">{order.shipping_recipient_name || '-'}</p>
              <p>{order.shipping_phone || '-'}</p>
              <p>{order.shipping_full_address || '-'}</p>
              <p>
                {[order.shipping_city, order.shipping_province, order.shipping_postal_code]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
            </div>
          </div>

          {/* Item Pesanan */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Item Pesanan</h2>
            <div className="space-y-3">
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                      <p className="text-xs text-gray-400">
                        {item.quantity} × {formatRupiah(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-4">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Tidak ada item</p>
              )}
            </div>
          </div>

          {/* Rincian Pembayaran */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Rincian Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatRupiah(order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ongkos Kirim</span>
                <span>{formatRupiah((order.shipping_cost ?? 0) - (order.shipping_cost_discount ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Layanan</span>
                <span>{formatRupiah(order.service_fee ?? 0)}</span>
              </div>
              {(order.service_fee_discount ?? 0) > 0 && (
                <div className="flex justify-between text-[#1D9E75]">
                  <span>Promo</span>
                  <span>-{formatRupiah(order.service_fee_discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
                <span>Total Bayar</span>
                <span style={{ color: '#7FB300' }}>{formatRupiah(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* EVC Points */}
          {evcPoints > 0 && (
            <div className="bg-[#E8F4D1] rounded-2xl p-4 text-sm text-center text-[#7FB300]">
              ℹ️ Kamu akan mendapat <strong>{evcPoints} EVC Points</strong> dari pesanan ini
              <br />
              <span className="text-xs text-gray-500">(dicatat setelah barang diterima)</span>
            </div>
          )}

          {/* Aksi Conditional */}
          {order.status === 'pending' && order.xendit_invoice_url && (
            <a
              href={order.xendit_invoice_url}
              className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center"
              style={{ backgroundColor: '#7FB300' }}
            >
              Bayar Sekarang
            </a>
          )}

          {order.status === 'shipped' && order.tracking_number && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-2">Nomor Resi</h2>
              <div className="flex items-center gap-3">
                <span className="flex-1 font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  {order.tracking_number}
                </span>
                <button
                  onClick={handleCopyTracking}
                  className="p-2 rounded-xl bg-[#E8F4D1] text-[#7FB300] hover:opacity-80 transition-opacity"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* CTA Navigasi */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link
              href="/katalog"
              className="flex-1 flex items-center justify-center gap-2 bg-[#7FB300] text-white py-3 rounded-xl font-semibold hover:bg-[#4338a0]"
            >
              🛍️ Lanjut Belanja
            </Link>
            <a
              href={`https://wa.me/6285820852908?text=Halo%20admin%2C%20saya%20mau%20tanya%20order%20${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-green-500 text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50"
            >
              💬 Hubungi Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
