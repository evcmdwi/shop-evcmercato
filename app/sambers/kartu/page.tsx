'use client'

import { useEffect, useRef, useState } from 'react'

// Sambers › Input Kartu Kredit: admin mencatat belanja yang memakai kartu kredit kantor.
// Data dikirim ke Findwi pemilik untuk diverifikasi (lihat app/api/sambers/kartu).

type Card = { id: string; label: string }
type Status = 'pending' | 'approved' | 'returned'
type Submission = {
  id: string
  txn_date: string
  merchant: string
  card: string
  amount: number
  type: 'kki' | 'non_kki'
  note: string | null
  status: Status
  return_reason: string | null
}

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date())
const tgl = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50 focus:border-[#7FB300]'

const STATUS: Record<Status, { label: string; cls: string }> = {
  pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Terverifikasi', cls: 'bg-green-100 text-green-800' },
  returned: { label: 'Dikembalikan', cls: 'bg-red-100 text-red-700' },
}

export default function InputKartuPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [max, setMax] = useState(0)
  const [history, setHistory] = useState<Submission[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState(today())
  const [cardId, setCardId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'kki' | 'non_kki' | ''>('')
  const [note, setNote] = useState('')
  const [suggest, setSuggest] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const clientId = useRef(crypto.randomUUID())

  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let alive = true
    fetch('/api/sambers/kartu', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Gagal memuat')
        return json
      })
      .then((json) => {
        if (!alive) return
        setCards(json.cards)
        setMax(json.max_amount)
        setHistory(json.submissions)
        setLoadError(null)
        setCardId((c) => c || (json.cards.length === 1 ? json.cards[0].id : ''))
      })
      .catch((e: Error) => alive && setLoadError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [reloadKey])

  // Saran "Dibayar ke" dari input admin ini sebelumnya.
  useEffect(() => {
    const q = merchant.trim()
    const t = setTimeout(() => {
      fetch(`/api/sambers/kartu?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => setSuggest((j.merchants ?? []).filter((m: string) => m !== merchant)))
        .catch(() => setSuggest([]))
    }, 250)
    return () => clearTimeout(t)
  }, [merchant])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!cardId) return setMsg({ ok: false, text: 'Pilih kartu kredit.' })
    if (!merchant.trim()) return setMsg({ ok: false, text: 'Isi "Dibayar ke".' })
    if (amount <= 0) return setMsg({ ok: false, text: 'Isi nominal.' })
    if (max && amount > max) return setMsg({ ok: false, text: `Nominal melebihi batas per transaksi (${rupiah(max)}).` })
    if (!type) return setMsg({ ok: false, text: 'Pilih jenis belanja.' })
    setSending(true)
    try {
      const res = await fetch('/api/sambers/kartu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_date: date, card_id: cardId, merchant: merchant.trim(), amount, type, note, client_id: clientId.current }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal mengirim')
      setMsg({ ok: true, text: `Terkirim: ${merchant.trim()} ${rupiah(amount)} — menunggu verifikasi pemilik.` })
      clientId.current = crypto.randomUUID()
      setMerchant('')
      setAmount(0)
      setType('')
      setNote('')
      setReloadKey((k) => k + 1)
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🧾 Input Kartu Kredit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Catat setiap belanja yang memakai kartu kredit kantor. Data dikirim ke pemilik untuk diverifikasi.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="k-date" className="block text-sm font-medium text-gray-700 mb-1">Tanggal transaksi</label>
            <input id="k-date" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="k-card" className="block text-sm font-medium text-gray-700 mb-1">Kartu kredit</label>
            <select id="k-card" value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputCls} disabled={loading}>
              <option value="">{loading ? 'Memuat…' : cards.length ? 'Pilih kartu…' : 'Belum ada kartu yang diizinkan'}</option>
              {cards.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="k-to" className="block text-sm font-medium text-gray-700 mb-1">Dibayar ke</label>
          <input id="k-to" value={merchant} onChange={(e) => setMerchant(e.target.value)} maxLength={120} autoComplete="off"
            placeholder="KKI Nusantara, Lion Parcel, Toko ATK…" className={inputCls} />
          {suggest.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggest.map((m) => (
                <button key={m} type="button" onClick={() => setMerchant(m)}
                  className="min-h-9 rounded-full border border-gray-200 px-3 text-sm text-gray-700 hover:border-[#7FB300]">{m}</button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">Saran diambil dari input Anda sebelumnya saja.</p>
        </div>

        <div>
          <label htmlFor="k-amt" className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">Rp</span>
            <input id="k-amt" type="text" inputMode="numeric" value={amount ? amount.toLocaleString('id-ID') : ''} placeholder="0"
              onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)} className={`${inputCls} pl-10`} />
          </div>
          {max > 0 && <p className="text-xs text-gray-400 mt-1">Maksimal {rupiah(max)} per transaksi.</p>}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">Jenis belanja</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([['kki', 'Belanja produk KKI', 'Restock produk untuk dijual'], ['non_kki', 'Di luar KKI', 'Ongkir, ATK, dan lainnya']] as const).map(([v, l, d]) => (
              <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${type === v ? 'border-[#7FB300] bg-[#7FB300]/10' : 'border-gray-200'}`}>
                <input type="radio" name="jenis" value={v} checked={type === v} onChange={() => setType(v)} className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{l}</span>
                  <span className="block text-xs text-gray-500">{d}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="k-note" className="block text-sm font-medium text-gray-700 mb-1">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
          <input id="k-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Untuk Natesh Bali" className={inputCls} />
        </div>

        {msg && (
          <div role="status" className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>
        )}

        <button type="submit" disabled={sending || loading || !cards.length}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#7FB300] text-white font-semibold disabled:opacity-50">
          {sending ? 'Mengirim…' : 'Kirim untuk verifikasi'}
        </button>
        <p className="text-xs text-gray-400">
          Admin hanya melihat kartu yang diizinkan dan dua jenis belanja. Saldo, tagihan, dan transaksi lain tidak ditampilkan.
        </p>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Input saya</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">{loading ? 'Memuat…' : 'Belum ada input.'}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((h) => (
              <li key={h.id} className="py-3 flex items-start gap-3">
                <span className="w-14 shrink-0 text-sm text-gray-500">{tgl(h.txn_date)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">{h.merchant}</div>
                  <div className="text-xs text-gray-500">
                    {h.card} · {h.type === 'kki' ? 'Belanja produk KKI' : 'Di luar KKI'}{h.note ? ` · ${h.note}` : ''}
                  </div>
                  {h.status === 'returned' && h.return_reason && (
                    <div className="text-xs text-red-700 mt-0.5">Alasan: {h.return_reason}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{rupiah(h.amount)}</div>
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[h.status].cls}`}>{STATUS[h.status].label}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
