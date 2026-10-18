'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HERO_BANNER_MAX_BYTES,
  HERO_BANNER_SIZES,
  HERO_MAX_SLIDES,
  LINK_TYPES,
  bannerHref,
  bannerStatus,
  formatWita,
  isoToWitaInput,
  witaInputToIso,
  type BannerLinkType,
  type BannerStatus,
  type HeroBanner,
  type HeroSettings,
} from '@/lib/hero-banners'

interface Option { name: string; slug: string }

const STATUS_CLS: Record<BannerStatus, string> = {
  Aktif: 'bg-green-100 text-green-700',
  Terjadwal: 'bg-blue-100 text-blue-700',
  Berakhir: 'bg-gray-100 text-gray-500',
  Nonaktif: 'bg-red-50 text-red-500',
}

const LINK_LABEL: Record<BannerLinkType, string> = {
  product: 'Produk', // lama — tidak bisa dipilih lagi
  category: 'Kategori',
  internal: 'URL internal',
  whatsapp: 'WhatsApp admin',
}

export default function BannerHeroPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [settings, setSettings] = useState<HeroSettings | null>(null)
  const [categories, setCategories] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<HeroBanner | 'new' | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/sambers/banners')
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(d.error ?? 'Gagal memuat banner')
    } else {
      setError(null)
      setBanners(d.banners ?? [])
      setSettings(d.settings)
      setCategories(d.categories ?? [])
    }
    setLoading(false)
  }, [])

  // Muat pertama kali — setState hanya di dalam callback async (aturan react-hooks).
  const loadRef = useRef(load)
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) loadRef.current() })
    return () => { cancelled = true }
  }, [])

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= banners.length) return
    const next = [...banners]
    ;[next[i], next[j]] = [next[j], next[i]]
    setBanners(next)
    setBusy(true)
    await fetch('/api/sambers/banners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map((b) => b.id) }),
    })
    setBusy(false)
    load()
  }

  const toggle = async (b: HeroBanner) => {
    setBanners((list) => list.map((x) => (x.id === b.id ? { ...x, is_active: !b.is_active } : x)))
    await fetch(`/api/sambers/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !b.is_active }),
    })
    load()
  }

  const remove = async (b: HeroBanner) => {
    if (!confirm(`Hapus banner "${b.title}"? Banner langsung hilang dari beranda.`)) return
    await fetch(`/api/sambers/banners/${b.id}`, { method: 'DELETE' })
    load()
  }

  // Banner aktif yang benar-benar tampil (maks 5, urut dari atas).
  const liveIds = new Set(banners.filter((b) => bannerStatus(b) === 'Aktif').slice(0, HERO_MAX_SLIDES).map((b) => b.id))

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tampilan Toko</p>
          <h1 className="text-2xl font-bold text-slate-800">🖼️ Banner Hero</h1>
          <p className="text-slate-500 text-sm mt-1">
            Carousel di bagian atas beranda. Maksimal {HERO_MAX_SLIDES} banner aktif tampil, urut dari atas.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/?preview_banners=1"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#7FB300] text-[#7FB300] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#E8F4D1]"
          >
            Pratinjau
          </a>
          <button
            onClick={() => setEditing('new')}
            className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#6B9700]"
          >
            + Tambah Banner
          </button>
        </div>
      </div>

      {settings && <SettingsCard settings={settings} onSaved={load} />}

      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🖼️</div>
          <h3 className="font-semibold text-slate-700 mb-2">Belum ada banner</h3>
          <p className="text-sm text-slate-400 mb-6">Beranda menampilkan kartu sambutan saja, seperti biasa.</p>
          <button onClick={() => setEditing('new')} className="bg-[#7FB300] text-white px-4 py-2 rounded-xl text-sm font-semibold">
            + Tambah Banner
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-3 text-left">Urutan</th>
                <th className="px-3 py-3 text-left">Banner</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">Periode (WITA)</th>
                <th className="px-3 py-3 text-right">Klik</th>
                <th className="px-3 py-3 text-left">Aktif</th>
                <th className="px-3 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.map((b, i) => {
                const st = bannerStatus(b)
                return (
                  <tr key={b.id} className="hover:bg-gray-50 align-middle">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-5 text-sm text-slate-400">{i + 1}</span>
                        <button
                          disabled={i === 0 || busy}
                          onClick={() => move(i, -1)}
                          aria-label="Naikkan"
                          className="h-7 w-7 rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-100"
                        >▲</button>
                        <button
                          disabled={i === banners.length - 1 || busy}
                          onClick={() => move(i, 1)}
                          aria-label="Turunkan"
                          className="h-7 w-7 rounded-lg border border-gray-200 text-xs disabled:opacity-30 hover:bg-gray-100"
                        >▼</button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.image_mobile_url} alt="" className="h-12 w-[72px] shrink-0 rounded-lg object-cover bg-gray-100" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-800">{b.title}</div>
                          <div className="truncate text-xs text-slate-400 max-w-[220px]">
                            {LINK_LABEL[b.link_type]} → {bannerHref(b)}
                          </div>
                          {!b.image_desktop_url && <div className="text-[11px] text-amber-600">Tanpa gambar desktop</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[st]}`}>{st}</span>
                      {st === 'Aktif' && !liveIds.has(b.id) && (
                        <div className="mt-1 text-[11px] text-amber-600">Tidak tampil (melebihi {HERO_MAX_SLIDES} banner)</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {b.starts_at || b.ends_at ? (
                        <>
                          <div>Mulai: {b.starts_at ? formatWita(b.starts_at) : 'langsung'}</div>
                          <div>Selesai: {b.ends_at ? formatWita(b.ends_at) : 'tanpa batas'}</div>
                        </>
                      ) : (
                        'Tanpa jadwal'
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-slate-700">{b.click_count.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3">
                      <button
                        role="switch"
                        aria-checked={b.is_active}
                        aria-label={`Aktifkan ${b.title}`}
                        onClick={() => toggle(b)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${b.is_active ? 'bg-[#7FB300]' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${b.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1 text-center">
                        <button onClick={() => setEditing(b)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50">Edit</button>
                        <a
                          href={`/?preview_banners=1&banner=${b.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50"
                        >
                          Pratinjau
                        </a>
                        <button onClick={() => remove(b)} className="text-xs border border-red-200 text-red-500 rounded-lg px-2 py-1 hover:bg-red-50">Hapus</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <BannerForm
          banner={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function SettingsCard({ settings, onSaved }: { settings: HeroSettings; onSaved: () => void }) {
  const [interval, setIntervalSec] = useState(settings.intervalSeconds)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const dirty = interval !== settings.intervalSeconds

  const save = async () => {
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/sambers/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_interval_seconds: interval }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    setMsg(res.ok ? 'Tersimpan ✓' : d.error ?? 'Gagal menyimpan')
    if (res.ok) onSaved()
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <span className="text-sm font-semibold text-slate-700">Pengaturan carousel</span>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        Geser otomatis tiap
        <select
          value={interval}
          onChange={(e) => setIntervalSec(Number(e.target.value))}
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
        >
          {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n} detik</option>)}
        </select>
      </label>
      <button
        onClick={save}
        disabled={!dirty || saving}
        className="rounded-xl bg-[#7FB300] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {saving ? 'Menyimpan…' : 'Simpan'}
      </button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  )
}

function BannerForm({
  banner,
  categories,
  onClose,
  onSaved,
}: {
  banner: HeroBanner | null
  categories: Option[]
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(banner?.title ?? '')
  const [mobile, setMobile] = useState(banner?.image_mobile_url ?? '')
  const [desktop, setDesktop] = useState(banner?.image_desktop_url ?? '')
  const [bgColor, setBgColor] = useState(banner?.bg_color ?? '')
  const [alt, setAlt] = useState(banner?.alt_text ?? '')
  const [linkType, setLinkType] = useState<BannerLinkType>(banner?.link_type ?? 'category')
  const [linkValue, setLinkValue] = useState(banner?.link_value ?? '')
  const [startsAt, setStartsAt] = useState(isoToWitaInput(banner?.starts_at ?? null))
  const [endsAt, setEndsAt] = useState(isoToWitaInput(banner?.ends_at ?? null))
  const [active, setActive] = useState(banner?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!mobile) return setError('Gambar mobile wajib diupload')
    setSaving(true)
    const res = await fetch(banner ? `/api/sambers/banners/${banner.id}` : '/api/sambers/banners', {
      method: banner ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        image_mobile_url: mobile,
        image_desktop_url: desktop || null,
        bg_color: bgColor || null,
        alt_text: alt,
        link_type: linkType,
        link_value: linkValue,
        starts_at: witaInputToIso(startsAt),
        ends_at: witaInputToIso(endsAt),
        is_active: active,
      }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return setError(d.error ?? 'Gagal menyimpan')
    onSaved()
  }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]'
  const label = 'block text-sm font-semibold text-slate-700 mb-1'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      // File yang dilepas di luar kotak upload tidak boleh membuka gambar di tab (isi form hilang).
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <form onSubmit={save} className="my-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{banner ? 'Edit Banner' : 'Tambah Banner'}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-2xl leading-none text-slate-400 hover:text-slate-700">×</button>
        </div>

        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Isi gambar menjadi tanggung jawab admin: <strong>tanpa klaim medis/penyakit</strong>, tanpa logo resmi
          Shopee/Tokopedia/KKI tanpa izin, dan belum boleh menjanjikan diskon harga.
        </div>

        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="b-title">Judul internal <span className="text-red-500">*</span></label>
            <input id="b-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={input} placeholder="mis. Natesh Night — Oktober" />
            <p className="mt-1 text-xs text-slate-400">Tidak tampil ke pembeli.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ImageInput label="Gambar mobile" required kind="mobile" value={mobile} onChange={setMobile} />
            <ImageInput label="Gambar desktop" kind="desktop" value={desktop} onChange={setDesktop} />
          </div>

          {!desktop && (
            <div>
              <label className={label} htmlFor="b-bg">Warna latar desktop</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor || '#E8F1EC'}
                  onChange={(e) => setBgColor(e.target.value.toUpperCase())}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-200"
                  aria-label="Pilih warna latar"
                />
                <input id="b-bg" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={`${input} max-w-[140px]`} placeholder="#E8F1EC" />
              </div>
              <p className="mt-1 text-xs text-slate-400">Tanpa gambar desktop, gambar mobile tampil utuh di tengah dengan warna latar ini.</p>
            </div>
          )}

          <div>
            <label className={label} htmlFor="b-alt">Teks alternatif (alt) <span className="text-red-500">*</span></label>
            <input id="b-alt" required value={alt} onChange={(e) => setAlt(e.target.value)} className={input} placeholder="Jelaskan isi gambar, mis. Natesh Night pembalut malam 35 cm" />
          </div>

          <div>
            <span className={label}>Link tujuan <span className="text-red-500">*</span></span>
            <div className="mb-2 flex flex-wrap gap-2">
              {LINK_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setLinkType(t); setLinkValue('') }}
                  className={`rounded-xl border px-3 py-1.5 text-sm ${linkType === t ? 'border-[#7FB300] bg-[#E8F4D1] font-semibold text-[#5B8400]' : 'border-gray-200 text-slate-600'}`}
                >
                  {LINK_LABEL[t]}
                </button>
              ))}
            </div>
            {linkType === 'category' && (
              <select required value={linkValue} onChange={(e) => setLinkValue(e.target.value)} className={input} aria-label="Kategori tujuan">
                <option value="">— Pilih kategori —</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            )}
            {linkType === 'internal' && (
              <input required value={linkValue} onChange={(e) => setLinkValue(e.target.value)} className={input} placeholder="/katalog?q=natesh" aria-label="URL internal" />
            )}
            {linkType === 'whatsapp' && (
              <input value={linkValue} onChange={(e) => setLinkValue(e.target.value)} className={input} placeholder="Pesan awal (opsional), mis. Halo admin, saya mau tanya promo Natesh" aria-label="Pesan awal WhatsApp" />
            )}
            <p className="mt-1 text-xs text-slate-400">Tujuan: {bannerHref({ link_type: linkType, link_value: linkValue })}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={label} htmlFor="b-start">Mulai tayang (WITA)</label>
              <input id="b-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={input} />
              <p className="mt-1 text-xs text-slate-400">Kosong = langsung tayang.</p>
            </div>
            <div>
              <label className={label} htmlFor="b-end">Selesai tayang (WITA)</label>
              <input id="b-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={input} />
              <p className="mt-1 text-xs text-slate-400">Kosong = tanpa batas.</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[#7FB300]" />
            Aktif
          </label>
        </div>

        {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Batal</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-[#7FB300] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ImageInput({
  label,
  kind,
  required,
  value,
  onChange,
}: {
  label: string
  kind: 'mobile' | 'desktop'
  required?: boolean
  value: string
  onChange: (url: string) => void
}) {
  const size = HERO_BANNER_SIZES[kind]
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploading) setDragging(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDragging(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) pick(file)
  }

  const pick = async (file: File) => {
    setError(null)
    setWarning(null)
    if (!INPUT_TYPES.includes(file.type)) return setError('Format harus PNG, JPG, atau WebP.')
    if (file.size > INPUT_MAX_BYTES) return setError(`File ${(file.size / 1024 / 1024).toFixed(1)} MB — maksimal 20 MB.`)
    const dims = await imageSize(file).catch(() => null)
    if (dims) {
      const want = size.width / size.height
      const got = dims.width / dims.height
      if (Math.abs(got - want) / want > 0.05) {
        setWarning(`Rasio gambar ${dims.width}×${dims.height} tidak sesuai ${size.width}×${size.height} — sebagian gambar bisa terpotong.`)
      } else if (dims.width < size.width * 0.75) {
        setWarning(`Gambar ${dims.width}×${dims.height} lebih kecil dari ${size.width}×${size.height} — bisa terlihat buram.`)
      }
    }
    setUploading(true)
    // JPG/WebP ≤500 KB & tidak lebih besar dari ukuran banner → diupload apa adanya.
    // Selain itu (PNG dari AI, file besar) → dikecilkan & diubah ke WebP di browser.
    let upload: File = file
    const fitsAsIs = file.type !== 'image/png' && file.size <= HERO_BANNER_MAX_BYTES && (!dims || dims.width <= size.width)
    if (!fitsAsIs) {
      const converted = await toBannerWebp(file, size.width).catch(() => null)
      if (!converted) {
        setUploading(false)
        return setError('Gambar gagal diproses. Coba simpan ulang sebagai JPG.')
      }
      if (converted.size > HERO_BANNER_MAX_BYTES) {
        setUploading(false)
        return setError(`Setelah dikompres masih ${Math.round(converted.size / 1024)} KB — maksimal 500 KB. Coba gambar yang lebih sederhana.`)
      }
      upload = converted
    }
    const fd = new FormData()
    fd.append('file', upload)
    const res = await fetch('/api/sambers/banners/upload', { method: 'POST', body: fd })
    const d = await res.json().catch(() => ({}))
    setUploading(false)
    if (!res.ok) return setError(d.error ?? 'Upload gagal')
    onChange(d.url)
  }

  return (
    <div>
      <span className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : <span className="font-normal text-slate-400">(opsional)</span>}
      </span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        disabled={uploading}
        title={value ? 'Klik atau tarik gambar baru ke sini untuk mengganti' : 'Klik atau tarik gambar ke sini'}
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center text-xs transition-colors ${
          dragging ? 'border-[#7FB300] bg-[#E8F4D1] text-[#5B8400]' : 'border-gray-200 bg-gray-50 text-slate-400 hover:border-[#7FB300]'
        } ${uploading ? 'cursor-wait' : 'cursor-pointer'} ${kind === 'mobile' ? 'aspect-[3/2]' : 'aspect-[3/1]'}`}
      >
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={`absolute inset-0 h-full w-full object-cover ${dragging ? 'opacity-40' : ''}`} />
        )}
        {uploading ? (
          <span className="relative rounded bg-white/80 px-2 py-1 text-slate-600">Mengupload…</span>
        ) : dragging ? (
          <span className="relative rounded bg-white/80 px-2 py-1 font-semibold">Lepas untuk upload</span>
        ) : (
          !value && (
            <span className="px-3">
              <span className="block text-lg">⬆️</span>
              Tarik &amp; lepas gambar ke sini
              <span className="block text-slate-400">atau klik untuk pilih</span>
            </span>
          )
        )}
      </button>
      <p className="mt-1 text-xs text-slate-500">
        Disarankan <strong>{size.width} × {size.height} px</strong> · PNG/JPG/WebP (otomatis dikompres ≤500 KB) ·{' '}
        <a href={`/templates/banner-${kind}-${size.width}x${size.height}.png`} download className="text-[#5B8400] underline">template</a>
      </p>
      {value && !required && (
        <button type="button" onClick={() => onChange('')} className="mt-1 text-xs text-red-500 hover:underline">Hapus gambar desktop</button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {warning && <p className="mt-1 text-xs text-amber-600">⚠️ {warning}</p>}
      <input
        ref={ref}
        type="file"
        accept={INPUT_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) pick(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

const INPUT_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const INPUT_MAX_BYTES = 20 * 1024 * 1024

/**
 * Kecilkan ke lebar banner (tanpa memperbesar) & ubah ke WebP; kualitas diturunkan
 * bertahap sampai ≤500 KB. Browser tanpa encoder WebP (Safari lama) → JPEG.
 */
async function toBannerWebp(file: File, maxWidth: number): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.fillStyle = '#FFFFFF' // PNG transparan → latar putih (JPEG tak punya alpha)
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const encode = (type: string, q: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q))
  let type = 'image/webp'
  let blob: Blob | null = null
  for (const q of [0.86, 0.78, 0.7, 0.6, 0.5]) {
    blob = await encode(type, q)
    if (blob && blob.type !== type) {
      type = 'image/jpeg'
      blob = await encode(type, q)
    }
    if (blob && blob.size <= HERO_BANNER_MAX_BYTES) break
  }
  if (!blob) throw new Error('encode')
  const ext = type === 'image/webp' ? 'webp' : 'jpg'
  return new File([blob], `banner.${ext}`, { type })
}

function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load'))
    }
    img.src = url
  })
}
