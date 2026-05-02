'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  paid: 'Dibayar',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  expired: 'Expired',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
}

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  subtotal: number
  product_variants: {
    id: string
    name: string
    sku: string | null
    products: {
      id: string
      name: string
      images: string[] | null
    } | null
  } | null
}

interface ShippingAddress {
  recipient_name: string
  recipient_phone: string
  address_line1: string
  address_line2: string | null
  city: string
  province: string
  postal_code: string
}

interface Order {
  id: string
  status: string
  total_amount: number
  subtotal: number | null
  shipping_cost: number | null
  service_fee: number | null
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  tracking_number: string | null
  xendit_invoice_url: string | null
  profiles: {
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
  order_items: OrderItem[]
  shipping_addresses: ShippingAddress | null
}

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const orderId = params.id

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [updateMsg, setUpdateMsg] = useState('')

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true)
      try {
        const res = await fetch(`/api/sambers/orders/${orderId}`)
        const json = await res.json()
        if (json.data?.order) {
          setOrder(json.data.order)
          setTrackingNumber(json.data.order.tracking_number ?? '')
          setNewStatus('')
        } else {
          setError('Pesanan tidak ditemukan')
        }
      } catch {
        setError('Gagal memuat data pesanan')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  async function handleUpdateStatus() {
    if (!order) return
    setUpdating(true)
    setUpdateMsg('')
    try {
      const body: { status?: string; tracking_number?: string } = {}
      if (newStatus) body.status = newStatus
      if (trackingNumber !== (order.tracking_number ?? '')) body.tracking_number = trackingNumber

      const res = await fetch(`/api/sambers/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (res.ok && json.data?.order) {
        setOrder(prev => prev ? { ...prev, ...json.data.order } : prev)
        setUpdateMsg('✅ Status berhasil diperbarui')
        setNewStatus('')
      } else {
        setUpdateMsg(`❌ ${json.error ?? 'Gagal memperbarui'}`)
      }
    } catch {
      setUpdateMsg('❌ Terjadi kesalahan')
    } finally {
      setUpdating(false)
    }
  }

  async function handleMarkDelivered() {
    setUpdating(true)
    setUpdateMsg('')
    try {
      const res = await fetch(`/api/sambers/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      })
      const json = await res.json()
      if (res.ok && json.data?.order) {
        setOrder(prev => prev ? { ...prev, ...json.data.order } : prev)
        setUpdateMsg('✅ Pesanan ditandai selesai')
      } else {
        setUpdateMsg(`❌ ${json.error ?? 'Gagal memperbarui'}`)
      }
    } catch {
      setUpdateMsg('❌ Terjadi kesalahan')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </AdminShell>
    )
  }

  if (error || !order) {
    return (
      <AdminShell>
        <div className="p-6">
          <p className="text-red-600">{error || 'Pesanan tidak ditemukan'}</p>
          <button onClick={() => router.push('/sambers/orders')} className="mt-4 text-[#534AB7] hover:underline">
            ← Kembali ke daftar pesanan
          </button>
        </div>
      </AdminShell>
    )
  }

  const shortId = order.id.slice(0, 8).toUpperCase()

  return (
    <AdminShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/sambers/orders')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">
              Order <span className="font-mono text-[#534AB7]">#{shortId}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
              <span className="text-sm text-slate-400">{formatDate(order.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Customer */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Info Customer</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-500 w-20 shrink-0">Nama</dt>
                <dd className="text-slate-900 font-medium">{order.profiles?.full_name ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500 w-20 shrink-0">Email</dt>
                <dd className="text-slate-900">{order.profiles?.email ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500 w-20 shrink-0">Telepon</dt>
                <dd className="text-slate-900">{order.profiles?.phone ?? '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Alamat Pengiriman */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Alamat Pengiriman</h2>
            {order.shipping_addresses ? (
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Penerima</dt>
                  <dd className="text-slate-900 font-medium">{order.shipping_addresses.recipient_name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Telepon</dt>
                  <dd className="text-slate-900">{order.shipping_addresses.recipient_phone}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Alamat</dt>
                  <dd className="text-slate-900">
                    {order.shipping_addresses.address_line1}
                    {order.shipping_addresses.address_line2 && `, ${order.shipping_addresses.address_line2}`}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Kota</dt>
                  <dd className="text-slate-900">{order.shipping_addresses.city}, {order.shipping_addresses.province} {order.shipping_addresses.postal_code}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-400">Data alamat tidak tersedia</p>
            )}
          </div>
        </div>

        {/* Item Pesanan */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Item Pesanan</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-slate-600">Produk</th>
                <th className="px-5 py-3 text-center font-medium text-slate-600">Qty</th>
                <th className="px-5 py-3 text-right font-medium text-slate-600">Harga</th>
                <th className="px-5 py-3 text-right font-medium text-slate-600">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.order_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{item.product_variants?.products?.name ?? '—'}</div>
                    <div className="text-xs text-slate-400">{item.product_variants?.name ?? ''}</div>
                  </td>
                  <td className="px-5 py-3 text-center text-slate-700">{item.quantity}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatRp(item.price)}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">{formatRp(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rincian Pembayaran */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Rincian Pembayaran</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="text-slate-900">{formatRp(order.subtotal ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Ongkir</dt>
              <dd className="text-slate-900">{formatRp(order.shipping_cost ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Biaya Layanan</dt>
              <dd className="text-slate-900">{formatRp(order.service_fee ?? 0)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="font-semibold text-[#534AB7] text-base">{formatRp(order.total_amount)}</dd>
            </div>
          </dl>
          {order.xendit_invoice_url && (
            <a
              href={order.xendit_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-[#534AB7] hover:underline"
            >
              Lihat Invoice Xendit →
            </a>
          )}
        </div>

        {/* Status & Aksi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Status & Aksi</h2>

          {/* Timestamps */}
          <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
            <div>
              <div className="text-slate-400 text-xs mb-1">Dibuat</div>
              <div className="text-slate-700">{formatDate(order.created_at)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">Dibayar</div>
              <div className="text-slate-700">{formatDate(order.paid_at)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">Dikirim</div>
              <div className="text-slate-700">{formatDate(order.shipped_at)}</div>
            </div>
          </div>

          {/* Action area */}
          {order.status === 'paid' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]"
                >
                  <option value="">-- Pilih status baru --</option>
                  <option value="shipped">Dikirim (shipped)</option>
                  <option value="delivered">Selesai (delivered)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Resi</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Masukkan nomor resi pengiriman"
                  className="w-full max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#534AB7]"
                />
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || !newStatus}
                className="px-5 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium hover:bg-[#4238a0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Menyimpan...' : 'Update Status'}
              </button>
            </div>
          )}

          {order.status === 'shipped' && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-slate-500">Nomor Resi: </span>
                <span className="font-medium text-slate-900">{order.tracking_number ?? '—'}</span>
              </div>
              <button
                onClick={handleMarkDelivered}
                disabled={updating}
                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {updating ? 'Menyimpan...' : '✓ Tandai Selesai'}
              </button>
            </div>
          )}

          {['delivered', 'cancelled', 'expired', 'failed'].includes(order.status) && (
            <div className="text-sm text-slate-500">
              Pesanan ini sudah berstatus <strong>{STATUS_LABEL[order.status]}</strong>. Tidak ada aksi yang tersedia.
            </div>
          )}

          {updateMsg && (
            <div className="mt-3 text-sm font-medium">{updateMsg}</div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
