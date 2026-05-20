'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberDetail {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  special_discount_pct: number | null
  special_discount_note: string | null
  special_discount_set_at: string | null
}

interface MemberStats {
  total_orders: number
  total_spent: number
  last_order_at: string | null
}

interface Order {
  id: string
  short_id: string
  status: string
  total_amount: number
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Bayar',
  paid: 'Lunas',
  processed: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  expired: 'Kadaluarsa',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processed: 'bg-orange-100 text-orange-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  expired: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
      {message}
    </div>
  )
}

// ─── Discount Form (inline) ───────────────────────────────────────────────────

interface DiscountFormProps {
  initialPct: number
  initialNote: string
  onSave: (pct: number, note: string) => Promise<void>
  onCancel: () => void
  saving: boolean
}

function DiscountForm({ initialPct, initialNote, onSave, onCancel, saving }: DiscountFormProps) {
  const [pct, setPct] = useState(initialPct)
  const [note, setNote] = useState(initialNote)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(pct, note)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-slate-100">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">% Diskon <span className="text-red-500">*</span></label>
        <input
          type="number"
          min={1}
          max={50}
          required
          value={pct}
          onChange={e => setPct(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
          placeholder="Contoh: 10"
        />
        <p className="text-xs text-slate-400 mt-0.5">1 – 50%</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Catatan Internal</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
          placeholder="misal: Reseller Balikpapan"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-[#7FB300] text-white rounded-lg hover:bg-[#6a9700] transition-colors disabled:opacity-50 font-medium"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<MemberDetail | null>(null)
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // TODO: Replace with real API when BENJI deploys /api/sambers/member/[id]
  const fetchMember = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sambers/member/${memberId}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setMember(data.member ?? data)
      setStats(data.stats ?? null)
      setOrders(data.recent_orders ?? [])
    } catch {
      // Fallback: try members list to get basic info
      // TODO: Remove fallback once BENJI's /api/sambers/member/[id] is live
      try {
        const res2 = await fetch(`/api/sambers/members?limit=1000`)
        const data2 = await res2.json()
        const found = (data2.members ?? []).find((m: MemberDetail) => m.id === memberId)
        if (found) setMember(found)
      } catch {
        // ignore
      }
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    fetchMember()
  }, [fetchMember])

  const handleSaveDiscount = async (pct: number, note: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/sambers/member/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ special_discount_pct: pct, special_discount_note: note }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      setMember(prev => prev ? {
        ...prev,
        special_discount_pct: pct,
        special_discount_note: note,
        special_discount_set_at: new Date().toISOString(),
      } : prev)
      setShowForm(false)
      setToast('✅ Diskon berhasil disimpan')
    } catch {
      setToast('❌ Gagal menyimpan diskon')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveDiscount = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/sambers/member/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ special_discount_pct: null, special_discount_note: null }),
      })
      if (!res.ok) throw new Error('Gagal menghapus')
      setMember(prev => prev ? {
        ...prev,
        special_discount_pct: null,
        special_discount_note: null,
        special_discount_set_at: null,
      } : prev)
      setConfirmDelete(false)
      setToast('✅ Diskon berhasil dihapus')
    } catch {
      setToast('❌ Gagal menghapus diskon')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-400 text-sm">Memuat data member...</p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/sambers/member')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
          ← Kembali ke Daftar Member
        </button>
        <p className="text-slate-500 text-sm">Member tidak ditemukan.</p>
      </div>
    )
  }

  const hasDiscount = member.special_discount_pct !== null && member.special_discount_pct > 0

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/sambers/member')}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-3 transition-colors"
        >
          ← Kembali ke Daftar Member
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Detail Member</h1>
      </div>

      {/* Section 1: Info Member */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-800">Info Member</h2>
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 whitespace-nowrap">
              💛 VIP Member
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Nama</p>
            <p className="font-medium text-slate-800">{member.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Email</p>
            <p className="text-slate-700">{member.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Telepon</p>
            <p className="text-slate-700">{member.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Tgl Bergabung</p>
            <p className="text-slate-700">{formatDate(member.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Statistik */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats?.total_orders ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Total Pesanan</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-lg font-bold text-slate-900 leading-tight">
            {formatRupiah(stats?.total_spent ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Belanja</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-sm font-bold text-slate-900">{formatDate(stats?.last_order_at ?? null)}</p>
          <p className="text-xs text-slate-500 mt-1">Pesanan Terakhir</p>
        </div>
      </div>

      {/* Section 3: Diskon Khusus */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-800">💛 Diskon Khusus Member</h2>

        {!hasDiscount ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Belum ada diskon khusus untuk member ini.</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 text-sm bg-[#7FB300] text-white rounded-lg hover:bg-[#6a9700] transition-colors font-medium"
              >
                + Tambah Diskon
              </button>
            )}
            {showForm && (
              <DiscountForm
                initialPct={5}
                initialNote=""
                onSave={handleSaveDiscount}
                onCancel={() => setShowForm(false)}
                saving={saving}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-700">{member.special_discount_pct}%</span>
                <span className="text-sm text-yellow-600">diskon aktif</span>
              </div>
              {member.special_discount_note && (
                <p className="text-sm text-slate-600">
                  📝 {member.special_discount_note}
                </p>
              )}
              {member.special_discount_set_at && (
                <p className="text-xs text-slate-400">Diset pada {formatDate(member.special_discount_set_at)}</p>
              )}
            </div>

            {!showForm && !confirmDelete && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm border border-[#7FB300] text-[#7FB300] rounded-lg hover:bg-[#7FB300] hover:text-white transition-colors font-medium"
                >
                  Ubah
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 text-sm border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Hapus
                </button>
              </div>
            )}

            {confirmDelete && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-700 font-medium">Hapus diskon {member.special_discount_pct}% dari member ini?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRemoveDiscount}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={saving}
                    className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {showForm && (
              <DiscountForm
                initialPct={member.special_discount_pct ?? 5}
                initialNote={member.special_discount_note ?? ''}
                onSave={handleSaveDiscount}
                onCancel={() => setShowForm(false)}
                saving={saving}
              />
            )}
          </div>
        )}
      </div>

      {/* Section 4: Riwayat Pesanan */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Riwayat Pesanan</h2>
          <a
            href={`/sambers/pesanan?user=${memberId}`}
            className="text-xs text-[#7FB300] hover:underline"
          >
            Lihat semua →
          </a>
        </div>

        {orders.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            Belum ada pesanan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">#Order</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      #{order.short_id ?? order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
