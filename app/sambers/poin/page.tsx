'use client'
import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/utils'

// Tab: promo | riwayat | pengaturan

export default function AdminPointsPage() {
  const [activeTab, setActiveTab] = useState<'promo' | 'riwayat' | 'pengaturan'>('promo')
  const [stats, setStats] = useState({ earned: 0, redeemed: 0, orders: 0, revenue: 0 })
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [config, setConfig] = useState({ shipping_cost: 10000, admin_fee: 3000 })
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/sambers/redemptions/stats').then(r => r.json()),
      fetch('/api/sambers/redemptions').then(r => r.json()),
      fetch('/api/sambers/redemptions/config').then(r => r.json()),
    ]).then(([statsData, redemptionsData, configData]) => {
      setStats(statsData)
      setRedemptions(redemptionsData.redemptions ?? [])
      setConfig(configData.config ?? { shipping_cost: 10000, admin_fee: 3000 })
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetch('/api/sambers/orders?order_type=redeem').then(r => r.json()).then(d => setOrders(d.orders ?? []))
    }
  }, [activeTab])

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">💎 EVC Points</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola promo penukaran dan konfigurasi program poin</p>
        </div>
        {activeTab === 'promo' && (
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#6B9700] transition-colors"
          >
            + Tambah Promo
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Points Diperoleh (Bulan Ini)', value: `${stats.earned?.toLocaleString('id')} pt`, color: 'text-amber-600' },
          { label: 'Points Ditukar (Bulan Ini)', value: `${stats.redeemed?.toLocaleString('id')} pt`, color: 'text-red-500' },
          { label: 'Order Redeem', value: stats.orders, color: 'text-[#7FB300]' },
          { label: 'Pendapatan Biaya', value: formatRupiah(stats.revenue ?? 0), color: 'text-slate-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([['promo', 'Promo Redeem'], ['riwayat', 'Riwayat Redeem'], ['pengaturan', 'Pengaturan']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Promo Redeem */}
      {activeTab === 'promo' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-slate-400">Memuat...</div>
          ) : redemptions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">💎</p>
              <p>Belum ada promo redeem. Klik &quot;+ Tambah Promo&quot; untuk mulai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redemptions.map((r: any) => (
                <div key={r.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${r.is_featured ? 'border-amber-400' : 'border-gray-100'}`}>
                  {r.is_featured && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full mb-2 inline-block">⭐ Featured</span>}
                  <div className="flex gap-3 mb-3">
                    {r.products?.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.products.image_url} className="w-16 h-16 rounded-xl object-cover" alt={r.title} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{r.title}</p>
                      {r.product_variants?.name && <p className="text-xs text-slate-500">{r.product_variants.name}</p>}
                      <p className="text-amber-600 font-bold mt-1">💎 {r.points_required} points</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mb-3">
                    <span>Stok: {r.redeem_stock - r.redeemed_count}/{r.redeem_stock}</span>
                    <span>Max {r.max_per_user}x/user</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditItem(r); setShowModal(true) }}
                      className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/sambers/redemptions/${r.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_active: !r.is_active }),
                        })
                        setRedemptions(prev => prev.map((p: any) => p.id === r.id ? { ...p, is_active: !r.is_active } : p))
                      }}
                      className={`flex-1 text-xs rounded-lg py-1.5 transition-colors ${r.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {r.is_active ? 'Pause' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Riwayat */}
      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Points</th>
                <th className="px-4 py-3 text-left">Bayar</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Belum ada riwayat redeem</td></tr>
              ) : orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.open(`/sambers/pesanan/${o.id}`, '_blank')}>
                  <td className="px-4 py-3 text-sm font-mono">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm">{o.shipping_recipient_name}</td>
                  <td className="px-4 py-3 text-sm text-amber-600 font-semibold">💎 {o.points_used} pt</td>
                  <td className="px-4 py-3 text-sm">{formatRupiah(o.total_amount)}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{o.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Pengaturan */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md">
          <h3 className="font-semibold text-slate-800 mb-4">Biaya Penukaran</h3>
          <div className="space-y-4">
            {[
              { label: 'Ongkos Kirim (Rp)', key: 'shipping_cost' },
              { label: 'Biaya Admin (Rp)', key: 'admin_fee' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm text-slate-600 mb-1">{f.label}</label>
                <input
                  type="number"
                  value={(config as any)[f.key]}
                  onChange={e => setConfig(prev => ({ ...prev, [f.key]: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                />
              </div>
            ))}
            <p className="text-xs text-slate-400">Total biaya customer: {formatRupiah((config.shipping_cost || 0) + (config.admin_fee || 0))}</p>
            <button
              onClick={async () => {
                const r = await fetch('/api/sambers/redemptions/config', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(config),
                })
                if (r.ok) alert('Pengaturan tersimpan!')
              }}
              className="w-full bg-[#7FB300] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#6B9700] transition-colors"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* Modal Create/Edit Promo */}
      {showModal && (
        <RedemptionModal
          item={editItem}
          onClose={() => setShowModal(false)}
          onSave={(r) => {
            if (editItem) {
              setRedemptions(prev => prev.map((p: any) => p.id === r.id ? r : p))
            } else {
              setRedemptions(prev => [r, ...prev])
            }
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

function RedemptionModal({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: (r: any) => void }) {
  const [form, setForm] = useState({
    title: item?.title ?? '',
    product_id: item?.product_id ?? '',
    variant_id: item?.variant_id ?? '',
    points_required: item?.points_required ?? 50,
    redeem_stock: item?.redeem_stock ?? 10,
    max_per_user: item?.max_per_user ?? 1,
    description: item?.description ?? '',
    is_featured: item?.is_featured ?? false,
    active_until: item?.active_until ? item.active_until.split('T')[0] : '',
  })
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/sambers/products?limit=100').then(r => r.json()).then(d => setProducts(d.data ?? d.products ?? []))
  }, [])

  const selectedProduct = products.find(p => p.id === form.product_id)
  const variants = selectedProduct?.product_variants ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const url = item ? `/api/sambers/redemptions/${item.id}` : '/api/sambers/redemptions'
    const method = item ? 'PATCH' : 'POST'
    const body = { ...form, variant_id: form.variant_id || null, active_until: form.active_until || null }
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    setLoading(false)
    if (r.ok) onSave(d.redemption)
    else alert(d.error ?? 'Gagal menyimpan')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{item ? 'Edit Promo' : 'Tambah Promo Baru'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Judul Promo *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Produk *</label>
            <select
              value={form.product_id}
              onChange={e => setForm(p => ({ ...p, product_id: e.target.value, variant_id: '', title: p.title || products.find(x => x.id === e.target.value)?.name || '' }))}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            >
              <option value="">-- Pilih Produk --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {variants.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Varian (opsional)</label>
              <select
                value={form.variant_id}
                onChange={e => setForm(p => ({ ...p, variant_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
              >
                <option value="">-- Semua Varian --</option>
                {variants.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">💎 Points *</label>
              <input
                type="number" min="1" value={form.points_required}
                onChange={e => setForm(p => ({ ...p, points_required: parseInt(e.target.value) || 1 }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stok *</label>
              <input
                type="number" min="0" value={form.redeem_stock}
                onChange={e => setForm(p => ({ ...p, redeem_stock: parseInt(e.target.value) || 0 }))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max/User</label>
              <input
                type="number" min="1" value={form.max_per_user}
                onChange={e => setForm(p => ({ ...p, max_per_user: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Berlaku Sampai (opsional)</label>
            <input
              type="date" value={form.active_until}
              onChange={e => setForm(p => ({ ...p, active_until: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi (opsional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium">⭐ Featured (tampil pertama)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#7FB300] text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Promo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
