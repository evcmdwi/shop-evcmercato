'use client'

import { useEffect, useState, useCallback } from 'react'

interface Product {
  id: string
  name: string
  sku: string
}

interface Review {
  id: string
  product_id: string | null
  customer_name: string
  customer_location: string | null
  rating: number
  title: string | null
  body: string
  source: string
  customer_consent_date: string
  consent_proof: string | null
  original_marketplace: string | null
  is_featured: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  products?: { name: string; sku: string } | null
}

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

type ReviewStatus = 'pending' | 'approved' | 'rejected'

interface FormState {
  product_id: string
  customer_name: string
  customer_location: string
  rating: number
  title: string
  body: string
  source: string
  original_marketplace: string
  consent_proof: string
  customer_consent_date: string
  is_featured: boolean
  status: ReviewStatus
}

const EMPTY_FORM: FormState = {
  product_id: '',
  customer_name: '',
  customer_location: '',
  rating: 5,
  title: '',
  body: '',
  source: 'curated_with_consent',
  original_marketplace: '',
  consent_proof: '',
  customer_consent_date: new Date().toISOString().slice(0, 10),
  is_featured: false,
  status: 'pending',
}

export default function TestimoniAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const qs = statusFilter ? `?status=${statusFilter}` : ''
    const res = await fetch(`/api/sambers/reviews${qs}`)
    const json = await res.json()
    setReviews(json.reviews ?? [])
    setLoading(false)
  }, [statusFilter])

  const fetchProducts = async () => {
    const res = await fetch('/api/sambers/products?limit=200')
    const json = await res.json()
    setProducts(json.products ?? json.data ?? [])
  }

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    fetchProducts()
  }, [])

  const handlePatch = async (id: string, patch: Partial<Review>) => {
    const res = await fetch(`/api/sambers/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      showToast('Berhasil diperbarui')
      fetchReviews()
    } else {
      showToast('Gagal memperbarui', false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus testimoni ini?')) return
    const res = await fetch(`/api/sambers/reviews/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Berhasil dihapus')
      fetchReviews()
    } else {
      showToast('Gagal menghapus', false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      product_id: form.product_id || null,
      customer_location: form.customer_location || null,
      title: form.title || null,
      consent_proof: form.consent_proof || null,
      original_marketplace: form.original_marketplace || null,
      customer_consent_date: form.customer_consent_date
        ? new Date(form.customer_consent_date).toISOString()
        : new Date().toISOString(),
    }
    const res = await fetch('/api/sambers/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      showToast('Testimoni berhasil ditambahkan')
      setShowForm(false)
      setForm({ ...EMPTY_FORM })
      fetchReviews()
    } else {
      const json = await res.json()
      showToast(json.error || 'Gagal menyimpan', false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">💬 Testimoni</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola ulasan pelanggan yang dikurasi</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#6a9500] transition"
        >
          {showForm ? 'Tutup Form' : '+ Tambah Testimoni'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-2">Tambah Testimoni Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Produk</label>
              <select
                value={form.product_id}
                onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
              >
                <option value="">-- Pilih produk --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Pelanggan *</label>
              <input
                required
                value={form.customer_name}
                onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
                placeholder="Misal: Budi S."
              />
            </div>
            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi</label>
              <input
                value={form.customer_location}
                onChange={e => setForm(f => ({ ...f, customer_location: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
                placeholder="Misal: Balikpapan"
              />
            </div>
            {/* Rating */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rating *</label>
              <select
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
              >
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{r} ★</option>
                ))}
              </select>
            </div>
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
                placeholder="Judul singkat ulasan"
              />
            </div>
            {/* Marketplace */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Marketplace Asal</label>
              <input
                value={form.original_marketplace}
                onChange={e => setForm(f => ({ ...f, original_marketplace: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
                placeholder="Shopee / Tokopedia / dll"
              />
            </div>
            {/* Consent Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Consent *</label>
              <input
                type="date"
                required
                value={form.customer_consent_date}
                onChange={e => setForm(f => ({ ...f, customer_consent_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
              />
            </div>
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status Awal</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ReviewStatus }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Isi Ulasan *</label>
            <textarea
              required
              rows={3}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
              placeholder="Tulis isi ulasan pelanggan..."
            />
          </div>

          {/* Consent Proof */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bukti Consent (URL screenshot / catatan)</label>
            <input
              value={form.consent_proof}
              onChange={e => setForm(f => ({ ...f, consent_proof: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40"
              placeholder="https://..."
            />
          </div>

          {/* Is Featured */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
              className="w-4 h-4 accent-[#7FB300]"
            />
            <span className="text-sm text-gray-700">Tampilkan di homepage (Featured)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#7FB300] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#6a9500] disabled:opacity-50 transition"
            >
              {saving ? 'Menyimpan...' : 'Simpan Testimoni'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }) }}
              className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${statusFilter === t.value ? 'bg-[#7FB300] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Memuat...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Tidak ada testimoni ditemukan</div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{review.customer_name}</span>
                    {review.customer_location && (
                      <span className="text-xs text-gray-400">{review.customer_location}</span>
                    )}
                    <StarRating rating={review.rating} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[review.status]}`}>
                      {review.status}
                    </span>
                    {review.is_featured && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  {review.products && (
                    <p className="text-xs text-[#7FB300] font-medium mb-1">{review.products.name}</p>
                  )}
                  {review.title && (
                    <p className="text-sm font-medium text-gray-800 mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2">{review.body}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>Sumber: {review.source}</span>
                    {review.original_marketplace && <span>• {review.original_marketplace}</span>}
                    <span>• Consent: {new Date(review.customer_consent_date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => handlePatch(review.id, { status: 'approved' })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition"
                    >
                      ✓ Setujui
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => handlePatch(review.id, { status: 'rejected' })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition"
                    >
                      ✗ Tolak
                    </button>
                  )}
                  <button
                    onClick={() => handlePatch(review.id, { is_featured: !review.is_featured })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${review.is_featured ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {review.is_featured ? '★ Unfeature' : '☆ Feature'}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 font-medium transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
