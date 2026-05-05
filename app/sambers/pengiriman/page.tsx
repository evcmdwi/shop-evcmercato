'use client'
import { useState, useEffect, useCallback } from 'react'

interface ShippingRate {
  id: string; district_id: string; district_name: string
  regency_name: string; province_name: string
  instan_rate: number; sameday_rate: number
  notes: string | null; updated_at: string
}

export default function PengirimanPage() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<null | 'single' | 'bulk' | 'edit'>(null)
  const [editItem, setEditItem] = useState<ShippingRate | null>(null)

  const formatRp = (n: number) => n > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n) : '—'

  const fetchRates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20', ...(search ? { search } : {}) })
    const res = await fetch(`/api/sambers/shipping-rates?${params}`)
    const d = await res.json()
    setRates(d.rates ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchRates() }, [fetchRates])

  const handleDelete = async (rate: ShippingRate) => {
    if (!confirm(`Yakin hapus tarif untuk ${rate.district_name}? Customer di kecamatan ini akan kembali ke pilihan Reguler saja.`)) return
    await fetch(`/api/sambers/shipping-rates/${rate.id}`, { method: 'DELETE' })
    fetchRates()
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🚚 Pengiriman Instan &amp; Sameday</h1>
          <p className="text-slate-500 text-sm mt-1">Atur tarif pengiriman cepat per kecamatan. Reguler JNT Rp 10.000 berlaku otomatis untuk semua kota.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal('bulk')} className="border border-[#7FB300] text-[#7FB300] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E8F4D1] transition-colors">
            + Per Kota
          </button>
          <button onClick={() => { setEditItem(null); setShowModal('single') }} className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#6B9700] transition-colors">
            + Tambah Kecamatan
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="🔍 Cari kecamatan / kota..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat...</div>
      ) : rates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🚚</div>
          <h3 className="font-semibold text-slate-700 mb-2">Belum ada tarif pengiriman cepat</h3>
          <p className="text-sm text-slate-400 mb-6">Customer di semua kota hanya bisa pakai Reguler JNT (Rp 10.000).</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setShowModal('bulk')} className="border border-[#7FB300] text-[#7FB300] px-4 py-2 rounded-xl text-sm font-semibold">+ Tambah per Kota</button>
            <button onClick={() => setShowModal('single')} className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Tambah Kecamatan</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Kecamatan / Kota</th>
                <th className="px-4 py-3 text-left">Instan</th>
                <th className="px-4 py-3 text-left">Sameday</th>
                <th className="px-4 py-3 text-left">Catatan</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-slate-800">{r.district_name}</div>
                    <div className="text-xs text-slate-400">{r.regency_name}, {r.province_name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.instan_rate > 0
                      ? <span className="text-[#7FB300] font-semibold">{formatRp(r.instan_rate)}</span>
                      : <span className="text-gray-300 italic text-xs">— Tidak tersedia</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.sameday_rate > 0
                      ? <span className="text-[#7FB300] font-semibold">{formatRp(r.sameday_rate)}</span>
                      : <span className="text-gray-300 italic text-xs">— Tidak tersedia</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(r); setShowModal('edit') }} className="text-xs border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete(r)} className="text-xs border border-red-200 text-red-500 rounded-lg px-2 py-1 hover:bg-red-50">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 text-sm text-slate-500">
              <span>Menampilkan {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} dari {total}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-30">← Prev</button>
                <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-30">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showModal === 'single' && <RateModal onClose={() => setShowModal(null)} onSaved={fetchRates} />}
      {showModal === 'edit' && editItem && <RateModal item={editItem} onClose={() => setShowModal(null)} onSaved={fetchRates} />}
      {showModal === 'bulk' && <BulkModal onClose={() => setShowModal(null)} onSaved={fetchRates} />}
    </div>
  )
}

function RateModal({ item, onClose, onSaved }: { item?: ShippingRate | null; onClose: () => void; onSaved: () => void }) {
  const [selectedDistrict, setSelectedDistrict] = useState<{ district_id: string; district_name: string; regency_name?: string; province_name?: string } | null>(
    item ? { district_id: item.district_id, district_name: item.district_name, regency_name: item.regency_name, province_name: item.province_name } : null
  )
  const [instanRate, setInstanRate] = useState(item?.instan_rate ?? 0)
  const [samedayRate, setSamedayRate] = useState(item?.sameday_rate ?? 0)
  const parseRate = (v: string) => Math.max(0, parseInt(v.replace(/[^0-9]/g, '')) || 0)
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [districtQuery, setDistrictQuery] = useState(item?.district_name ?? '')
  const [districtResults, setDistrictResults] = useState<{ district_id: string; district_name: string; regency_name: string; province_name: string }[]>([])

  useEffect(() => {
    if (districtQuery.length < 2 || item) return
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/wilayah/search?q=${encodeURIComponent(districtQuery)}`)
      const d = await res.json()
      setDistrictResults(d.results ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [districtQuery, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item && !selectedDistrict) { setError('Pilih kecamatan terlebih dahulu'); return }
    if (instanRate === 0 && samedayRate === 0) { setError('Setidaknya satu jenis tarif harus > 0'); return }
    setLoading(true); setError('')
    try {
      const url = item ? `/api/sambers/shipping-rates/${item.id}` : '/api/sambers/shipping-rates'
      const method = item ? 'PATCH' : 'POST'
      const body = item
        ? { instan_rate: instanRate, sameday_rate: samedayRate, notes: notes || null }
        : { district_id: selectedDistrict!.district_id, instan_rate: instanRate, sameday_rate: samedayRate, notes: notes || null }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Gagal menyimpan'); return }
      onSaved(); onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">{item ? 'Edit Tarif' : 'Tambah Tarif Pengiriman'}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kecamatan *</label>
            {item ? (
              <div className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500">{item.district_name}, {item.regency_name}</div>
            ) : (
              <div className="relative">
                <input
                  value={districtQuery}
                  onChange={e => { setDistrictQuery(e.target.value); setSelectedDistrict(null) }}
                  placeholder="Cari kecamatan..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
                />
                {districtResults.length > 0 && !selectedDistrict && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {districtResults.map((r) => (
                      <button key={r.district_id} type="button"
                        onClick={() => { setSelectedDistrict(r); setDistrictQuery(`${r.district_name}, ${r.regency_name}`); setDistrictResults([]) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                        <div className="text-sm font-medium">{r.district_name}</div>
                        <div className="text-xs text-gray-400">{r.regency_name}, {r.province_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tarif Instan (Rp)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={instanRate || ''} onChange={e => setInstanRate(parseRate(e.target.value))}
                placeholder="0 = tidak tersedia"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tarif Sameday (Rp)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={samedayRate || ''} onChange={e => setSamedayRate(parseRate(e.target.value))}
                placeholder="0 = tidak tersedia"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Isi 0 kalau jenis pengiriman tidak tersedia di kecamatan ini</p>
          <div>
            <label className="block text-sm font-medium mb-1">Catatan Internal</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#7FB300] text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
              {loading ? 'Menyimpan...' : item ? 'Simpan Perubahan' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [regencyQuery, setRegencyQuery] = useState('')
  const [regencyResults, setRegencyResults] = useState<{ regency_id: string; regency_name: string; province_name: string }[]>([])
  const [selectedRegency, setSelectedRegency] = useState<{ regency_id: string; regency_name: string; province_name: string } | null>(null)
  const [instanRate, setInstanRate] = useState(12000)
  const [samedayRate, setSamedayRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const parseRate = (v: string) => Math.max(0, parseInt(v.replace(/[^0-9]/g, '')) || 0)

  useEffect(() => {
    if (regencyQuery.length < 2 || selectedRegency) return
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/wilayah/search?q=${encodeURIComponent(regencyQuery)}`)
      const d = await res.json()
      const seen = new Set<string>()
      const regencies = (d.results ?? []).filter((r: { regency_id: string }) => {
        if (seen.has(r.regency_id)) return false
        seen.add(r.regency_id)
        return true
      }).map((r: { regency_id: string; regency_name: string; province_name: string }) => ({
        regency_id: r.regency_id,
        regency_name: r.regency_name,
        province_name: r.province_name,
      }))
      setRegencyResults(regencies)
    }, 300)
    return () => clearTimeout(timer)
  }, [regencyQuery, selectedRegency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRegency) { setError('Pilih kota terlebih dahulu'); return }
    if (instanRate === 0 && samedayRate === 0) { setError('Setidaknya satu jenis tarif harus > 0'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/sambers/shipping-rates/bulk-by-regency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regency_id: selectedRegency.regency_id, instan_rate: instanRate, sameday_rate: samedayRate, notes: notes || null }),
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setError(d.error || 'Gagal'); return }
    alert(`Berhasil membuat ${d.created} tarif untuk ${selectedRegency.regency_name}. Skip: ${d.skipped}`)
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">+ Tambah Tarif per Kota</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kota *</label>
            <div className="relative">
              <input value={regencyQuery}
                onChange={e => { setRegencyQuery(e.target.value); setSelectedRegency(null) }}
                placeholder="Cari nama kota..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
              {regencyResults.length > 0 && !selectedRegency && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {regencyResults.map(r => (
                    <button key={r.regency_id} type="button"
                      onClick={() => { setSelectedRegency(r); setRegencyQuery(`${r.regency_name}, ${r.province_name}`); setRegencyResults([]) }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0">
                      {r.regency_name}, {r.province_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selectedRegency && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tarif Instan (Rp)</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={instanRate || ''} onChange={e => setInstanRate(parseRate(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tarif Sameday (Rp)</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={samedayRate || ''} onChange={e => setSamedayRate(parseRate(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⚠️ Kecamatan yang sudah ada tarif akan di-skip otomatis (tidak akan ditimpa).</p>
              <div>
                <label className="block text-sm font-medium mb-1">Catatan Internal</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opsional"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
              </div>
            </>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm">Batal</button>
            <button type="submit" disabled={loading || !selectedRegency} className="flex-1 bg-[#7FB300] text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
              {loading ? 'Membuat...' : 'Buat Tarif per Kota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
