'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  nama: string
  phone: string
  kota: string | null
  alamat: string | null
  interest: string | null
  notes: string | null
  status: string
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  interested: 'Tertarik',
  converted: 'Konversi',
  not_interested: 'Tidak Tertarik',
}

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  interested: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
  not_interested: 'bg-gray-100 text-gray-600',
}

function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) return '62' + clean.slice(1)
  if (clean.startsWith('62')) return clean
  return '62' + clean
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    nama: '', phone: '', kota: '', alamat: '', interest: '', notes: ''
  })

  const fetchLeads = useCallback(async (p = 1, q = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sambers/leads?page=${p}&search=${encodeURIComponent(q)}`)
      const data = await res.json()
      setLeads(data.data ?? [])
      setTotal(data.count ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { fetchLeads(1, search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search, fetchLeads])

  useEffect(() => { fetchLeads(page, search) }, [page]) // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama.trim() || !form.phone.trim()) { setError('Nama dan No HP wajib diisi'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/sambers/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal menyimpan'); return }
      setSuccess('Lead berhasil ditambahkan!')
      setForm({ nama: '', phone: '', kota: '', alamat: '', interest: '', notes: '' })
      fetchLeads(1, search)
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus lead ${nama}?`)) return
    await fetch(`/api/sambers/leads/${id}`, { method: 'DELETE' })
    fetchLeads(page, search)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/sambers/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Database Leads</h1>
      <p className="text-sm text-slate-500 mb-8">Kelola data leads prospek EVC Mercato</p>

      {/* Form Tambah Lead */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">➕ Tambah Lead Baru</h2>
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-xl mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-xl mb-4">✅ {success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
            <input type="text" value={form.nama} onChange={e => setForm(f => ({...f, nama: e.target.value}))}
              placeholder="Contoh: Siti Rahayu" required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">No HP/WA *</label>
            <input type="text" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
              placeholder="08xxx" required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kota</label>
            <input type="text" value={form.kota} onChange={e => setForm(f => ({...f, kota: e.target.value}))}
              placeholder="Contoh: Balikpapan"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Interest / Produk</label>
            <input type="text" value={form.interest} onChange={e => setForm(f => ({...f, interest: e.target.value}))}
              placeholder="Contoh: Natesh, Supergreen, KKI"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat</label>
            <input type="text" value={form.alamat} onChange={e => setForm(f => ({...f, alamat: e.target.value}))}
              placeholder="Alamat lengkap (opsional)"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              rows={2} placeholder="Catatan internal..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] resize-none" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting}
              className="bg-[#7FB300] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6B9700] transition-colors disabled:opacity-50">
              {submitting ? 'Menyimpan...' : 'Simpan Lead'}
            </button>
          </div>
        </form>
      </div>

      {/* List Leads */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="font-semibold text-slate-700">Database Leads</span>
            <span className="ml-2 text-sm text-slate-400">({total} data)</span>
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, HP, kota, interest..."
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Nama</th>
                <th className="px-4 py-3 font-semibold text-slate-600">HP/WA</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Kota</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Interest</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Memuat...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">
                  {search ? 'Tidak ada hasil pencarian' : 'Belum ada data leads'}
                </td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{lead.nama}</div>
                    {lead.alamat && <div className="text-xs text-slate-400 truncate max-w-[160px]">{lead.alamat}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{lead.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.kota || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.interest || '—'}</td>
                  <td className="px-4 py-3">
                    <select value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLOR[lead.status] ?? 'bg-gray-100'}`}>
                      {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* WA Button */}
                      <a href={`https://wa.me/${formatPhone(lead.phone)}?text=Halo%20${encodeURIComponent(lead.nama)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors">
                        💬 WA
                      </a>
                      <button onClick={() => handleDelete(lead.id, lead.nama)}
                        className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
            <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
