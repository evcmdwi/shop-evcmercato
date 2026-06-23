'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

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

// ─── SendWAModal ─────────────────────────────────────────────────────────────

function SendWAModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertTemplate = (tpl: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newVal = message.slice(0, start) + tpl + message.slice(end)
    setMessage(newVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + tpl.length, start + tpl.length)
    }, 0)
  }

  const handleSend = async () => {
    if (message.trim().length < 5) { setToast({ type: 'error', text: 'Pesan minimal 5 karakter' }); return }
    setSending(true); setToast(null)
    try {
      const res = await fetch('/api/sambers/leads/send-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, message }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ type: 'error', text: data.error || 'Gagal mengirim' }); return }
      setToast({ type: 'success', text: 'Pesan terkirim! ✅' })
      setTimeout(onClose, 1500)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">💬 Kirim WA ke {lead.nama}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {['{Nama}', '{Kota}', '{Interest}'].map(tpl => (
            <button key={tpl} onClick={() => insertTemplate(tpl)}
              className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors">
              [{tpl}]
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          placeholder={`Halo Kak {Nama}! 👋\n\nTerima kasih sudah tertarik dengan produk EVC Mercato...`}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] resize-none mb-3"
        />

        {toast && (
          <div className={`text-sm px-3 py-2 rounded-xl mb-3 ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {toast.text}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Batal</button>
          <button onClick={handleSend} disabled={sending}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
            {sending ? 'Mengirim...' : 'Kirim WA'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BroadcastModal ──────────────────────────────────────────────────────────

function BroadcastModal({ leads, selectedIds, onClose }: {
  leads: Lead[]
  selectedIds: Set<string>
  onClose: () => void
}) {
  const selectedLeads = leads.filter(l => selectedIds.has(l.id))
  const [template, setTemplate] = useState(
    'Hai Kak {Nama}! 👋\n\nTerima kasih sudah tertarik dengan {Interest} di EVC Mercato.\nKami ingin menginfokan promo spesial untuk kamu...'
  )
  const [phase, setPhase] = useState<'compose' | 'sending' | 'done'>('compose')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertTemplate = (tpl: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newVal = template.slice(0, start) + tpl + template.slice(end)
    setTemplate(newVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + tpl.length, start + tpl.length)
    }, 0)
  }

  const previewMessage = () => {
    if (selectedLeads.length === 0) return template
    const first = selectedLeads[0]
    return template
      .replace(/\{Nama\}/g, first.nama || '')
      .replace(/\{Kota\}/g, first.kota || '')
      .replace(/\{Interest\}/g, first.interest || '')
  }

  const handleBroadcast = async () => {
    if (!template.trim()) return
    if (!confirm(`Kirim ke ${selectedLeads.length} nomor?`)) return
    setPhase('sending')
    setProgress(0)

    // We poll progress via the response — since broadcast is sequential server-side,
    // we just show an animated progress while waiting
    const totalCount = selectedLeads.length
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.floor(100 / (totalCount * 2)), 90))
    }, 800)

    try {
      const res = await fetch('/api/sambers/leads/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: [...selectedIds], template }),
      })
      clearInterval(interval)
      setProgress(100)
      const data = await res.json()
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 })
      setPhase('done')
    } catch {
      clearInterval(interval)
      setResult({ sent: 0, failed: totalCount })
      setPhase('done')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">📢 Broadcast ke {selectedLeads.length} leads</h3>
          {phase !== 'sending' && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          )}
        </div>

        {phase === 'compose' && (
          <>
            <div className="flex gap-2 mb-3 flex-wrap">
              {['{Nama}', '{Kota}', '{Interest}'].map(tpl => (
                <button key={tpl} onClick={() => insertTemplate(tpl)}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors">
                  [{tpl}]
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] resize-none mb-3"
            />

            {selectedLeads.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">Preview untuk {selectedLeads[0].nama}:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{previewMessage()}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Batal</button>
              <button onClick={handleBroadcast} disabled={!template.trim()}
                className="px-4 py-2 text-sm bg-[#7FB300] text-white rounded-xl font-semibold hover:bg-[#6B9700] disabled:opacity-50 transition-colors">
                Kirim ke {selectedLeads.length} nomor
              </button>
            </div>
          </>
        )}

        {phase === 'sending' && (
          <div className="py-6">
            <p className="text-sm text-slate-600 mb-3 text-center">Mengirim pesan... harap tunggu</p>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
              <div className="bg-[#7FB300] h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-400 text-center">{progress}%</p>
          </div>
        )}

        {phase === 'done' && result && (
          <div className="py-4">
            <div className="text-center mb-4">
              <p className="text-lg font-bold text-slate-800 mb-1">Broadcast selesai!</p>
              <p className="text-green-600 font-semibold">✅ {result.sent} terkirim</p>
              {result.failed > 0 && <p className="text-red-500 font-semibold">❌ {result.failed} gagal</p>}
            </div>
            <div className="flex justify-center">
              <button onClick={onClose} className="px-6 py-2 bg-[#7FB300] text-white rounded-xl font-semibold text-sm hover:bg-[#6B9700]">
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

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

  // Modal / broadcast state
  const [showSendWA, setShowSendWA] = useState<Lead | null>(null)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)))
    }
  }

  const allSelected = leads.length > 0 && selectedIds.size === leads.length
  const someSelected = selectedIds.size > 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Database Leads</h1>
          <p className="text-sm text-slate-500">Kelola data leads prospek EVC Mercato</p>
        </div>
        <Link
          href="/sambers/leads/import"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7FB300] text-white text-sm font-semibold rounded-xl hover:bg-[#6B9700] transition-colors whitespace-nowrap shrink-0">
          📥 Import Leads
        </Link>
      </div>

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
          <div className="flex items-center gap-3">
            <div>
              <span className="font-semibold text-slate-700">Database Leads</span>
              <span className="ml-2 text-sm text-slate-400">({total} data)</span>
            </div>
            {someSelected && (
              <span className="text-sm text-[#7FB300] font-semibold">{selectedIds.size} dipilih</span>
            )}
            {someSelected && (
              <button
                onClick={() => setShowBroadcast(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#7FB300] text-white text-sm font-semibold rounded-xl hover:bg-[#6B9700] transition-colors">
                📢 Broadcast
              </button>
            )}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, HP, kota, interest..."
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                    className="rounded cursor-pointer accent-[#7FB300]" />
                </th>
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
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Memuat...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">
                  {search ? 'Tidak ada hasil pencarian' : 'Belum ada data leads'}
                </td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className={`border-b border-slate-50 hover:bg-slate-50 ${selectedIds.has(lead.id) ? 'bg-green-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)}
                      className="rounded cursor-pointer accent-[#7FB300]" />
                  </td>
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
                      <button onClick={() => setShowSendWA(lead)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors">
                        💬 WA
                      </button>
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

      {/* Modals */}
      {showSendWA && (
        <SendWAModal lead={showSendWA} onClose={() => setShowSendWA(null)} />
      )}
      {showBroadcast && (
        <BroadcastModal leads={leads} selectedIds={selectedIds} onClose={() => { setShowBroadcast(false); setSelectedIds(new Set()) }} />
      )}
    </div>
  )
}
