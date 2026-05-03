'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

// ─── Status config ──────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
  paid:      { label: 'Lunas',              color: 'bg-blue-100 text-blue-800' },
  processed: { label: 'Diproses',           color: 'bg-orange-100 text-orange-800' },
  shipped:   { label: 'Dikirim',            color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Selesai',            color: 'bg-green-100 text-green-800' },
  expired:   { label: 'Kedaluwarsa',        color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Dibatalkan',         color: 'bg-red-100 text-red-800' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  product_name?: string | null
  variant_name?: string | null
  id: string
  quantity: number
  price: number
  subtotal: number
  product_variants: {
    id: string
    name: string
    sku: string | null
    products: { id: string; name: string; images: string[] | null } | null
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
  processed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  tracking_number: string | null
  shipping_courier: string | null
  delivered_note: string | null
  xendit_invoice_url: string | null
  shipping_recipient_name: string | null
  shipping_phone: string | null
  shipping_full_address: string | null
  shipping_city: string | null
  shipping_province: string | null
  shipping_postal_code: string | null
  customer_name?: string
  customer_email?: string
  user?: { name: string | null; email: string | null; phone: string | null } | null
  profiles?: { full_name: string | null; email: string | null; phone: string | null } | null
  shipping_addresses?: ShippingAddress | null
  order_items?: OrderItem[]
}

// ─── InputResiModal ───────────────────────────────────────────────────────────

interface InputResiModalProps {
  orderId: string
  onClose: () => void
  onSuccess: (updatedOrder: Partial<Order>) => void
}

function InputResiModal({ orderId, onClose, onSuccess }: InputResiModalProps) {
  const [courier, setCourier] = useState('JNE')
  const [resi, setResi] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resi.trim()) { setError('Nomor resi wajib diisi'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/sambers/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped', shipping_courier: courier, tracking_number: resi.trim() }),
      })
      const json = await res.json()
      if (res.ok && json.data?.order) {
        onSuccess(json.data.order)
      } else {
        setError(json.error ?? 'Gagal memperbarui status')
      }
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Input Resi &amp; Kirim</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ekspedisi</label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            >
              {['JNE', 'JNT'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Resi <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={resi}
              onChange={(e) => setResi(e.target.value)}
              placeholder="Contoh: JNE1234567890"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : '🚚 Kirim Pesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MarkDeliveredModal ───────────────────────────────────────────────────────

interface MarkDeliveredModalProps {
  orderId: string
  onClose: () => void
  onSuccess: (updatedOrder: Partial<Order>) => void
}

function MarkDeliveredModal({ orderId, onClose, onSuccess }: MarkDeliveredModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: Record<string, string> = { status: 'delivered' }
      if (note.trim()) body.delivered_note = note.trim()
      const res = await fetch(`/api/sambers/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (res.ok && json.data?.order) {
        onSuccess(json.data.order)
      } else {
        setError(json.error ?? 'Gagal memperbarui status')
      }
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Tandai Sudah Diterima</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Diterima oleh..."
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : '✅ Konfirmasi Diterima'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── OrderActions ─────────────────────────────────────────────────────────────

interface OrderActionsProps {
  order: Order
  onOrderUpdate: (updated: Partial<Order>) => void
}

function OrderActions({ order, onOrderUpdate }: OrderActionsProps) {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showInputResi, setShowInputResi] = useState(false)
  const [showMarkDelivered, setShowMarkDelivered] = useState(false)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleStartProcess() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sambers/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processed' }),
      })
      const json = await res.json()
      if (res.ok && json.data?.order) {
        onOrderUpdate(json.data.order)
        showToast('✅ Status berhasil diperbarui ke Diproses', true)
      } else {
        showToast(`❌ ${json.error ?? 'Gagal memperbarui'}`, false)
      }
    } catch {
      showToast('❌ Terjadi kesalahan jaringan', false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Aksi Pesanan</h2>

      {/* PAID → tombol Mulai Proses */}
      {order.status === 'paid' && (
        <button
          onClick={handleStartProcess}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳ Memproses...' : '▶ Mulai Proses'}
        </button>
      )}

      {/* PROCESSED → tombol Input Resi */}
      {order.status === 'processed' && (
        <button
          onClick={() => setShowInputResi(true)}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
        >
          🚚 Input Resi &amp; Kirim
        </button>
      )}

      {/* SHIPPED → resi info + Tandai Diterima */}
      {order.status === 'shipped' && (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm">
            <span className="text-slate-500">Resi: </span>
            <span className="font-semibold text-purple-800">
              {order.shipping_courier} {order.tracking_number ?? '—'}
            </span>
          </div>
          <button
            onClick={() => setShowMarkDelivered(true)}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            ✅ Tandai Sudah Diterima
          </button>
        </div>
      )}

      {/* DELIVERED */}
      {order.status === 'delivered' && (
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-slate-500 w-32 shrink-0">Tanggal Diterima</span>
            <span className="text-slate-900 font-medium">{formatDate(order.delivered_at)}</span>
          </div>
          {order.delivered_note && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-32 shrink-0">Catatan</span>
              <span className="text-slate-900">{order.delivered_note}</span>
            </div>
          )}
        </div>
      )}

      {/* EXPIRED / CANCELLED */}
      {['expired', 'cancelled'].includes(order.status) && (
        <p className="text-sm text-slate-500">
          Pesanan ini sudah berstatus <strong>{statusConfig[order.status]?.label ?? order.status}</strong>. Tidak ada aksi yang tersedia.
        </p>
      )}

      {/* Toast */}
      {toast && (
        <div className={`mt-3 text-sm font-medium px-4 py-2 rounded-lg ${toast.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showInputResi && (
        <InputResiModal
          orderId={order.id}
          onClose={() => setShowInputResi(false)}
          onSuccess={(updated) => {
            setShowInputResi(false)
            onOrderUpdate(updated)
            showToast('✅ Pesanan berhasil dikirim', true)
          }}
        />
      )}
      {showMarkDelivered && (
        <MarkDeliveredModal
          orderId={order.id}
          onClose={() => setShowMarkDelivered(false)}
          onSuccess={(updated) => {
            setShowMarkDelivered(false)
            onOrderUpdate(updated)
            showToast('✅ Pesanan ditandai sudah diterima', true)
          }}
        />
      )}
    </div>
  )
}

// ─── OrderTimeline ────────────────────────────────────────────────────────────

function OrderTimeline({ order }: { order: Order }) {
  const steps = [
    { label: 'Pesanan Dibuat', key: 'created', done: true, date: order.created_at },
    { label: 'Pembayaran', key: 'paid', done: ['paid', 'processed', 'shipped', 'delivered'].includes(order.status), date: order.paid_at },
    { label: 'Diproses', key: 'processed', done: ['processed', 'shipped', 'delivered'].includes(order.status), date: order.processed_at },
    { label: 'Dikirim', key: 'shipped', done: ['shipped', 'delivered'].includes(order.status), date: order.shipped_at },
    { label: 'Selesai', key: 'delivered', done: order.status === 'delivered', date: order.delivered_at },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Timeline Pesanan</h2>
      <div className="flex items-start gap-0">
        {steps.map((step, idx) => (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${steps[idx + 1].done ? 'bg-[#7FB300]' : 'bg-slate-200'}`} />
            )}
            {/* Circle */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
              step.done
                ? 'bg-[#7FB300] border-[#7FB300] text-white'
                : 'bg-white border-slate-300 text-slate-400'
            }`}>
              {step.done ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-300" />
              )}
            </div>
            {/* Label & date */}
            <div className="mt-2 text-center px-1">
              <p className={`text-xs font-medium ${step.done ? 'text-[#7FB300]' : 'text-slate-400'}`}>{step.label}</p>
              {step.date && step.done && (
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(step.date)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const orderId = params.id

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrder = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sambers/orders/${orderId}`)
      const json = await res.json()
      if (json.data?.order) {
        setOrder(json.data.order)
      } else {
        setError('Pesanan tidak ditemukan')
      }
    } catch {
      setError('Gagal memuat data pesanan')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  function handleOrderUpdate(updated: Partial<Order>) {
    setOrder((prev) => prev ? { ...prev, ...updated } : prev)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Pesanan tidak ditemukan'}</p>
        <button onClick={() => router.push('/sambers/pesanan')} className="mt-4 text-[#7FB300] hover:underline">
          ← Kembali ke daftar pesanan
        </button>
      </div>
    )
  }

  const shortId = order.id.slice(0, 8).toUpperCase()
  const cfg = statusConfig[order.status] ?? { label: order.status, color: 'bg-slate-100 text-slate-700' }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/sambers/pesanan')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">
              Order <span className="font-mono text-[#7FB300]">#{shortId}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-sm text-slate-400">{formatDate(order.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <OrderTimeline order={order} />

        {/* Actions */}
        {!['pending'].includes(order.status) && (
          <OrderActions order={order} onOrderUpdate={handleOrderUpdate} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Customer */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Info Customer</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-500 w-20 shrink-0">Nama</dt>
                <dd className="text-slate-900 font-medium">{order.customer_name || order.profiles?.full_name || order.user?.name || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500 w-20 shrink-0">Email</dt>
                <dd className="text-slate-900">{order.customer_email || order.profiles?.email || order.user?.email || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500 w-20 shrink-0">Telepon</dt>
                <dd className="text-slate-900">{order.user?.phone || order.profiles?.phone || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Alamat Pengiriman */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Alamat Pengiriman</h2>
            {(order.shipping_addresses || order.shipping_recipient_name) ? (
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Penerima</dt>
                  <dd className="text-slate-900 font-medium">{order.shipping_addresses?.recipient_name || order.shipping_recipient_name || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Telepon</dt>
                  <dd className="text-slate-900">{order.shipping_addresses?.recipient_phone || order.shipping_phone || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Alamat</dt>
                  <dd className="text-slate-900">
                    {order.shipping_addresses?.address_line1 || order.shipping_full_address || '—'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 w-20 shrink-0">Kota</dt>
                  <dd className="text-slate-900">
                    {[order.shipping_addresses?.city || order.shipping_city, order.shipping_addresses?.province || order.shipping_province, order.shipping_addresses?.postal_code || order.shipping_postal_code].filter(Boolean).join(', ')}
                  </dd>
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
              {(order.order_items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{item.product_name || item.product_variants?.products?.name || '—'}</div>
                    <div className="text-xs text-slate-400">{item.variant_name || item.product_variants?.name || ''}</div>
                  </td>
                  <td className="px-5 py-3 text-center text-slate-700">{item.quantity}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatRp(item.price)}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">{formatRp((item.subtotal ?? (item.price * item.quantity)) || 0)}</td>
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
              <dd className="font-semibold text-[#7FB300] text-base">{formatRp(order.total_amount)}</dd>
            </div>
          </dl>
          {order.xendit_invoice_url && (
            <a
              href={order.xendit_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-[#7FB300] hover:underline"
            >
              Lihat Invoice Xendit →
            </a>
          )}
        </div>
    </div>
  )
}
