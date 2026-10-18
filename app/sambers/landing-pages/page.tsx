'use client'

import React, { useEffect, useState, useCallback } from 'react'

// ─── Types ──────────────────────────────────────────────────────────

type LPStatus = 'draft' | 'ads_only' | 'affiliate_active' | 'archived'

interface LandingPage {
  id: string
  slug: string
  title: string
  description?: string
  status: LPStatus
  target_audience_hint?: string
  preview_image_url?: string
  conversion_benchmark_pct?: number
  created_at: string
}

type FilterTab = 'semua' | LPStatus

// ─── Helpers ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LPStatus }) {
  const map: Record<LPStatus, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    ads_only: { label: '🟡 Ads Only', cls: 'bg-yellow-100 text-yellow-800' },
    affiliate_active: { label: '✅ Affiliate Active', cls: 'bg-green-100 text-green-800' },
    archived: { label: 'Archived', cls: 'bg-red-100 text-red-500' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ─── Approve Modal ────────────────────────────────────────────────────

interface ApproveModalProps {
  lp: LandingPage
  loading: boolean
  onClose: () => void
  onConfirm: (payload: {
    title: string
    description: string
    target_audience_hint: string
    preview_image_url: string
    conversion_benchmark_pct: number | null
    checklist: boolean[]
  }) => void
}

const CHECKLIST_ITEMS = [
  'LP evergreen (tidak time-bound)?',
  'Pesan utama appropriate untuk cold traffic?',
  'CTA bisa dynamic ke ref affiliate?',
  'Tidak ada claim spesifik per campaign?',
  'Brand voice sesuai guideline?',
]

function ApproveModal({ lp, loading, onClose, onConfirm }: ApproveModalProps) {
  const [title, setTitle] = useState(lp.title)
  const [description, setDescription] = useState(lp.description ?? '')
  const [targetAudience, setTargetAudience] = useState(lp.target_audience_hint ?? '')
  const [previewImageUrl, setPreviewImageUrl] = useState(lp.preview_image_url ?? '')
  const [convBenchmark, setConvBenchmark] = useState<string>(
    lp.conversion_benchmark_pct != null ? String(lp.conversion_benchmark_pct) : ''
  )
  const [checklist, setChecklist] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false))

  const toggleCheck = (i: number) => {
    setChecklist(prev => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  const handleSubmit = () => {
    onConfirm({
      title,
      description,
      target_audience_hint: targetAudience,
      preview_image_url: previewImageUrl,
      conversion_benchmark_pct: convBenchmark !== '' ? Number(convBenchmark) : null,
      checklist,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-auto">
        <h3 className="text-lg font-semibold mb-4">Approve LP untuk Affiliate Library</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Deskripsi singkat landing page ini…"
            />
          </div>

          {/* Target audience */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Target Audience Hint</label>
            <input
              type="text"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Contoh: Wanita 25–40 tahun, health-conscious"
            />
          </div>

          {/* Preview image */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preview Image URL <span className="text-gray-400">(opsional)</span></label>
            <input
              type="text"
              value={previewImageUrl}
              onChange={e => setPreviewImageUrl(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="https://…"
            />
          </div>

          {/* Conversion benchmark */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Conversion Benchmark % <span className="text-gray-400">(opsional)</span></label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={convBenchmark}
              onChange={e => setConvBenchmark(e.target.value)}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Contoh: 3.5"
            />
          </div>

          {/* Eligibility checklist */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">Eligibility Checklist <span className="text-gray-400">(soft — visual only)</span></label>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checklist[i]}
                    onChange={() => toggleCheck(i)}
                    className="mt-0.5 accent-[#7FB300]"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="px-4 py-2 text-sm text-white bg-[#7FB300] hover:bg-[#6a9700] rounded-lg disabled:opacity-50"
          >
            {loading ? 'Memproses…' : 'Approve & Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Archive Modal ────────────────────────────────────────────────────

function ArchiveModal({ lp, loading, onClose, onConfirm }: {
  lp: LandingPage
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-3 text-red-700">Archive Landing Page?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Yakin archive LP <strong>{lp.title}</strong>?
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 mb-5">
          ⚠️ Short link affiliate yang sudah beredar akan redirect ke halaman utama toko.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Memproses…' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FAQ Modal (LP dengan FAQ dari admin) ─────────────────────────────

// LP yang jawaban FAQ-nya disimpan di database (lihat /api/sambers/lp-faq).
const FAQ_EDITABLE = new Set(['supergreen-food'])

function FaqModal({ lp, onClose, onSaved }: {
  lp: LandingPage
  onClose: () => void
  onSaved: () => void
}) {
  const [items, setItems] = useState<{ id: string; q: string; a: string }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/sambers/lp-faq?slug=${encodeURIComponent(lp.slug)}`)
      .then(async (res) => {
        const d = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) setError(d.error ?? 'Gagal memuat FAQ')
        else setItems(d.items ?? [])
      })
    return () => { cancelled = true }
  }, [lp.slug])

  async function save() {
    if (!items) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/sambers/lp-faq', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: lp.slug, answers: Object.fromEntries(items.map((i) => [i.id, i.a])) }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(d.error ?? 'Gagal menyimpan'); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-full flex flex-col">
        <div className="p-6 pb-3">
          <h3 className="text-lg font-semibold">FAQ — {lp.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            Pertanyaan dengan jawaban kosong <strong>tidak ditampilkan</strong> di LP. Perubahan tampil di LP dalam hitungan detik.
          </p>
        </div>
        <div className="overflow-y-auto px-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
          {!items && !error && <p className="text-sm text-gray-400 py-6 text-center">Memuat…</p>}
          {items?.map((it, i) => (
            <label key={it.id} className="block">
              <span className="flex items-center justify-between text-sm font-medium text-gray-800">
                {i + 1}. {it.q}
                <span className={`text-[11px] font-semibold ${it.a.trim() ? 'text-green-600' : 'text-gray-400'}`}>
                  {it.a.trim() ? 'Tampil' : 'Tidak tampil'}
                </span>
              </span>
              <textarea
                value={it.a}
                onChange={(e) => setItems((list) => list?.map((x) => (x.id === it.id ? { ...x, a: e.target.value } : x)) ?? null)}
                rows={3}
                maxLength={2000}
                placeholder="Belum ada jawaban — pertanyaan ini disembunyikan"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7FB300] focus:outline-none"
              />
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end p-6 pt-4 border-t border-gray-100 mt-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={save}
            disabled={saving || !items}
            className="px-4 py-2 text-sm text-white bg-[#7FB300] hover:bg-[#6a9700] rounded-lg disabled:opacity-50"
          >
            {saving ? 'Menyimpan…' : 'Simpan FAQ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tambah LP Modal ──────────────────────────────────────────────────

function TambahLPModal({ loading, onClose, onConfirm }: {
  loading: boolean
  onClose: () => void
  onConfirm: (payload: { slug: string; title: string; description: string; status: 'draft' | 'ads_only' }) => void
}) {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'ads_only'>('draft')

  const handleSlugChange = (val: string) => {
    // auto lowercase, replace spaces with hyphens, strip non-slug chars
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const canSubmit = slug.trim() !== '' && title.trim() !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Tambah Landing Page</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Slug <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="contoh: natesh-wanita-aktif"
            />
            <p className="text-xs text-gray-400 mt-1">Lowercase, pisahkan dengan tanda hubung (-)</p>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Judul landing page"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description <span className="text-gray-400">(opsional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Deskripsi singkat…"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Status Awal</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'draft' | 'ads_only')}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
            >
              <option value="draft">Draft</option>
              <option value="ads_only">Ads Only</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ slug, title, description, status })}
            disabled={loading || !canSubmit}
            className="px-4 py-2 text-sm text-white bg-[#7FB300] hover:bg-[#6a9700] rounded-lg disabled:opacity-50"
          >
            {loading ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────

type ModalState =
  | { type: 'approve'; lp: LandingPage }
  | { type: 'archive'; lp: LandingPage }
  | { type: 'faq'; lp: LandingPage }
  | { type: 'tambah' }
  | null

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'draft', label: 'Draft' },
  { id: 'ads_only', label: 'Ads Only' },
  { id: 'affiliate_active', label: 'Affiliate Active' },
  { id: 'archived', label: 'Archived' },
]

export default function AdminLandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState<FilterTab>('semua')
  const [modal, setModal] = useState<ModalState>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sambers/landing-pages?status=all')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessage({ text: `❌ Error ${res.status}: ${err.error ?? 'Unknown'}`, ok: false })
        return
      }
      const data = await res.json()
      const list = data.data ?? data.pages ?? data.landing_pages ?? []
      setPages(list)
    } catch (e) {
      setMessage({ text: `❌ Fetch error: ${e instanceof Error ? e.message : String(e)}`, ok: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filterTab === 'semua' ? pages : pages.filter(p => p.status === filterTab)

  // ── Approve ───────────────────────────────────────────────────────
  async function handleApprove(payload: {
    title: string
    description: string
    target_audience_hint: string
    preview_image_url: string
    conversion_benchmark_pct: number | null
    checklist: boolean[]
  }) {
    if (modal?.type !== 'approve') return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/sambers/landing-pages/${modal.lp.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: '✅ LP berhasil di-approve dan masuk Affiliate Library.', ok: true })
        setModal(null)
        load()
      } else {
        setMessage({ text: `❌ ${data.error ?? 'Gagal approve'}`, ok: false })
      }
    } catch {
      setMessage({ text: '❌ Terjadi kesalahan jaringan.', ok: false })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Archive ────────────────────────────────────────────────────────
  async function handleArchive() {
    if (modal?.type !== 'archive') return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/sambers/landing-pages/${modal.lp.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: '✅ LP berhasil diarsipkan.', ok: true })
        setModal(null)
        load()
      } else {
        setMessage({ text: `❌ ${data.error ?? 'Gagal archive'}`, ok: false })
      }
    } catch {
      setMessage({ text: '❌ Terjadi kesalahan jaringan.', ok: false })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Create ─────────────────────────────────────────────────────────
  async function handleCreate(payload: { slug: string; title: string; description: string; status: 'draft' | 'ads_only' }) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/sambers/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: '✅ Landing page berhasil dibuat.', ok: true })
        setModal(null)
        load()
      } else {
        setMessage({ text: `❌ ${data.error ?? 'Gagal membuat LP'}`, ok: false })
      }
    } catch {
      setMessage({ text: '❌ Terjadi kesalahan jaringan.', ok: false })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📄 Landing Page Library</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola landing page untuk kampanye ads dan affiliate.</p>
        </div>
        <button
          onClick={() => setModal({ type: 'tambah' })}
          className="flex items-center gap-2 px-4 py-2 bg-[#7FB300] hover:bg-[#6a9700] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah LP
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
          <button className="ml-3 underline" onClick={() => setMessage(null)}>Tutup</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
              filterTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 text-[#7FB300] -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-500 py-12 text-center">Memuat…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center text-sm text-gray-500">
          {filterTab === 'semua' ? 'Belum ada landing page.' : `Tidak ada LP dengan status "${filterTab}".`}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(lp => (
                <tr key={lp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[200px] truncate">
                    {lp.slug}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {lp.title}
                    {lp.description && (
                      <p className="text-xs text-gray-400 font-normal mt-0.5 truncate max-w-[260px]">{lp.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={lp.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1.5 justify-center flex-wrap">
                      {lp.status === 'ads_only' && (
                        <button
                          onClick={() => setModal({ type: 'approve', lp })}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium"
                        >
                          Approve
                        </button>
                      )}
                      {lp.status === 'affiliate_active' && (
                        <button
                          onClick={() => setModal({ type: 'archive', lp })}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-medium"
                        >
                          Archive
                        </button>
                      )}
                      {FAQ_EDITABLE.has(lp.slug) && (
                        <button
                          onClick={() => setModal({ type: 'faq', lp })}
                          className="px-3 py-1 border border-[#7FB300] text-[#5E8500] hover:bg-[#E8F4D1] text-xs rounded-lg font-medium"
                        >
                          Edit FAQ
                        </button>
                      )}
                      {(lp.status === 'draft' || lp.status === 'archived') && !FAQ_EDITABLE.has(lp.slug) && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'approve' && (
        <ApproveModal
          lp={modal.lp}
          loading={actionLoading}
          onClose={() => setModal(null)}
          onConfirm={handleApprove}
        />
      )}

      {modal?.type === 'faq' && (
        <FaqModal
          lp={modal.lp}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            setMessage({ text: '✅ FAQ tersimpan', ok: true })
          }}
        />
      )}

      {modal?.type === 'archive' && (
        <ArchiveModal
          lp={modal.lp}
          loading={actionLoading}
          onClose={() => setModal(null)}
          onConfirm={handleArchive}
        />
      )}

      {modal?.type === 'tambah' && (
        <TambahLPModal
          loading={actionLoading}
          onClose={() => setModal(null)}
          onConfirm={handleCreate}
        />
      )}
    </div>
  )
}
