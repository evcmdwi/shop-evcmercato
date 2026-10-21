'use client'

import { useEffect, useMemo, useState } from 'react'
import { LEAD_LOCK_DAYS, LEAD_MAX_ATTEMPTS, LEAD_MEMBER_LOCK_DAYS, LEAD_RETRY_DAYS } from '@/lib/followup-target'

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadResult = 'replied' | 'interested' | 'no_reply' | 'not_interested' | 'invalid'

interface Lead {
  id: string
  nama: string
  phone: string
  phone_norm: string
  kota: string | null
  interest: string | null
  notes: string | null
  status: string
  created_at: string
  attempts: number
  last_fu_at: string | null
  last_fu_admin: string | null
  last_result: LeadResult | null
  last_fu_id: string | null
  lock_admin_code: string | null
  lock_expires_at: string | null
}

type Filter = 'fresh' | 'retry' | 'interested' | 'mine'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SHOP_URL = 'https://shop.evcmercato.com'
const PAGE = 50

const FILTERS: { key: Filter; label: string; hint: string }[] = [
  { key: 'fresh', label: '🆕 Belum di-FU', hint: 'Lead yang belum pernah dihubungi admin mana pun' },
  { key: 'retry', label: '🔁 FU Ulang', hint: `Belum dibalas ≥${LEAD_RETRY_DAYS} hari, maksimal ${LEAD_MAX_ATTEMPTS}× follow up` },
  { key: 'interested', label: '⭐ Tertarik', hint: 'Sudah menyatakan tertarik — segera daftarkan jadi member' },
  { key: 'mine', label: '🔒 Pegangan Saya', hint: `Lead yang sedang kamu pegang (${LEAD_LOCK_DAYS} hari sejak FU terakhir)` },
]

const RESULTS: { key: LeadResult; label: string; cls: string }[] = [
  { key: 'replied', label: '💬 Dibalas', cls: 'border-sky-300 text-sky-700' },
  { key: 'interested', label: '⭐ Tertarik', cls: 'border-emerald-300 text-emerald-700' },
  { key: 'no_reply', label: '⏳ Belum dibalas', cls: 'border-slate-300 text-slate-600' },
  { key: 'not_interested', label: '🙅 Tidak tertarik', cls: 'border-rose-300 text-rose-700' },
  { key: 'invalid', label: '📵 Nomor salah', cls: 'border-rose-300 text-rose-700' },
]
const RESULT_LABEL = Object.fromEntries(RESULTS.map(r => [r.key, r.label])) as Record<LeadResult, string>

const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })
const firstName = (n: string | null) => {
  const w = (n ?? '').trim().split(/\s+/)[0] ?? ''
  return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : 'Kak'
}
const toWa = (phone: string) => {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? '62' + d.slice(1) : d
}
// api.whatsapp.com langsung: redirect wa.me merusak emoji jadi �
const waUrl = (phone: string, text: string) => `https://api.whatsapp.com/send?phone=${toWa(phone)}&text=${encodeURIComponent(text)}`

function messageFor(l: Lead, adminName: string): string {
  const hi = `Halo Kak ${firstName(l.nama)} 👋 Saya ${adminName} dari EVC Mercato.`
  if (l.attempts > 0) {
    return `${hi}\n\nMau tanya Kak, pesan saya sebelumnya sudah sempat dibaca? 😊 Kalau Kakak berminat, saya bisa bantu daftarkan jadi member EVC Mercato (gratis) dan pilihkan produk yang cocok.\n\nDitunggu kabarnya ya Kak 🙏`
  }
  const interest = l.interest ? `\n\nKakak pernah tertarik dengan *${l.interest}* ya.` : ''
  return `${hi}${interest}\n\nSekarang EVC Mercato sudah punya toko online resmi di ${SHOP_URL} 🛍️ Belanja di sana gratis biaya admin, ada promo ongkir, dan setiap belanja dapat EVC Points yang bisa ditukar hadiah 🎁\n\nKalau Kakak mau, saya bantu daftarkan jadi member ya — cukup balas dengan *nama & email* Kakak, gratis 😊`
}

function loginMessage(name: string, email: string, password: string, adminName: string) {
  return `Halo Kak ${firstName(name)} 🎉 Akun member EVC Mercato Kakak sudah jadi!\n\nLogin di: ${SHOP_URL}/login\nEmail: ${email}\nPassword: ${password}\n\nPassword bisa diganti kapan saja lewat menu Lupa Password. Setiap belanja dapat EVC Points yang bisa ditukar hadiah 🎁\n\nKalau mau dibantu pilih produk atau dibuatkan pesanan, balas chat ini saja ya Kak 😊\n\n— ${adminName}, EVC Mercato`
}

function inFilter(l: Lead, f: Filter, me: string): boolean {
  const lockedByOther = !!l.lock_admin_code && l.lock_admin_code !== me
  switch (f) {
    case 'fresh':
      return l.attempts === 0 && !l.lock_admin_code
    case 'retry':
      return l.attempts > 0 && l.attempts < LEAD_MAX_ATTEMPTS && l.status === 'contacted' && !lockedByOther &&
        (l.last_result === 'no_reply' || l.last_result === null) &&
        Date.now() - new Date(l.last_fu_at!).getTime() >= LEAD_RETRY_DAYS * 86400000
    case 'interested':
      return l.status === 'interested'
    case 'mine':
      return !!me && l.lock_admin_code === me
  }
}

// ─── Daftar leads ─────────────────────────────────────────────────────────────

export default function LeadList({ adminCode, adminName, onActivity }: {
  adminCode: string
  adminName: string
  onActivity: () => void
}) {
  const [rows, setRows] = useState<Lead[] | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('fresh')
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [fuTarget, setFuTarget] = useState<Lead | null>(null)
  const [regTarget, setRegTarget] = useState<Lead | null>(null)
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    fetch('/api/sambers/lead-followups/candidates')
      .then(r => r.json())
      .then(json => { if (json.error) setError(json.error); else setRows(json.leads) })
      .catch(() => setError('Gagal memuat leads'))
  }, [])

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rows ?? []) for (const f of FILTERS) if (inFilter(r, f.key, adminCode)) m[f.key] = (m[f.key] ?? 0) + 1
    return m
  }, [rows, adminCode])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const digits = term.replace(/\D/g, '')
    const filtered = (rows ?? []).filter(r =>
      inFilter(r, filter, adminCode) &&
      (!term ||
        r.nama.toLowerCase().includes(term) ||
        (r.kota ?? '').toLowerCase().includes(term) ||
        (r.interest ?? '').toLowerCase().includes(term) ||
        (digits.length >= 4 && r.phone_norm.includes(digits)))
    )
    const t = (d: string | null) => (d ? new Date(d).getTime() : 0)
    // Belum di-FU: yang punya minat produk dulu, lalu terbaru. Lainnya: FU terakhir paling lama dulu.
    return filtered.sort((a, b) =>
      filter === 'fresh'
        ? Number(!!b.interest) - Number(!!a.interest) || t(b.created_at) - t(a.created_at)
        : t(a.last_fu_at) - t(b.last_fu_at))
  }, [rows, filter, q, adminCode])

  const patch = (id: string, p: Partial<Lead>) => setRows(rs => (rs ?? []).map(r => (r.id === id ? { ...r, ...p } : r)))
  const remove = (id: string) => setRows(rs => (rs ?? []).filter(r => r.id !== id))

  async function saveResult(l: Lead, result: LeadResult) {
    if (!l.last_fu_id) return
    setBusyId(l.id)
    try {
      const res = await fetch(`/api/sambers/lead-followups/${l.last_fu_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, admin_code: adminCode }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error ?? 'Gagal menyimpan hasil'); return }
      if (result === 'not_interested' || result === 'invalid') remove(l.id)
      else patch(l.id, { last_result: result, status: result === 'interested' ? 'interested' : 'contacted' })
    } finally {
      setBusyId('')
    }
  }

  if (error) return <p className="text-sm text-red-600">❌ {error}</p>
  if (!rows) return <p className="text-sm text-slate-400 animate-pulse">Memuat leads…</p>

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setShown(PAGE) }}
            title={f.hint}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${filter === f.key ? 'bg-[#7FB300] border-[#7FB300] text-white font-semibold' : 'bg-white border-slate-300 text-slate-700'}`}
          >
            {f.label} <span className="opacity-80">({counts[f.key] ?? 0})</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{FILTERS.find(f => f.key === filter)?.hint}</p>
      <input value={q} onChange={e => { setQ(e.target.value); setShown(PAGE) }} placeholder="Cari nama, kota, minat, atau no. WA…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />

      <ul className="space-y-2">
        {list.slice(0, shown).map(l => {
          const lockedByOther = !!l.lock_admin_code && l.lock_admin_code !== adminCode
          const lockedByMe = !!adminCode && l.lock_admin_code === adminCode
          return (
            <li key={l.id} className={`bg-white rounded-xl border p-4 ${lockedByMe ? 'border-[#7FB300]' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold text-slate-900">
                    {l.nama}
                    {l.status === 'interested' && <span className="ml-2 align-middle text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">⭐ Tertarik</span>}
                  </p>
                  <p className="text-xs text-slate-500">{l.phone_norm}{l.kota && ` · ${l.kota}`}</p>
                  {l.interest && <p className="text-sm text-slate-700 mt-1">🛍️ Minat: {l.interest}</p>}
                  {l.attempts > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      FU {l.attempts}/{LEAD_MAX_ATTEMPTS} · terakhir {l.last_fu_admin} {fmtDate(l.last_fu_at!)}
                      {l.last_result && ` · ${RESULT_LABEL[l.last_result]}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {l.lock_admin_code && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${lockedByMe ? 'bg-[#7FB300]/15 text-[#5c8200]' : 'bg-slate-100 text-slate-600'}`}>
                      🔒 {lockedByMe ? 'Kamu' : l.lock_admin_code} s.d. {fmtDate(l.lock_expires_at!)}
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    {lockedByMe && (
                      <button onClick={() => setRegTarget(l)} className="px-3 py-2 rounded-lg border border-[#7FB300] text-[#5c8200] text-sm font-semibold whitespace-nowrap">
                        👤 Daftarkan
                      </button>
                    )}
                    <button
                      onClick={() => setFuTarget(l)}
                      disabled={!adminCode || lockedByOther}
                      className="px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
                      title={!adminCode ? 'Pilih kode admin dulu' : lockedByOther ? `Sedang dipegang ${l.lock_admin_code}` : ''}
                    >
                      💬 {l.attempts > 0 ? 'FU Lagi' : 'FU via WA'}
                    </button>
                  </div>
                </div>
              </div>
              {lockedByMe && l.last_fu_id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Hasil follow up:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {RESULTS.map(r => (
                      <button
                        key={r.key}
                        disabled={busyId === l.id}
                        onClick={() => saveResult(l, r.key)}
                        className={`px-2.5 py-1 rounded-full text-xs border disabled:opacity-50 ${l.last_result === r.key ? 'bg-slate-800 border-slate-800 text-white font-semibold' : `bg-white ${r.cls}`}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          )
        })}
        {!list.length && <li className="bg-white rounded-xl border border-slate-200 px-4 py-8 text-sm text-slate-500 text-center">Tidak ada lead di daftar ini 🎉</li>}
      </ul>
      {list.length > shown && (
        <button onClick={() => setShown(s => s + PAGE)} className="w-full py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700">
          Tampilkan lagi ({list.length - shown} lead)
        </button>
      )}
      {!adminCode && <p className="text-xs text-amber-700">Pilih kode admin di atas untuk mulai follow up.</p>}

      {fuTarget && (
        <LeadFollowUpModal
          key={fuTarget.id}
          lead={fuTarget}
          adminCode={adminCode}
          adminName={adminName}
          onClose={() => setFuTarget(null)}
          onDone={fu => {
            patch(fuTarget.id, {
              attempts: fuTarget.attempts + 1,
              last_fu_at: fu.created_at,
              last_fu_admin: adminCode,
              last_fu_id: fu.id,
              last_result: null,
              lock_admin_code: adminCode,
              lock_expires_at: fu.expires_at,
              status: fuTarget.status === 'new' ? 'contacted' : fuTarget.status,
            })
            setFuTarget(null)
            onActivity()
          }}
        />
      )}
      {regTarget && (
        <RegisterModal
          key={regTarget.id}
          lead={regTarget}
          adminCode={adminCode}
          adminName={adminName}
          onClose={() => setRegTarget(null)}
          onRegistered={() => { remove(regTarget.id); onActivity() }}
        />
      )}
    </div>
  )
}

// ─── Modal FU via WA ──────────────────────────────────────────────────────────

function LeadFollowUpModal({ lead, adminCode, adminName, onClose, onDone }: {
  lead: Lead
  adminCode: string
  adminName: string
  onClose: () => void
  onDone: (fu: { id: string; created_at: string; expires_at: string }) => void
}) {
  const [text, setText] = useState(() => messageFor(lead, adminName))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/sambers/lead-followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, admin_code: adminCode, message: text }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Gagal mengirim follow up')
        return
      }
      onDone(json.followup)
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="font-semibold text-slate-900">Follow up {lead.nama}</h3>
          <p className="text-xs text-slate-500">{lead.phone_norm} · pesan bisa diedit, terkirim otomatis via WA sistem</p>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={10} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <p className="text-xs text-slate-500">
          Lead ini dipegang <b>{adminCode}</b> selama {LEAD_LOCK_DAYS} hari. Setelah chat, jangan lupa catat hasilnya. Kalau dia mau, klik <b>👤 Daftarkan</b> — Join tercatat untuk {adminCode}.
        </p>
        {error && <p className="text-sm text-red-600">❌ {error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold">Batal</button>
          <button onClick={send} disabled={busy || !text.trim()} className="flex-[2] py-3 rounded-xl bg-[#25D366] text-white font-semibold disabled:opacity-50">
            {busy ? '⏳ Mengirim…' : '💬 Kirim WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Daftarkan Member ───────────────────────────────────────────────────

function RegisterModal({ lead, adminCode, adminName, onClose, onRegistered }: {
  lead: Lead
  adminCode: string
  adminName: string
  onClose: () => void
  onRegistered: () => void
}) {
  const [form, setForm] = useState({ name: lead.nama.trim(), phone: lead.phone_norm, email: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ email: string; phone: string; password: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/sambers/leads/${lead.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, admin_code: adminCode }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Gagal mendaftarkan member'); return }
      setDone({ email: json.email, phone: json.phone, password: json.password })
      onRegistered()
    } catch {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        {done ? (
          <>
            <h3 className="font-semibold text-slate-900">🎉 {form.name} sudah jadi member!</h3>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 space-y-0.5">
              <p>Email: <b>{done.email}</b></p>
              <p>Password: <b>{done.password}</b></p>
            </div>
            <p className="text-xs text-slate-500">
              Join tercatat untuk <b>{adminCode}</b>. Belanja pertamanya dalam {LEAD_MEMBER_LOCK_DAYS} hari otomatis jadi closing {adminCode}.
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold">Tutup</button>
              <a
                href={waUrl(done.phone, loginMessage(form.name, done.email, done.password, adminName))}
                target="_blank"
                rel="noreferrer"
                className="flex-[2] py-3 rounded-xl bg-[#25D366] text-white font-semibold text-center"
              >
                💬 Kirim Info Login
              </a>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <h3 className="font-semibold text-slate-900">👤 Daftarkan jadi Member</h3>
              <p className="text-xs text-slate-500">Member login dengan email ini dan password awal <b>123456</b>.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">No. WA</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required inputMode="tel" className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="email dari customer" className={input} />
            </div>
            {error && <p className="text-sm text-red-600">❌ {error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold">Batal</button>
              <button type="submit" disabled={busy} className="flex-[2] py-3 rounded-xl bg-[#7FB300] text-white font-semibold disabled:opacity-50">
                {busy ? '⏳…' : 'Daftarkan Member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
