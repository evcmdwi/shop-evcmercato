'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import LeadList from './LeadList'
import DailyPerformance from './DailyPerformance'
import { FU_DAILY_TARGET, LEAD_LOCK_DAYS } from '@/lib/followup-target'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCode { code: string; name: string; is_active: boolean }

type Segment = 'unpaid' | 'repeat' | 'dormant' | 'new'

interface Candidate {
  user_id: string
  name: string | null
  email: string
  phone: string | null
  total_points: number
  member_since: string
  segment: Segment
  last_paid_at: string | null
  paid_count: number
  total_spent: number
  last_products: string | null
  last_unpaid_at: string | null
  lock_admin_code: string | null
  lock_expires_at: string | null
  last_followup_at: string | null
  last_followup_admin: string | null
  tier: 'silver' | 'gold' | 'platinum'
  vip_pct: number
}

interface ScoreRow {
  code: string
  name: string
  today_fu: number
  target_days: number
  streak: number
  followups: number
  customers_followed: number
  lead_followups: number
  leads_followed: number
  joins: number
  closing: number
  closing_followup: number
  closing_leads: number
  closing_dibuat: number
  closing_klaim: number
  omzet: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LAST_CODE_KEY = 'evc_admin_code'
const SHOP_URL = 'https://shop.evcmercato.com'

const SEGMENTS: { key: Segment; label: string; hint: string }[] = [
  { key: 'unpaid', label: '🛒 Belum Bayar', hint: 'Pesanan kedaluwarsa/batal ≤14 hari terakhir' },
  { key: 'repeat', label: '🔁 Waktunya Repeat', hint: 'Beli terakhir 30–60 hari lalu' },
  { key: 'dormant', label: '😴 Lama Tidak Belanja', hint: 'Beli terakhir > 60 hari lalu' },
  { key: 'new', label: '🆕 Member Baru', hint: 'Sudah daftar, belum pernah belanja' },
]

const TIER_BADGE: Record<string, string> = {
  gold: 'bg-amber-100 text-amber-800',
  platinum: 'bg-slate-800 text-white',
}

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n)
const daysAgo = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
const firstName = (n: string | null) => (n ?? '').trim().split(/\s+/)[0] || 'Kak'
const toWa = (phone: string) => {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? '62' + d.slice(1) : d
}

function messageFor(c: Candidate, adminName: string): string {
  const hi = `Halo Kak ${firstName(c.name)} 👋 Saya ${adminName} dari EVC Mercato.`
  const vip = c.vip_pct > 0 ? `\n\nSebagai Member VIP, Kakak otomatis dapat diskon ${c.vip_pct}% setiap belanja di web 💛` : ''
  const pts = c.total_points > 0 ? `\n\nOh iya, Kakak punya ${c.total_points} EVC Points yang bisa ditukar hadiah lho 🎁` : ''
  const close = `\n\nBisa langsung order di ${SHOP_URL} atau balas chat ini saja, nanti saya bantu buatkan pesanannya 😊`
  switch (c.segment) {
    case 'unpaid':
      return `${hi}\n\nKemarin pesanan Kakak belum sempat dibayar ya. Apakah ada kendala? Kalau masih berminat, saya bisa bantu buatkan link pembayaran baru 🙏${vip}${pts}`
    case 'repeat':
      return `${hi}\n\nGimana ${c.last_products ?? 'produknya'}, cocok Kak? Biasanya sekarang sudah mau habis nih 😊${vip}${pts}${close}`
    case 'dormant':
      return `${hi}\n\nSudah lama nggak belanja nih Kak, kami kangen 😊 Terakhir Kakak ambil ${c.last_products ?? 'produk kami'}. Mau stok lagi?${vip}${pts}${close}`
    case 'new':
      return `${hi}\n\nTerima kasih sudah daftar member EVC Mercato 🙏 Ada yang bisa saya bantu pilihkan produknya? Saya siap bantu jelaskan sesuai kebutuhan Kakak.${vip}${pts}${close}`
  }
}

function segmentInfo(c: Candidate): string {
  switch (c.segment) {
    case 'unpaid':
      return `Pesanan tidak dibayar ${daysAgo(c.last_unpaid_at!)} hari lalu`
    case 'repeat':
    case 'dormant':
      return `Beli terakhir ${daysAgo(c.last_paid_at!)} hari lalu · ${c.paid_count}× belanja · total ${rp(c.total_spent)}`
    case 'new':
      return `Daftar ${fmtDate(c.member_since)}`
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FollowUpPage() {
  const [tab, setTab] = useState<'list' | 'leads' | 'score'>('list')
  const [statsKey, setStatsKey] = useState(0)
  const [codes, setCodes] = useState<AdminCode[]>([])
  const [adminCode, setAdminCode] = useState('')

  useEffect(() => {
    fetch('/api/sambers/admin-codes').then(r => r.json()).then(({ codes }) => {
      const active = (codes ?? []).filter((c: AdminCode) => c.is_active)
      setCodes(active)
      let last = ''
      try { last = localStorage.getItem(LAST_CODE_KEY) ?? '' } catch {}
      if (active.some((c: AdminCode) => c.code === last)) setAdminCode(last)
    }).catch(() => {})
  }, [])

  const adminName = codes.find(c => c.code === adminCode)?.name ?? ''

  function chooseCode(code: string) {
    setAdminCode(code)
    try { localStorage.setItem(LAST_CODE_KEY, code) } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">📞 Follow Up</h1>
        <p className="text-sm text-slate-500">
          Member yang kamu follow up dipegang 7 hari, lead {LEAD_LOCK_DAYS} hari. Pesanan yang dibayar selama dipegang otomatis jadi closing kamu.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Saya admin</label>
          <select value={adminCode} onChange={e => chooseCode(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
            <option value="">Pilih kode admin…</option>
            {codes.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <Link href="/sambers/pesanan/kode-admin" className="text-xs text-[#7FB300] hover:underline pb-2.5">Kelola kode →</Link>
        <div className="ml-auto flex rounded-lg border border-slate-300 overflow-hidden text-sm">
          <button onClick={() => setTab('list')} className={`px-3 sm:px-4 py-2 ${tab === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}>Member</button>
          <button onClick={() => setTab('leads')} className={`px-3 sm:px-4 py-2 border-l border-slate-300 ${tab === 'leads' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}>Leads</button>
          <button onClick={() => setTab('score')} className={`px-3 sm:px-4 py-2 border-l border-slate-300 ${tab === 'score' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}>🏆 Skor</button>
        </div>
      </div>

      {adminCode && <TargetCard code={adminCode} refreshKey={statsKey} />}

      {tab === 'list' && <CandidateList adminCode={adminCode} adminName={adminName} onActivity={() => setStatsKey(k => k + 1)} />}
      {tab === 'leads' && <LeadList adminCode={adminCode} adminName={adminName} onActivity={() => setStatsKey(k => k + 1)} />}
      {tab === 'score' && <ScoreTab myCode={adminCode} />}
    </div>
  )
}

// ─── Daftar customer ──────────────────────────────────────────────────────────

function CandidateList({ adminCode, adminName, onActivity }: { adminCode: string; adminName: string; onActivity: () => void }) {
  const [rows, setRows] = useState<Candidate[] | null>(null)
  const [error, setError] = useState('')
  const [segment, setSegment] = useState<Segment>('repeat')
  const [q, setQ] = useState('')
  const [vipOnly, setVipOnly] = useState(false)
  const [active, setActive] = useState<Candidate | null>(null)

  useEffect(() => {
    fetch('/api/sambers/followups/candidates')
      .then(r => r.json())
      .then(json => { if (json.error) setError(json.error); else setRows(json.candidates) })
      .catch(() => setError('Gagal memuat daftar'))
  }, [])

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rows ?? []) m[r.segment] = (m[r.segment] ?? 0) + 1
    return m
  }, [rows])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const digits = term.replace(/\D/g, '')
    const filtered = (rows ?? []).filter(r =>
      r.segment === segment &&
      (!vipOnly || r.vip_pct > 0) &&
      (!term ||
        (r.name ?? '').toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        (digits.length >= 4 && (r.phone ?? '').replace(/\D/g, '').includes(digits)))
    )
    const t = (d: string | null) => (d ? new Date(d).getTime() : 0)
    return filtered.sort((a, b) =>
      segment === 'unpaid' ? t(b.last_unpaid_at) - t(a.last_unpaid_at)
      : segment === 'repeat' ? t(b.last_paid_at) - t(a.last_paid_at)
      : segment === 'dormant' ? b.total_spent - a.total_spent
      : t(b.member_since) - t(a.member_since))
  }, [rows, segment, q, vipOnly])

  function onFollowed(userId: string, code: string, expiresAt: string) {
    setRows(rs => (rs ?? []).map(r => r.user_id === userId
      ? { ...r, lock_admin_code: code, lock_expires_at: expiresAt, last_followup_at: new Date().toISOString(), last_followup_admin: code }
      : r))
  }

  if (error) return <p className="text-sm text-red-600">❌ {error}</p>
  if (!rows) return <p className="text-sm text-slate-400 animate-pulse">Memuat daftar customer…</p>

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SEGMENTS.map(s => (
          <button
            key={s.key}
            onClick={() => setSegment(s.key)}
            title={s.hint}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${segment === s.key ? 'bg-[#7FB300] border-[#7FB300] text-white font-semibold' : 'bg-white border-slate-300 text-slate-700'}`}
          >
            {s.label} <span className="opacity-80">({counts[s.key] ?? 0})</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{SEGMENTS.find(s => s.key === segment)?.hint}</p>
      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama, email, atau no. WA…" className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button
          onClick={() => setVipOnly(v => !v)}
          className={`shrink-0 px-3 py-2 rounded-lg text-sm border whitespace-nowrap ${vipOnly ? 'bg-yellow-100 border-yellow-300 text-yellow-800 font-semibold' : 'bg-white border-slate-300 text-slate-700'}`}
        >
          💛 VIP saja
        </button>
      </div>

      <ul className="space-y-2">
        {list.map(c => {
          const lockedByOther = !!c.lock_admin_code && c.lock_admin_code !== adminCode
          const lockedByMe = !!c.lock_admin_code && c.lock_admin_code === adminCode
          return (
            <li key={c.user_id} className={`bg-white rounded-xl border p-4 ${lockedByMe ? 'border-[#7FB300]' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold text-slate-900">
                    {c.name || c.email}
                    {c.vip_pct > 0 && <span className="ml-2 align-middle text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">💛 VIP {c.vip_pct}%</span>}
                    {c.tier !== 'silver' && <span className={`ml-1.5 align-middle text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TIER_BADGE[c.tier]}`}>{c.tier === 'gold' ? '🥇 Gold' : '💎 Platinum'}</span>}
                  </p>
                  <p className="text-xs text-slate-500">{c.phone || 'Tanpa no. WA'} · {c.email}</p>
                  <p className="text-sm text-slate-700 mt-1">{segmentInfo(c)}</p>
                  {c.last_products && c.segment !== 'new' && <p className="text-xs text-slate-500 mt-0.5">🛍️ {c.last_products}</p>}
                  {c.total_points > 0 && <p className="text-xs text-amber-700 mt-0.5">💎 {c.total_points} poin</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {c.lock_admin_code ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${lockedByMe ? 'bg-[#7FB300]/15 text-[#5c8200]' : 'bg-slate-100 text-slate-600'}`}>
                      🔒 {lockedByMe ? 'Kamu' : c.lock_admin_code} s.d. {fmtDate(c.lock_expires_at!)}
                    </span>
                  ) : c.last_followup_at && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">Terakhir di-FU {c.last_followup_admin} · {fmtDate(c.last_followup_at)}</span>
                  )}
                  <button
                    onClick={() => setActive(c)}
                    disabled={!adminCode || !c.phone || lockedByOther}
                    className="px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
                    title={!adminCode ? 'Pilih kode admin dulu' : lockedByOther ? `Sedang dipegang ${c.lock_admin_code}` : ''}
                  >
                    💬 {lockedByMe ? 'Follow Up Lagi' : 'Follow Up via WA'}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
        {!list.length && <li className="bg-white rounded-xl border border-slate-200 px-4 py-8 text-sm text-slate-500 text-center">Tidak ada customer di daftar ini 🎉</li>}
      </ul>
      {!adminCode && <p className="text-xs text-amber-700">Pilih kode admin di atas untuk mulai follow up.</p>}

      {active && (
        <FollowUpModal
          key={active.user_id}
          candidate={active}
          adminCode={adminCode}
          adminName={adminName}
          onClose={() => setActive(null)}
          onDone={(expiresAt) => { onFollowed(active.user_id, adminCode, expiresAt); setActive(null); onActivity() }}
        />
      )}
    </div>
  )
}

function FollowUpModal({ candidate, adminCode, adminName, onClose, onDone }: {
  candidate: Candidate
  adminCode: string
  adminName: string
  onClose: () => void
  onDone: (expiresAt: string) => void
}) {
  const [text, setText] = useState(() => messageFor(candidate, adminName))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    setBusy(true)
    setError('')
    // Buka tab dulu (sinkron dengan klik) supaya tidak diblokir popup blocker.
    const win = window.open('', '_blank')
    try {
      const res = await fetch('/api/sambers/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: candidate.user_id, admin_code: adminCode, segment: candidate.segment }),
      })
      const json = await res.json()
      if (!res.ok) {
        win?.close()
        setError(json.error ?? 'Gagal mencatat follow up')
        return
      }
      // api.whatsapp.com langsung: redirect wa.me merusak emoji jadi �
      const url = `https://api.whatsapp.com/send?phone=${toWa(candidate.phone!)}&text=${encodeURIComponent(text)}`
      if (win) win.location.href = url
      else window.location.href = url
      onDone(json.followup.expires_at)
    } catch {
      win?.close()
      setError('Terjadi kesalahan jaringan')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="font-semibold text-slate-900">Follow up {candidate.name || candidate.email}</h3>
          <p className="text-xs text-slate-500">{candidate.phone} · pesan bisa diedit sebelum dikirim</p>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={9} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <p className="text-xs text-slate-500">
          Customer ini akan dipegang <b>{adminCode}</b> selama 7 hari. Pesanan yang dibayar dalam 7 hari tercatat sebagai closing {adminCode}.
        </p>
        {error && <p className="text-sm text-red-600">❌ {error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold">Batal</button>
          <button onClick={send} disabled={busy || !text.trim()} className="flex-[2] py-3 rounded-xl bg-[#25D366] text-white font-semibold disabled:opacity-50">
            {busy ? '⏳…' : '💬 Buka WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Papan skor ───────────────────────────────────────────────────────────────

function currentMonth() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 7)
}

function ScoreTab({ myCode }: { myCode: string }) {
  const [view, setView] = useState<'daily' | 'monthly'>('daily')
  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm w-fit">
        <button onClick={() => setView('daily')} className={`px-4 py-1.5 ${view === 'daily' ? 'bg-[#7FB300] text-white font-semibold' : 'bg-white text-slate-700'}`}>📅 Harian</button>
        <button onClick={() => setView('monthly')} className={`px-4 py-1.5 border-l border-slate-300 ${view === 'monthly' ? 'bg-[#7FB300] text-white font-semibold' : 'bg-white text-slate-700'}`}>📊 Bulanan</button>
      </div>
      {view === 'daily' ? <DailyPerformance myCode={myCode} /> : <Scoreboard myCode={myCode} />}
    </div>
  )
}

// Target harian admin yang dipilih (member + leads, 1 orang dihitung sekali per hari).
function TargetCard({ code, refreshKey }: { code: string; refreshKey: number }) {
  const [row, setRow] = useState<ScoreRow | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/sambers/followups/scoreboard?month=${currentMonth()}`)
      .then(r => r.json())
      .then(json => { if (!cancelled) setRow((json.rows ?? []).find((r: ScoreRow) => r.code === code) ?? null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [code, refreshKey])

  if (!row) return null
  const pct = Math.min(100, Math.round((row.today_fu / FU_DAILY_TARGET) * 100))
  const reached = row.today_fu >= FU_DAILY_TARGET
  return (
    <div className={`rounded-xl border p-4 ${reached ? 'bg-[#7FB300]/10 border-[#7FB300]' : 'bg-white border-slate-200'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          {reached ? '🎯 Target hari ini tercapai!' : 'Target hari ini'}
        </p>
        <p className="text-sm"><b className="text-lg text-slate-900">{row.today_fu}</b><span className="text-slate-500">/{FU_DAILY_TARGET} FU</span></p>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-[#7FB300] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {row.streak > 0 && <span>🔥 {row.streak} hari berturut-turut</span>}
        <span>🎯 {row.target_days} hari capai target bulan ini</span>
        <span>👤 {row.joins} join</span>
        <span>🛒 {row.closing} closing</span>
      </div>
    </div>
  )
}

function Scoreboard({ myCode }: { myCode: string }) {
  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState<{ month: string; rows: ScoreRow[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/sambers/followups/scoreboard?month=${month}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json.error) setError(json.error)
        else { setError(''); setData(json) }
      })
      .catch(() => { if (!cancelled) setError('Gagal memuat papan skor') })
    return () => { cancelled = true }
  }, [month])

  const rows = data?.month === month ? data.rows : null
  const medal = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input type="month" value={month} max={currentMonth()} onChange={e => e.target.value && setMonth(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white" />
        <p className="text-xs text-slate-500">Omzet = total pesanan lunas tanpa ongkir</p>
      </div>
      {error && <p className="text-sm text-red-600">❌ {error}</p>}
      {!rows && !error && <p className="text-sm text-slate-400 animate-pulse">Memuat…</p>}
      {rows && (
        <ul className="space-y-2">
          {rows.map((r, i) => {
            const conv = r.customers_followed ? Math.round((r.closing_followup / r.customers_followed) * 100) : null
            const leadConv = r.leads_followed ? Math.round((r.joins / r.leads_followed) * 100) : null
            return (
              <li key={r.code} className={`bg-white rounded-xl border p-4 ${r.code === myCode ? 'border-[#7FB300]' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">{r.closing ? medal[i] ?? `${i + 1}` : '·'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900"><span className="font-mono">{r.code}</span> — {r.name}</p>
                    <p className="text-xs text-slate-500">
                      {r.closing_followup} follow up member · {r.closing_leads} dari leads · {r.closing_dibuat} buat pesanan · {r.closing_klaim} klaim
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#5c8200]">{rp(r.omzet)}</p>
                    <p className="text-xs text-slate-500">{r.closing} closing</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="font-bold text-slate-900">{r.customers_followed}</p>
                    <p className="text-xs text-slate-500">member di-FU · {conv === null ? '–' : `${conv}%`} closing</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="font-bold text-slate-900">{r.leads_followed}</p>
                    <p className="text-xs text-slate-500">lead di-FU</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="font-bold text-slate-900">{r.joins}</p>
                    <p className="text-xs text-slate-500">join member · {leadConv === null ? '–' : `${leadConv}%`}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="font-bold text-slate-900">{r.target_days}{r.streak > 0 && <span className="ml-1 text-sm">🔥{r.streak}</span>}</p>
                    <p className="text-xs text-slate-500">hari capai target {FU_DAILY_TARGET}</p>
                  </div>
                </div>
              </li>
            )
          })}
          {!rows.length && <li className="text-sm text-slate-500 text-center py-6">Belum ada data bulan ini</li>}
        </ul>
      )}
    </div>
  )
}
