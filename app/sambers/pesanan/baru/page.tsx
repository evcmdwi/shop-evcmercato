'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { useDebounce } from '@/hooks/useDebounce'
import { useLockedAdminCode } from '@/lib/admin-account-context'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCode { code: string; name: string; is_active: boolean }

interface Customer {
  id: string
  name: string | null
  email: string
  phone: string | null
  tier: string
  total_points: number
  special_discount_pct: number | null
  address: {
    recipient_name: string
    phone: string
    full_address: string
    district_id: string | null
    district: string | null
    regency_id: string | null
    city: string
    province_id: string | null
    province: string
  } | null
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image: string | null
  variants: { id: string; name: string; price: number; stock: number }[]
}

interface Option { key: string; product_id: string; variant_id: string | null; label: string; price: number; stock: number; image: string | null }
interface Line extends Option { quantity: number }

interface Region {
  district_id: string
  district_name: string
  regency_id: string
  regency_name: string
  province_id: string
  province_name: string
}

interface ShipMethod { method: 'reguler' | 'instan' | 'sameday'; label: string; base_rate: number | null; available: boolean; reason?: string }

interface Result { order_id: string; total: number; payment_url: string | null; wa_sent: boolean | null; link_error: string | null; sendLink: boolean }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n)
const LAST_CODE_KEY = 'evc_admin_code'
const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/40 focus:border-[#7FB300]'
const label = 'block text-xs font-semibold text-slate-600 mb-1'

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#7FB300] text-white text-xs flex items-center justify-center">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuatPesananPage() {
  const [codes, setCodes] = useState<AdminCode[]>([])
  const [pickedCode, setAdminCode] = useState('')
  const lockedCode = useLockedAdminCode()
  const adminCode = lockedCode ?? pickedCode

  // Pembeli
  const [member, setMember] = useState<Customer | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const [activeField, setActiveField] = useState<'name' | 'phone' | 'email' | null>(null)
  const [suggestions, setSuggestions] = useState<Customer[]>([])
  const debouncedSearch = useDebounce(search, 300)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Alamat
  const [recipient, setRecipient] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [region, setRegion] = useState<Region | null>(null)
  const [note, setNote] = useState('')

  // Paket
  const [products, setProducts] = useState<Product[]>([])
  const [productQuery, setProductQuery] = useState('')
  const [lines, setLines] = useState<Line[]>([])

  // Kiriman & pembayaran
  const [methods, setMethods] = useState<ShipMethod[]>([])
  const [method, setMethod] = useState<ShipMethod['method']>('reguler')
  const [discount, setDiscount] = useState(0)

  const [submitting, setSubmitting] = useState<'link' | 'save' | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    fetch('/api/sambers/admin-codes').then(r => r.json()).then(({ codes }) => {
      const active = (codes ?? []).filter((c: AdminCode) => c.is_active)
      setCodes(active)
      let last = ''
      try { last = localStorage.getItem(LAST_CODE_KEY) ?? '' } catch {}
      if (active.some((c: AdminCode) => c.code === last)) setAdminCode(last)
    }).catch(() => {})
    fetch('/api/sambers/buat-pesanan/products').then(r => r.json()).then(({ products }) => setProducts(products ?? [])).catch(() => {})
  }, [])

  // Autocomplete member
  useEffect(() => {
    if (member || debouncedSearch.trim().length < 2) return
    const ctrl = new AbortController()
    fetch(`/api/sambers/buat-pesanan/customers?q=${encodeURIComponent(debouncedSearch.trim())}`, { signal: ctrl.signal })
      .then(r => r.json()).then(({ customers }) => setSuggestions(customers ?? [])).catch(() => {})
    return () => ctrl.abort()
  }, [debouncedSearch, member])

  // Tarif kiriman per kecamatan
  useEffect(() => {
    if (!region) return
    fetch(`/api/shipping-rates/${region.district_id}`).then(r => r.json()).then(({ available_methods }) => {
      const list: ShipMethod[] = available_methods ?? []
      setMethods(list)
      setMethod(m => (list.find(x => x.method === m)?.available ? m : 'reguler'))
    }).catch(() => {})
  }, [region])

  function changeRegion(r: Region | null) {
    setRegion(r)
    if (!r) { setMethods([]); setMethod('reguler') }
  }

  function typeCustomer(field: 'name' | 'phone' | 'email', value: string) {
    if (field === 'name') setName(value)
    if (field === 'phone') setPhone(value)
    if (field === 'email') setEmail(value)
    setActiveField(field)
    setSearch(value)
  }

  function pickMember(c: Customer) {
    setMember(c)
    setName(c.name ?? '')
    setPhone(c.phone ?? '')
    setEmail(c.email)
    setSuggestions([])
    setActiveField(null)
    if (c.address) {
      setRecipient(c.address.recipient_name)
      setRecipientPhone(c.address.phone)
      setFullAddress(c.address.full_address)
      if (c.address.district_id) {
        setRegion({
          district_id: c.address.district_id,
          district_name: c.address.district ?? '',
          regency_id: c.address.regency_id ?? '',
          regency_name: c.address.city,
          province_id: c.address.province_id ?? '',
          province_name: c.address.province,
        })
      }
    }
  }

  function clearMember() {
    setMember(null)
    setName(''); setPhone(''); setEmail('')
    setRecipient(''); setRecipientPhone(''); setFullAddress(''); changeRegion(null)
    setDiscount(0)
  }

  // Pilihan paket: produk tanpa varian, atau tiap varian
  const options = useMemo<Option[]>(() => products.flatMap<Option>(p => p.variants.length
    ? p.variants.map(v => ({ key: `${p.id}:${v.id}`, product_id: p.id, variant_id: v.id, label: `${p.name} — ${v.name}`, price: v.price, stock: v.stock, image: p.image }))
    : [{ key: `${p.id}:`, product_id: p.id, variant_id: null, label: p.name, price: p.price, stock: p.stock, image: p.image }]
  ), [products])
  const filtered = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options
  }, [options, productQuery])

  function addLine(o: Option) {
    setLines(prev => {
      const found = prev.find(l => l.key === o.key)
      if (found) return prev.map(l => l.key === o.key ? { ...l, quantity: Math.min(l.quantity + 1, l.stock) } : l)
      return [...prev, { ...o, quantity: 1 }]
    })
  }
  function setQty(key: string, q: number) {
    setLines(prev => prev.flatMap(l => l.key !== key ? [l] : q <= 0 ? [] : [{ ...l, quantity: Math.min(q, l.stock, 99) }]))
  }

  const visibleSuggestions = member || debouncedSearch.trim().length < 2 ? [] : suggestions

  // Rincian (rumus sama dengan server)
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const baseRate = methods.find(m => m.method === method)?.base_rate ?? (method === 'reguler' ? 10000 : 0)
  const shipDiscount = subtotal >= 80000 ? 10000 : 0
  const shipCost = Math.max(0, baseRate - shipDiscount)
  const safeDiscount = Math.min(Math.max(0, discount), subtotal)
  const total = Math.max(0, subtotal + shipCost - safeDiscount)
  const vipPct = member?.special_discount_pct ?? 0
  const vipAmount = vipPct > 0 ? Math.round(subtotal * vipPct / 100) : 0

  async function submit(sendLink: boolean) {
    setError('')
    if (!adminCode) return setError('Pilih kode admin dulu')
    setSubmitting(sendLink ? 'link' : 'save')
    try {
      try { localStorage.setItem(LAST_CODE_KEY, adminCode) } catch {}
      const res = await fetch('/api/sambers/buat-pesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_code: adminCode,
          customer: { user_id: member?.id ?? null, name, phone, email },
          address: {
            recipient_name: recipient || name,
            phone: recipientPhone || phone,
            full_address: fullAddress,
            ...(region ?? {}),
          },
          items: lines.map(l => ({ product_id: l.product_id, variant_id: l.variant_id, quantity: l.quantity })),
          shipping_method: method,
          discount: safeDiscount,
          delivery_note: note,
          send_link: sendLink,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Gagal membuat pesanan'); return }
      setResult({ ...json, sendLink })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(null)
    }
  }

  function reset() {
    clearMember()
    setLines([]); setNote(''); setMethod('reguler'); setResult(null); setError('')
  }

  // ─── Hasil ───
  if (result) {
    const shortId = result.order_id.slice(0, 8).toUpperCase()
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-green-200 p-6 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <h1 className="text-xl font-bold text-slate-900">Pesanan #{shortId} dibuat</h1>
          <p className="text-slate-600">Total <strong>{rp(result.total)}</strong> · menunggu pembayaran</p>
          {result.payment_url && (
            <div className="text-left space-y-2">
              <p className={`text-sm ${result.wa_sent ? 'text-green-700' : 'text-amber-700'}`}>
                {result.wa_sent ? '📲 Link pembayaran sudah terkirim ke WA pembeli.' : '⚠️ WA gagal terkirim — salin link di bawah dan kirim manual.'}
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <span className="flex-1 truncate text-sm">{result.payment_url}</span>
                <button onClick={() => navigator.clipboard.writeText(result.payment_url!)} className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-white">Salin</button>
              </div>
            </div>
          )}
          {result.link_error && <p className="text-sm text-red-600">{result.link_error}</p>}
          {!result.sendLink && (
            <p className="text-sm text-slate-600 text-left bg-slate-50 rounded-lg p-3">
              Pesanan tersimpan tanpa link. Setelah pembeli transfer ke rekening BCA, buka detail pesanan lalu klik <strong>Tandai Lunas (Transfer BCA)</strong>.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/sambers/pesanan/${result.order_id}`} className="text-center py-3 rounded-xl font-semibold bg-[#7FB300] text-white hover:bg-[#6c9900]">Lihat Detail Pesanan</Link>
          <button onClick={reset} className="py-3 rounded-xl font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50">+ Buat Pesanan Lagi</button>
        </div>
      </div>
    )
  }

  const suggestionBox = (field: 'name' | 'phone' | 'email') =>
    activeField === field && visibleSuggestions.length > 0 && (
      <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-auto">
        {visibleSuggestions.map(c => (
          <li key={c.id}>
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pickMember(c)} className="w-full text-left px-3 py-2 hover:bg-[#7FB300]/10">
              <p className="text-sm font-medium text-slate-900">{c.name || '(tanpa nama)'} {(c.special_discount_pct ?? 0) > 0 && <span className="text-xs text-yellow-700">💛 VIP {c.special_discount_pct}%</span>}</p>
              <p className="text-xs text-slate-500">{c.phone || '—'} · {c.email}</p>
            </button>
          </li>
        ))}
      </ul>
    )

  const onFieldBlur = () => { blurTimer.current = setTimeout(() => setActiveField(null), 150) }
  const canSubmit = !!adminCode && !!name && !!phone && (!!member || !!email) && !!fullAddress && !!region && lines.length > 0

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 pb-32">
      <div className="flex items-center gap-3">
        <Link href="/sambers" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Buat Pesanan</h1>
          <p className="text-sm text-slate-500">Pesanan dari WA/telepon, dibuat oleh admin EVC</p>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className={label}>Kode admin pembuat pesanan *</label>
            <select value={adminCode} onChange={e => setAdminCode(e.target.value)} disabled={!!lockedCode} className={`${input} disabled:bg-slate-100`}>
              <option value="">— Pilih —</option>
              {codes.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <Link href="/sambers/pesanan/kode-admin" className="text-xs text-[#7FB300] hover:underline pb-2.5 whitespace-nowrap">Kelola kode →</Link>
        </div>
      </section>

      <Section n={1} title="Pembeli">
        {member ? (
          <div className="flex items-start justify-between gap-3 rounded-lg bg-[#7FB300]/10 border border-[#7FB300]/30 p-3">
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{member.name} <span className="text-xs font-medium text-[#5c8200]">✓ Member · {member.tier} · {member.total_points} poin</span></p>
              <p className="text-slate-600">{member.phone || '—'} · {member.email}</p>
              {vipPct > 0 && <p className="text-xs text-yellow-700 mt-1">💛 VIP — diskon {vipPct}%</p>}
            </div>
            <button onClick={clearMember} className="text-xs text-slate-500 hover:text-red-600 whitespace-nowrap">Ganti pembeli</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([['name', 'Nama *', name, 'text'], ['phone', 'No. WhatsApp *', phone, 'tel'], ['email', 'Email', email, 'email']] as const).map(([field, lbl, val, type]) => (
              <div key={field} className="relative">
                <label className={label}>{lbl}</label>
                <input
                  type={type}
                  value={val}
                  onChange={e => typeCustomer(field, e.target.value)}
                  onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setActiveField(field); setSearch(val) }}
                  onBlur={onFieldBlur}
                  className={input}
                  autoComplete="off"
                  placeholder={field === 'phone' ? '0812…' : field === 'email' ? 'wajib jika bukan member' : 'ketik untuk cari member'}
                />
                {suggestionBox(field)}
              </div>
            ))}
            <p className="md:col-span-3 text-xs text-slate-500">Ketik nama / WA / email — member yang cocok muncul di bawah kolom. Bukan member? Isi lengkap; akun member dibuat otomatis dari email.</p>
          </div>
        )}
      </Section>

      <Section n={2} title="Alamat Kirim">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={label}>Nama penerima</label>
            <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={name || 'sama dengan pembeli'} className={input} />
          </div>
          <div>
            <label className={label}>No. HP penerima</label>
            <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder={phone || 'sama dengan pembeli'} className={input} type="tel" />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Alamat lengkap *</label>
            <textarea value={fullAddress} onChange={e => setFullAddress(e.target.value)} rows={2} placeholder="Jalan, nomor rumah, RT/RW, kelurahan, patokan" className={input} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Kecamatan *</label>
            <AddressAutocomplete value={region} onChange={changeRegion} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Catatan untuk kurir</label>
            <input value={note} onChange={e => setNote(e.target.value)} className={input} placeholder="opsional" />
          </div>
        </div>
      </Section>

      <Section n={3} title="Paket / Produk">
        {lines.length > 0 && (
          <ul className="divide-y divide-slate-100 mb-4 border border-slate-200 rounded-lg">
            {lines.map(l => (
              <li key={l.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                <div className="basis-full sm:basis-auto sm:flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{l.label}</p>
                  <p className="text-xs text-slate-500">{rp(l.price)} · stok {l.stock}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(l.key, l.quantity - 1)} className="w-8 h-8 rounded border border-slate-300 hover:bg-slate-50">−</button>
                  <input value={l.quantity} onChange={e => setQty(l.key, parseInt(e.target.value) || 0)} className="w-12 h-8 text-center border border-slate-300 rounded text-sm" inputMode="numeric" />
                  <button onClick={() => setQty(l.key, l.quantity + 1)} disabled={l.quantity >= l.stock} className="w-8 h-8 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40">+</button>
                </div>
                <p className="ml-auto w-24 text-right text-sm font-semibold">{rp(l.price * l.quantity)}</p>
              </li>
            ))}
          </ul>
        )}
        <input value={productQuery} onChange={e => setProductQuery(e.target.value)} placeholder="Cari paket / produk…" className={input + ' mb-2'} />
        <ul className="max-h-64 overflow-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          {filtered.map(o => (
            <li key={o.key}>
              <button onClick={() => addLine(o)} disabled={o.stock <= 0} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#7FB300]/10 disabled:opacity-40 disabled:hover:bg-transparent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {o.image ? <img src={o.image} alt="" className="w-9 h-9 rounded object-cover bg-slate-100" /> : <span className="w-9 h-9 rounded bg-slate-100" />}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-slate-800">{o.label}</span>
                  <span className="block text-xs text-slate-500">{o.stock > 0 ? `stok ${o.stock}` : 'habis'}</span>
                </span>
                <span className="text-sm font-medium text-right whitespace-nowrap">{rp(o.price)}</span>
                <span className="text-[#7FB300] font-bold">+</span>
              </button>
            </li>
          ))}
          {!filtered.length && <li className="px-3 py-4 text-sm text-slate-500 text-center">Tidak ada produk</li>}
        </ul>
      </Section>

      <Section n={4} title="Jenis Kiriman">
        {!region ? (
          <p className="text-sm text-slate-500">Pilih kecamatan dulu untuk melihat pilihan kiriman.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {methods.map(m => (
              <label key={m.method} className={`rounded-lg border p-3 text-sm cursor-pointer ${method === m.method ? 'border-[#7FB300] bg-[#7FB300]/10' : 'border-slate-200'} ${!m.available ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <input type="radio" name="method" className="sr-only" disabled={!m.available} checked={method === m.method} onChange={() => setMethod(m.method)} />
                <p className="font-medium text-slate-900">{m.label}</p>
                <p className="text-xs text-slate-500">{m.available ? rp(m.base_rate ?? 0) : m.reason}</p>
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section n={5} title="Rincian Pembayaran">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Subtotal produk</dt><dd>{rp(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Ongkir ({method})</dt><dd>{rp(baseRate)}</dd></div>
          {shipDiscount > 0 && <div className="flex justify-between text-[#1D9E75]"><dt>Promo ongkir (belanja ≥ Rp80.000)</dt><dd>-{rp(Math.min(shipDiscount, baseRate))}</dd></div>}
          <div className="flex justify-between"><dt className="text-slate-500">Biaya layanan</dt><dd className="text-[#1D9E75]">Gratis</dd></div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Diskon dari admin</dt>
            <dd className="flex items-center gap-2">
              {vipAmount > 0 && discount !== vipAmount && (
                <button onClick={() => setDiscount(vipAmount)} className="text-xs text-yellow-700 underline whitespace-nowrap">pakai VIP {vipPct}% ({rp(vipAmount)})</button>
              )}
              <span className="text-slate-400">Rp</span>
              <input value={discount || ''} onChange={e => setDiscount(parseInt(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" placeholder="0" className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right" />
            </dd>
          </div>
          {discount > subtotal && <p className="text-xs text-red-600 text-right">Diskon maksimal {rp(subtotal)}</p>}
          <div className="flex justify-between pt-3 border-t border-slate-200">
            <dt className="font-semibold text-slate-900">Total pembayaran</dt>
            <dd className="font-bold text-lg text-[#7FB300]">{rp(total)}</dd>
          </div>
          <p className="text-xs text-slate-500 text-right">Pembeli dapat ±{Math.floor((subtotal - safeDiscount) / 1000)} EVC Points setelah lunas</p>
        </dl>
      </Section>

      {/* Tombol aksi menempel di bawah */}
      <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-auto md:w-full md:max-w-3xl md:mx-auto bg-white/95 backdrop-blur border-t border-slate-200 p-3 z-30 md:static md:bg-transparent md:border-0 md:p-0">
        {error && <p className="text-sm text-red-600 mb-2">❌ {error}</p>}
        <div className="grid grid-cols-2 gap-2 max-w-3xl mx-auto">
          <button onClick={() => submit(false)} disabled={!canSubmit || !!submitting} className="py-3 rounded-xl font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 text-sm">
            {submitting === 'save' ? '⏳ Menyimpan…' : '💾 Simpan Pesanan'}
            <span className="block text-[11px] font-normal text-slate-500">bayar transfer BCA</span>
          </button>
          <button onClick={() => submit(true)} disabled={!canSubmit || !!submitting || total < 1000} className="py-3 rounded-xl font-semibold bg-[#7FB300] text-white hover:bg-[#6c9900] disabled:opacity-40 text-sm">
            {submitting === 'link' ? '⏳ Membuat…' : '🔗 Buat & Kirim Link Bayar'}
            <span className="block text-[11px] font-normal text-white/80">{rp(total)} via WA</span>
          </button>
        </div>
      </div>
    </div>
  )
}
