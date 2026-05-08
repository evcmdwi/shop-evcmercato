'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AffiliateData {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | null
  affiliate_code: string | null
  full_name_kkd: string | null
  kki_member_id: string | null
  applied_at: string | null
  rejected_reason: string | null
  suspended_reason: string | null
}

interface AffiliateStats {
  lifetime_pv: number
  pending_pv: number
  total_clicks: number
  total_members: number
}

interface AffiliateLink {
  short_code: string
  type: string
  click_count: number
  created_at: string
}

interface Settlement {
  period_label: string
  valid_pv: number
  pending_pv: number
  orders: Array<{ id: string; amount: number; pv: number; status: string }>
}

interface Product {
  id: string
  name: string
  slug: string
}

type ViewState =
  | 'loading'
  | 'not_applied'
  | 'applying'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'

type ApprovedTab = 'generate' | 'performance' | 'members' | 'settlement'

type LinkTarget = 'homepage' | 'product' | 'category'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i + 1 === current
                ? 'bg-[#7FB300] text-white'
                : i + 1 < current
                ? 'bg-[#7FB300]/30 text-[#7FB300]'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i + 1 < current ? 'bg-[#7FB300]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <p className="ml-2 text-sm text-gray-500">
        Langkah {current} dari {total}
      </p>
    </div>
  )
}

// ─── Apply Form ───────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  'instagram',
  'tiktok',
  'facebook',
  'whatsapp_status',
  'youtube',
  'telegram',
  'website',
  'other',
]

interface Channel {
  platform: string
  url: string
}

interface ApplyFormProps {
  onSuccess: () => void
}

function ApplyForm({ onSuccess }: ApplyFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [check1, setCheck1] = useState(false)
  const [check2, setCheck2] = useState(false)
  const [check3, setCheck3] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([{ platform: 'instagram', url: '' }])

  const addChannel = () =>
    setChannels((prev) => [...prev, { platform: 'instagram', url: '' }])
  const updateChannel = (idx: number, field: keyof Channel, val: string) =>
    setChannels((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c)))
  const removeChannel = (idx: number) =>
    setChannels((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const fullName = (data.get('fullName') as string ?? '').trim()
    const kkiId = (data.get('kkiId') as string ?? '').trim()
    const sponsor = (data.get('sponsor') as string ?? '').trim()
    const whatsapp = (data.get('whatsapp') as string ?? '').trim()
    const email = (data.get('email') as string ?? '').trim()

    if (!fullName || !kkiId || !sponsor) {
      setError('Nama lengkap, ID Member KKI, dan nama sponsor wajib diisi')
      return
    }
    if (!whatsapp || !email) {
      setError('No WhatsApp dan Email wajib diisi')
      return
    }
    if (!check1 || !check2 || !check3) {
      setError('Centang semua persetujuan untuk melanjutkan')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name_kkd: fullName, kki_member_id: kkiId, director_leader: sponsor, whatsapp, email, channels, agreement_kki_ethics: check1, agreement_no_medical_claim: check2, agreement_terms: check3 }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error ?? 'Gagal mengirim pengajuan')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      {/* Identitas KKI */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Identitas KKI</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nama Lengkap (sesuai KKI) <span className="text-red-500">*</span></label>
            <input name="fullName" type="text" autoComplete="name" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Nama sesuai kartu KKI" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">ID Member KKI <span className="text-red-500">*</span></label>
            <input name="kkiId" type="text" autoComplete="off" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Contoh: KKI-12345678" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Director/Leader Sponsor <span className="text-red-500">*</span></label>
            <input name="sponsor" type="text" autoComplete="off" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="Nama sponsor Anda" />
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Kontak */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Kontak</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">No WhatsApp <span className="text-red-500">*</span></label>
            <input name="whatsapp" type="tel" autoComplete="tel" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
            <input name="email" type="email" autoComplete="email" required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
              placeholder="email@anda.com" />
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Channel Promosi */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Channel Promosi</h2>
        <div className="space-y-2">
          {channels.map((ch, idx) => (
            <div key={idx} className="flex gap-2">
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
                value={ch.platform}
                onChange={(e) => updateChannel(idx, 'platform', e.target.value)}
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.replace('_', ' ')}</option>
                ))}
              </select>
              <input
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
                value={ch.url}
                onChange={(e) => updateChannel(idx, 'url', e.target.value)}
                placeholder="URL / username"
              />
              {channels.length > 1 && (
                <button type="button" onClick={() => removeChannel(idx)} className="text-red-400 hover:text-red-600 px-2">✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addChannel} className="mt-2 text-sm text-[#7FB300] font-semibold hover:underline">
          + Tambah Channel
        </button>
      </div>

      <hr className="border-gray-100" />

      {/* Persetujuan */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Persetujuan</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-[#7FB300]" checked={check1} onChange={(e) => setCheck1(e.target.checked)} />
          <span className="text-sm text-gray-600">Saya berkomitmen mematuhi etika bisnis KKI Group</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-[#7FB300]" checked={check2} onChange={(e) => setCheck2(e.target.checked)} />
          <span className="text-sm text-gray-600">Saya tidak akan membuat klaim kesehatan/medis dalam promosi</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-4 h-4 accent-[#7FB300]" checked={check3} onChange={(e) => setCheck3(e.target.checked)} />
          <span className="text-sm text-gray-600">
            Saya menyetujui{' '}
            <Link href="/syarat-ketentuan" className="text-[#7FB300] underline" target="_blank">Syarat & Ketentuan</Link>{' '}
            program affiliate EVC
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#7FB300] text-white py-3 rounded-xl font-semibold hover:bg-[#6B9700] disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
      </button>
    </form>
  )
}

// ─── Generate Link Tab ────────────────────────────────────────────────────────

function GenerateLinkTab({ affiliateCode }: { affiliateCode: string }) {
  const [target, setTarget] = useState<LinkTarget>('homepage')
  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchProducts = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!q.trim()) { setProducts([]); return }
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=10`)
        const data = await res.json()
        setProducts(data?.products ?? data ?? [])
      } catch {
        setProducts([])
      }
    }, 400)
  }, [])

  useEffect(() => {
    searchProducts(productSearch)
  }, [productSearch, searchProducts])

  const handleGenerate = async () => {
    setGenerating(true)
    setResult(null)
    try {
      const payload: Record<string, string> = { type: target }
      if (target === 'product' && selectedProduct) {
        payload.product_id = selectedProduct.id
        payload.product_slug = selectedProduct.slug
      }
      const res = await fetch('/api/affiliate/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Gagal generate link')
      setResult(data.short_url ?? data.url ?? '')
    } catch (e) {
      setResult(null)
      alert(e instanceof Error ? e.message : 'Error')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareWA = () => {
    if (!result) return
    const text = encodeURIComponent(`Belanja produk KKI terbaik via EVC Mercato: ${result}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-5">
      {/* Radio target */}
      <div>
        <p className="text-sm text-gray-600 mb-2 font-medium">Tujuan Link</p>
        <div className="flex gap-3">
          {(['homepage', 'product', 'category'] as LinkTarget[]).map((t) => (
            <label
              key={t}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors text-sm ${
                target === t
                  ? 'border-[#7FB300] bg-[#f8fce8] text-[#7FB300] font-semibold'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <input
                type="radio"
                className="hidden"
                checked={target === t}
                onChange={() => { setTarget(t); setResult(null); setSelectedProduct(null) }}
              />
              {t === 'homepage' ? 'Homepage' : t === 'product' ? 'Produk' : 'Kategori'}
            </label>
          ))}
        </div>
      </div>

      {/* Product search */}
      {target === 'product' && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Cari Produk</p>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50"
            placeholder="Ketik nama produk..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          {products.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
              {products.map((p) => (
                <button type="button"
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setProducts([]); setProductSearch(p.name) }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-[#f8fce8] transition-colors ${
                    selectedProduct?.id === p.id ? 'bg-[#f8fce8] font-semibold' : ''
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {selectedProduct && (
            <p className="text-xs text-[#7FB300] mt-1">✓ Produk dipilih: {selectedProduct.name}</p>
          )}
        </div>
      )}

      <button type="button"
        onClick={handleGenerate}
        disabled={generating || (target === 'product' && !selectedProduct)}
        className={`w-full py-3 rounded-xl font-semibold transition-colors ${
          !generating && !(target === 'product' && !selectedProduct)
            ? 'bg-[#7FB300] text-white hover:bg-[#6B9700]'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {generating ? 'Generating...' : 'Generate Link'}
      </button>

      {result && (
        <div className="bg-[#f8fce8] rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Link Affiliate Anda:</p>
          <p className="font-mono text-sm text-[#7FB300] break-all mb-3">{result}</p>
          <div className="flex gap-2">
            <button type="button"
              onClick={handleCopy}
              className="flex-1 border border-[#7FB300] text-[#7FB300] py-2 rounded-lg text-sm font-semibold hover:bg-[#7FB300] hover:text-white transition-colors"
            >
              {copied ? '✓ Tersalin!' : 'Salin Link'}
            </button>
            <button type="button"
              onClick={shareWA}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              Share WA
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Kode affiliate: <span className="font-mono font-semibold">{affiliateCode}</span>
      </p>
    </div>
  )
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab() {
  const [links, setLinks] = useState<AffiliateLink[]>([])

  useEffect(() => {
    fetch('/api/affiliate/links')
      .then((r) => r.json())
      .then((d) => setLinks(d?.links ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-xl p-4 text-center text-sm text-amber-700">
        Data performa akan tersedia setelah ada klik pertama
      </div>
      {links.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Link Anda</p>
          {links.map((l) => (
            <div
              key={l.short_code}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex justify-between items-center text-sm"
            >
              <div>
                <p className="font-mono text-[#7FB300]">{l.short_code}</p>
                <p className="text-xs text-gray-400">{l.type} · {formatDate(l.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{l.click_count}</p>
                <p className="text-xs text-gray-400">klik</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab() {
  return (
    <div className="text-center py-8 text-gray-500">
      <div className="text-4xl mb-3">👥</div>
      <p>Belum ada member yang mendaftar via link Anda</p>
    </div>
  )
}

// ─── Settlement Tab ───────────────────────────────────────────────────────────

function SettlementTab() {
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/affiliate/settlement/current')
      .then((r) => r.json())
      .then((d) => setSettlement(d?.settlement ?? d ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return <div className="text-center py-8 text-gray-400 text-sm">Memuat data settlement...</div>

  if (!settlement)
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-3">📊</div>
        <p>Belum ada data settlement</p>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="bg-[#f8fce8] rounded-xl p-4">
        <p className="text-sm text-gray-500">{settlement.period_label}</p>
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-2xl font-bold text-[#7FB300]">{settlement.valid_pv}</p>
            <p className="text-xs text-gray-500">Valid PV</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{settlement.pending_pv}</p>
            <p className="text-xs text-gray-500">Pending PV</p>
          </div>
        </div>
      </div>

      {settlement.orders?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Transaksi</p>
          {settlement.orders.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex justify-between items-center text-sm"
            >
              <div>
                <p className="text-xs text-gray-500">#{o.id.slice(-8)}</p>
                <p className="text-xs text-gray-400">
                  Rp {o.amount.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#7FB300]">+{o.pv} PV</p>
                <p className="text-xs text-gray-400">{o.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  userId: string
  userEmail: string
}

export default function AffiliateDashboard({ userId: _userId, userEmail: _userEmail }: Props) {
  const [view, setView] = useState<ViewState>('loading')
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [stats, setStats] = useState<AffiliateStats>({
    lifetime_pv: 0,
    pending_pv: 0,
    total_clicks: 0,
    total_members: 0,
  })
  const [activeTab, setActiveTab] = useState<ApprovedTab>('generate')

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/status')
      const data = await res.json()
      const aff: AffiliateData = data?.affiliate ?? data ?? null

      if (!aff || aff.status === null) {
        setView('not_applied')
      } else {
        setAffiliate(aff)
        setView(aff.status as ViewState)
        if (aff.status === 'approved') {
          const statsRes = await fetch('/api/affiliate/stats')
          const statsData = await statsRes.json()
          setStats(statsData?.stats ?? statsData ?? {
            lifetime_pv: 0,
            pending_pv: 0,
            total_clicks: 0,
            total_members: 0,
          })
        }
      }
    } catch {
      setView('not_applied')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="animate-spin text-3xl mb-3">⚙️</div>
        <p className="text-sm">Memuat data affiliate...</p>
      </div>
    )
  }

  // ── Back link ─────────────────────────────────────────────────────────────
  const BackLink = () => (
    <a href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
      ← Dashboard
    </a>
  )

  // ── NOT_APPLIED ────────────────────────────────────────────────────────────
  if (view === 'not_applied') {
    return (
      <div>
        <BackLink />
        <div className="text-center py-12">
          <h1 className="font-display text-3xl text-gray-900 mb-3">Program Affiliate EVC</h1>
          <p className="text-gray-500 mb-8">
            Promosikan produk KKI dan dapatkan PV untuk membership KKI Anda
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#f8fce8] rounded-xl p-5 text-left">
              <div className="text-2xl mb-2">🔗</div>
              <h3 className="font-semibold text-gray-900 mb-1">Link Unik</h3>
              <p className="text-sm text-gray-500">Generate short link untuk produk apapun</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-5 text-left">
              <div className="text-2xl mb-2">💎</div>
              <h3 className="font-semibold text-gray-900 mb-1">Dapat PV KKI</h3>
              <p className="text-sm text-gray-500">Setiap pembelian via link Anda = PV ke akun KKI</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-5 text-left">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-900 mb-1">Bangun Network</h3>
              <p className="text-sm text-gray-500">Member yang daftar via link Anda jadi referral permanent</p>
            </div>
          </div>

          <button type="button"
            onClick={() => setView('applying')}
            className="bg-[#7FB300] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#6B9700] transition-colors"
          >
            Ajukan Sekarang
          </button>
        </div>
      </div>
    )
  }

  // ── APPLYING ───────────────────────────────────────────────────────────────
  if (view === 'applying') {
    return (
      <div>
        <button type="button"
          onClick={() => setView('not_applied')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Kembali
        </button>
        <h1 className="font-display text-2xl text-gray-900 mb-6">Daftar Affiliate EVC</h1>
        <ApplyForm onSuccess={() => { setView('pending'); fetchStatus() }} />
      </div>
    )
  }

  // ── PENDING ────────────────────────────────────────────────────────────────
  if (view === 'pending') {
    return (
      <div>
        <BackLink />
        <div className="text-center py-10">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-display text-2xl text-gray-900 mb-2">Pengajuan Sedang Direview</h2>
          <p className="text-gray-500 mb-4">Tim EVC akan menghubungi Anda dalam 1-3 hari kerja</p>
          <div className="bg-gray-50 rounded-xl p-4 text-left max-w-sm mx-auto text-sm text-gray-600 space-y-1">
            <div><strong>Nama KKI:</strong> {affiliate?.full_name_kkd ?? '-'}</div>
            <div><strong>ID KKI:</strong> {affiliate?.kki_member_id ?? '-'}</div>
            <div><strong>Dikirim:</strong> {formatDate(affiliate?.applied_at ?? null)}</div>
          </div>
        </div>
      </div>
    )
  }

  // ── REJECTED ───────────────────────────────────────────────────────────────
  if (view === 'rejected') {
    return (
      <div>
        <BackLink />
        <div className="text-center py-10">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="font-display text-2xl text-gray-900 mb-2">Pengajuan Tidak Disetujui</h2>
          <p className="text-gray-500 mb-4">{affiliate?.rejected_reason}</p>
          <button type="button"
            onClick={() => setView('applying')}
            className="bg-[#7FB300] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6B9700] transition-colors"
          >
            Ajukan Ulang
          </button>
        </div>
      </div>
    )
  }

  // ── SUSPENDED ──────────────────────────────────────────────────────────────
  if (view === 'suspended') {
    return (
      <div>
        <BackLink />
        <div className="text-center py-10">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl mb-2">Akun Affiliate Disuspend</h2>
          <p className="text-gray-500">{affiliate?.suspended_reason}</p>
          <p className="text-xs text-gray-400 mt-2">Hubungi admin untuk informasi lebih lanjut</p>
        </div>
      </div>
    )
  }

  // ── APPROVED ───────────────────────────────────────────────────────────────
  const tabs: { key: ApprovedTab; label: string }[] = [
    { key: 'generate', label: 'Generate Link' },
    { key: 'performance', label: 'Performa' },
    { key: 'members', label: 'Member Saya' },
    { key: 'settlement', label: 'Settlement' },
  ]

  return (
    <div>
      <BackLink />
      <h1 className="font-display text-2xl text-gray-900 mb-4">Dashboard Affiliate</h1>

      {/* Code header */}
      <div className="bg-[#f8fce8] rounded-2xl p-5 mb-6">
        <p className="text-sm text-gray-500">Affiliate Code Anda</p>
        <p className="font-display text-3xl text-[#7FB300] font-bold">
          {affiliate?.affiliate_code ?? '-'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total PV" value={stats.lifetime_pv} />
        <StatCard label="Pending PV" value={stats.pending_pv} />
        <StatCard label="Total Klik" value={stats.total_clicks} />
        <StatCard label="Total Member" value={stats.total_members} />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button type="button"
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 min-w-max px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'text-[#7FB300] border-b-2 border-[#7FB300] bg-[#f8fce8]/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'generate' && (
            <GenerateLinkTab affiliateCode={affiliate?.affiliate_code ?? ''} />
          )}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'settlement' && <SettlementTab />}
        </div>
      </div>
    </div>
  )
}
