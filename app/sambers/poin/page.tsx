'use client'
import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/utils'

// Tab: promo | riwayat | pengaturan

export default function AdminPointsPage() {
  const [activeTab, setActiveTab] = useState<'promo' | 'riwayat' | 'pengaturan' | 'extra_point'>('promo')
  const [stats, setStats] = useState({ earned: 0, redeemed: 0, orders: 0, revenue: 0 })
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [allPromos, setAllPromos] = useState<any[]>([])
  const [config, setConfig] = useState({ shipping_cost: 10000, admin_fee: 3000 })
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])

  // Extra Point Khusus state
  const [extraPointPromos, setExtraPointPromos] = useState<any[]>([])
  const [extraPointForm, setExtraPointForm] = useState({ email: '', multiplier: 1.5, starts_at: '', ends_at: '', note: '' })
  const [extraPointLoading, setExtraPointLoading] = useState(false)

  // Dropdown state for promo type selection
  const [showPromoTypeMenu, setShowPromoTypeMenu] = useState(false)
  const [modalType, setModalType] = useState<'redeem' | 'purchase_bonus' | 'new_user' | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/sambers/redemptions/stats').then(r => r.json()),
      fetch('/api/sambers/redemptions').then(r => r.json()),
      fetch('/api/sambers/redemptions/config').then(r => r.json()),
      fetch('/api/sambers/promos').then(r => r.json()),
      fetch('/api/sambers/products?limit=100').then(r => r.json()),
      fetch('/api/sambers/extra-point-promos').then(r => r.json()),
    ]).then(([statsData, redemptionsData, configData, promosData, productsData, extraPromos]) => {
      setExtraPointPromos(extraPromos.promos ?? [])
      setStats({
        earned: statsData.points_earned ?? statsData.earned ?? 0,
        redeemed: statsData.points_redeemed ?? statsData.redeemed ?? 0,
        orders: statsData.redeem_orders ?? statsData.orders ?? 0,
        revenue: statsData.fee_revenue ?? statsData.revenue ?? 0,
      })
      setRedemptions(redemptionsData.redemptions ?? [])
      setConfig(configData.config ?? { shipping_cost: 10000, admin_fee: 3000 })
      setAllPromos(promosData.promos ?? [])
      setProducts(productsData.data ?? productsData.products ?? [])
      setLoading(false)
    })
  }, [])

  const handleAddExtraPointPromo = async (e: React.FormEvent) => {
    e.preventDefault()
    setExtraPointLoading(true)
    const res = await fetch('/api/sambers/extra-point-promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extraPointForm),
    })
    const d = await res.json()
    setExtraPointLoading(false)
    if (res.ok) {
      setExtraPointPromos(prev => [d.promo, ...prev])
      setExtraPointForm({ email: '', multiplier: 1.5, starts_at: '', ends_at: '', note: '' })
    } else {
      alert(d.error ?? 'Gagal menambah promo')
    }
  }

  const handleToggleExtraPointPromo = async (promo: any) => {
    await fetch(`/api/sambers/extra-point-promos/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !promo.is_active }),
    })
    setExtraPointPromos(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
  }

  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetch('/api/sambers/orders?order_type=redeem').then(r => r.json()).then(d => setOrders(d.orders ?? []))
    }
  }, [activeTab])

  const handleTogglePromo = async (promo: any) => {
    await fetch(`/api/sambers/promos/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !promo.is_active }),
    })
    setAllPromos(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">💎 EVC Points</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola promo penukaran dan konfigurasi program poin</p>
        </div>
        {activeTab === 'promo' && (
          <div className="relative">
            <button
              onClick={() => setShowPromoTypeMenu(!showPromoTypeMenu)}
              className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#6B9700] transition-colors flex items-center gap-2"
            >
              + Tambah Promo ▾
            </button>
            {showPromoTypeMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-48 overflow-hidden">
                <button
                  onClick={() => { setModalType('new_user'); setShowPromoTypeMenu(false) }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                >
                  👤 Promo New User
                </button>
                <button
                  onClick={() => { setModalType('purchase_bonus'); setShowPromoTypeMenu(false) }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                >
                  🛒 Promo Paket Belanja
                </button>
                <button
                  onClick={() => { setEditItem(null); setModalType('redeem'); setShowPromoTypeMenu(false) }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                >
                  💎 Promo Redeem Points
                </button>
              </div>
            )}
          </div>
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
        {([['promo', 'Semua Promo'], ['extra_point', 'Extra Point Khusus'], ['riwayat', 'Riwayat Redeem'], ['pengaturan', 'Pengaturan']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Semua Promo */}
      {activeTab === 'promo' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-slate-400">Memuat...</div>
          ) : redemptions.length === 0 && allPromos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">💎</p>
              <p>Belum ada promo. Klik &quot;+ Tambah Promo&quot; untuk mulai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Existing Redeem Promos */}
              {redemptions.map((r: any) => (
                <div key={r.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${r.is_featured ? 'border-amber-400' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full inline-block">💎 Redeem</span>
                    {r.is_featured && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full inline-block">⭐ Featured</span>}
                  </div>
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
                      onClick={() => { setEditItem(r); setModalType('redeem') }}
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

              {/* New User Promos */}
              {allPromos.filter((p: any) => p.promo_type === 'new_user').map((promo: any) => (
                <div key={promo.id} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full mb-2 inline-block">👤 New User</span>
                  <p className="font-semibold">{promo.title}</p>
                  <p className="text-blue-600 font-bold mt-1">+{promo.bonus_points} pts bonus</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {promo.active_until ? `Sampai ${new Date(promo.active_until).toLocaleDateString('id-ID')}` : 'Permanent'}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleTogglePromo(promo)}
                      className={`flex-1 text-xs rounded-lg py-1.5 ${promo.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                    >
                      {promo.is_active ? 'Pause' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Purchase Bonus Promos */}
              {allPromos.filter((p: any) => p.promo_type === 'purchase_bonus').map((promo: any) => (
                <div key={promo.id} className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
                  <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full mb-2 inline-block">🛒 Paket Belanja</span>
                  <p className="font-semibold">{promo.title}</p>
                  {promo.products?.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promo.products.image_url} className="w-12 h-12 rounded-lg object-cover mt-2" alt={promo.title} />
                  )}
                  <p className="text-orange-600 font-bold mt-1">{promo.points_multiplier}x Points</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {promo.active_until ? `Sampai ${new Date(promo.active_until).toLocaleDateString('id-ID')}` : 'Permanent'}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleTogglePromo(promo)}
                      className={`flex-1 text-xs rounded-lg py-1.5 ${promo.is_active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                    >
                      {promo.is_active ? 'Pause' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Extra Point Khusus */}
      {activeTab === 'extra_point' && (
        <div className="space-y-6">
          {/* Form Tambah Promo */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-slate-800 mb-4">🎉 Tambah Promo Extra Point Khusus</h3>
            <form onSubmit={handleAddExtraPointPromo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Email User *</label>
                <input
                  type="email"
                  placeholder="cari email..."
                  value={extraPointForm.email}
                  onChange={e => setExtraPointForm(p => ({ ...p, email: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Multiplier *</label>
                <input
                  type="number"
                  min="1.1"
                  step="0.1"
                  placeholder="1.5"
                  value={extraPointForm.multiplier}
                  onChange={e => setExtraPointForm(p => ({ ...p, multiplier: parseFloat(e.target.value) || 1.5 }))}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
                <input
                  type="text"
                  placeholder="contoh: VIP member"
                  value={extraPointForm.note}
                  onChange={e => setExtraPointForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mulai *</label>
                <input
                  type="date"
                  value={extraPointForm.starts_at}
                  onChange={e => setExtraPointForm(p => ({ ...p, starts_at: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sampai *</label>
                <input
                  type="date"
                  value={extraPointForm.ends_at}
                  onChange={e => setExtraPointForm(p => ({ ...p, ends_at: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={extraPointLoading}
                  className="bg-[#7FB300] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#6B9700] transition-colors disabled:opacity-50"
                >
                  {extraPointLoading ? 'Menyimpan...' : '+ Tambah Promo'}
                </button>
              </div>
            </form>
          </div>

          {/* List Promo */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-800">Daftar Promo Extra Point Khusus</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Multiplier</th>
                    <th className="px-4 py-3 text-left">Periode</th>
                    <th className="px-4 py-3 text-left">Catatan</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {extraPointPromos.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">Belum ada promo extra point khusus</td></tr>
                  ) : extraPointPromos.map((promo: any) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{promo.email}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-amber-600">{promo.multiplier}x</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(promo.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} –{' '}
                        {new Date(promo.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{promo.note ?? '-'}</td>
                      <td className="px-4 py-3">
                        {promo.is_active
                          ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Aktif</span>
                          : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleExtraPointPromo(promo)}
                          className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                            promo.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {promo.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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

      {/* Modal: Redeem Points (existing) */}
      {modalType === 'redeem' && (
        <RedemptionModal
          item={editItem}
          onClose={() => { setModalType(null); setEditItem(null) }}
          onSave={(r) => {
            if (editItem) {
              setRedemptions(prev => prev.map((p: any) => p.id === r.id ? r : p))
            } else {
              setRedemptions(prev => [r, ...prev])
            }
            setModalType(null)
            setEditItem(null)
          }}
        />
      )}

      {/* Modal: New User Promo */}
      {modalType === 'new_user' && (
        <NewUserPromoModal
          onClose={() => setModalType(null)}
          onSave={(promo) => { setAllPromos(prev => [promo, ...prev]); setModalType(null) }}
          products={products}
        />
      )}

      {/* Modal: Purchase Bonus Promo */}
      {modalType === 'purchase_bonus' && (
        <PurchaseBonusModal
          onClose={() => setModalType(null)}
          onSave={(promo) => { setAllPromos(prev => [promo, ...prev]); setModalType(null) }}
          products={products}
        />
      )}

      {/* Legacy showModal support (unused but kept for safety) */}
      {showModal && !modalType && (
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

// ─── Modal: Redeem Points (existing) ──────────────────────────────────────────

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
          <h2 className="text-xl font-bold">{item ? 'Edit Promo Redeem' : '💎 Tambah Promo Redeem'}</h2>
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

// ─── Modal: New User Promo ────────────────────────────────────────────────────

function NewUserPromoModal({ onClose, onSave }: { onClose: () => void; onSave: (promo: any) => void; products: any[] }) {
  const [form, setForm] = useState({ title: 'Bonus Member Baru Mei 2026', bonus_points: 100, active_until: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/sambers/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promo_type: 'new_user', ...form, active_until: form.active_until || null }),
    })
    const d = await res.json()
    setLoading(false)
    if (res.ok) onSave(d.promo)
    else alert(d.error)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">👤 Promo New User</h2>
          <button onClick={onClose}>✕</button>
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
            <label className="block text-sm font-medium mb-1">💎 Bonus Points untuk Member Baru *</label>
            <input
              type="number" min="1" value={form.bonus_points}
              onChange={e => setForm(p => ({ ...p, bonus_points: parseInt(e.target.value) || 1 }))}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Berlaku Sampai (opsional)</label>
            <input
              type="date" value={form.active_until}
              onChange={e => setForm(p => ({ ...p, active_until: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
            <p className="text-xs text-gray-400 mt-1">Kosongkan = berlaku selamanya</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Batal</button>
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

// ─── Modal: Purchase Bonus Promo ──────────────────────────────────────────────

function PurchaseBonusModal({ onClose, onSave, products }: { onClose: () => void; onSave: (promo: any) => void; products: any[] }) {
  const [form, setForm] = useState({ title: '', product_id: '', variant_id: '', points_multiplier: 2.0, active_until: '' })
  const [loading, setLoading] = useState(false)
  const selectedProduct = products.find((p: any) => p.id === form.product_id)
  const variants = selectedProduct?.product_variants ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const body = {
      promo_type: 'purchase_bonus',
      title: form.title || `Double Points: ${selectedProduct?.name}`,
      product_id: form.product_id,
      variant_id: form.variant_id || null,
      points_multiplier: form.points_multiplier,
      active_until: form.active_until || null,
    }
    const res = await fetch('/api/sambers/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await res.json()
    setLoading(false)
    if (res.ok) onSave(d.promo)
    else alert(d.error)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">🛒 Promo Paket Belanja</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Produk *</label>
            <select
              value={form.product_id}
              onChange={e => setForm(p => ({ ...p, product_id: e.target.value, variant_id: '' }))}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
          <div>
            <label className="block text-sm font-medium mb-1">Multiplier Points *</label>
            <select
              value={form.points_multiplier}
              onChange={e => setForm(p => ({ ...p, points_multiplier: parseFloat(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            >
              <option value="2">2x Double Points</option>
              <option value="3">3x Triple Points</option>
              <option value="1.5">1.5x Bonus Points</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Judul Promo</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder={`Double Points: ${selectedProduct?.name || 'Produk'}`}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Berlaku Sampai (opsional)</label>
            <input
              type="date" value={form.active_until}
              onChange={e => setForm(p => ({ ...p, active_until: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Batal</button>
            <button
              type="submit"
              disabled={loading || !form.product_id}
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
