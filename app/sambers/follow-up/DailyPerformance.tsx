'use client'

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Kind = 'fu_member' | 'fu_lead' | 'join' | 'order' | 'closing'

interface DailyRow {
  code: string
  name: string
  fu_total: number
  fu_member: number
  fu_lead: number
  results: Record<string, number>
  joins: number
  orders_created: number
  closing: number
  omzet: number
  first_at: string | null
  last_at: string | null
  history: { date: string; fu: number }[]
  timeline: { at: string; kind: Kind; label: string; detail: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n)
// Jam tampil WITA (admin di Balikpapan); pergantian hari tetap 00.00 WIB seperti papan skor.
const hhmm = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
const dayLabel = (d: string) => new Date(d + 'T12:00:00+07:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })

const KIND: Record<Kind, { icon: string; text: string }> = {
  fu_member: { icon: '📞', text: 'FU member' },
  fu_lead: { icon: '🎯', text: 'FU lead' },
  join: { icon: '👤', text: 'Daftarkan member' },
  order: { icon: '📝', text: 'Buat pesanan' },
  closing: { icon: '🛒', text: 'Closing' },
}

const DETAIL: Record<string, string> = {
  repeat: 'waktunya repeat',
  dormant: 'lama tidak belanja',
  unpaid: 'belum bayar',
  new: 'member baru',
  replied: 'dibalas',
  interested: 'tertarik',
  no_reply: 'belum dibalas',
  not_interested: 'tidak tertarik',
  invalid: 'nomor salah',
  followup: 'dari follow up',
  klaim: 'klaim',
  pending: 'menunggu bayar',
  paid: 'lunas',
  processed: 'diproses',
  shipped: 'dikirim',
  delivered: 'diterima',
  expired: 'kedaluwarsa',
  cancelled: 'batal',
}

const RESULT_LABEL: [string, string][] = [
  ['replied', '💬 Dibalas'],
  ['interested', '⭐ Tertarik'],
  ['no_reply', '⏳ Belum dibalas'],
  ['not_interested', '🙅 Tidak tertarik'],
  ['invalid', '📵 Nomor salah'],
]

// ─── Performa harian ──────────────────────────────────────────────────────────

export default function DailyPerformance({ myCode, reloadKey, onLoaded }: { myCode: string; reloadKey: number; onLoaded: (ok: boolean) => void }) {
  const [date, setDate] = useState(today)
  const [data, setData] = useState<{ date: string; target: number; rows: DailyRow[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/sambers/followups/daily?date=${date}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json.error) setError(json.error)
        else setError('')
        if (!json.error) setData(json)
        onLoaded(!json.error)
      })
      .catch(() => { if (!cancelled) { setError('Gagal memuat performa harian'); onLoaded(false) } })
    return () => { cancelled = true }
  }, [date, reloadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data?.date === date ? data.rows : null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input type="date" value={date} max={today()} onChange={e => e.target.value && setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white" />
        {date !== today() && <button onClick={() => setDate(today())} className="text-xs text-[#7FB300] hover:underline">Hari ini</button>}
      </div>
      {error && <p className="text-sm text-red-600">❌ {error}</p>}
      {!rows && !error && <p className="text-sm text-slate-400 animate-pulse">Memuat…</p>}
      {rows && data && (
        <ul className="space-y-3">
          {rows.map(r => <AdminDay key={r.code} row={r} target={data.target} mine={r.code === myCode} />)}
          {!rows.length && <li className="text-sm text-slate-500 text-center py-6">Belum ada kegiatan</li>}
        </ul>
      )}
    </div>
  )
}

function AdminDay({ row: r, target, mine }: { row: DailyRow; target: number; mine: boolean }) {
  const [open, setOpen] = useState(false)
  const pct = Math.min(100, Math.round((r.fu_total / target) * 100))
  const reached = r.fu_total >= target
  const results = RESULT_LABEL.filter(([k]) => r.results[k])

  return (
    <li className={`bg-white rounded-xl border p-4 space-y-3 ${mine ? 'border-[#7FB300]' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900"><span className="font-mono">{r.code}</span> — {r.name}</p>
          <p className="text-xs text-slate-500">
            {r.first_at ? `Aktif ${hhmm(r.first_at)}–${hhmm(r.last_at!)} WITA` : 'Belum ada kegiatan'}
          </p>
        </div>
        <p className="text-sm whitespace-nowrap">
          {reached && '🎯 '}<b className="text-lg text-slate-900">{r.fu_total}</b><span className="text-slate-500">/{target} FU</span>
        </p>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-[#7FB300]" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
        <Stat value={r.fu_member} label="FU member" />
        <Stat value={r.fu_lead} label="FU leads" />
        <Stat value={r.joins} label="join member" />
        <Stat value={r.orders_created} label="pesanan dibuat" />
        <Stat value={r.closing} label={r.closing ? rp(r.omzet) : 'closing'} />
      </div>

      {results.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-slate-500">Hasil leads:</span>
          {results.map(([k, l]) => <span key={k} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{l} {r.results[k]}</span>)}
        </div>
      )}

      <History history={r.history} target={target} />

      {r.timeline.length > 0 && (
        <div>
          <button onClick={() => setOpen(o => !o)} className="text-xs font-semibold text-[#5c8200]">
            {open ? '▲ Sembunyikan' : `▼ Lihat ${r.timeline.length} kegiatan`}
          </button>
          {open && (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {r.timeline.map((t, i) => (
                <li key={i} className="flex gap-3 py-1.5">
                  <span className="font-mono text-xs text-slate-500 pt-0.5 w-10 shrink-0">{hhmm(t.at)}</span>
                  <span className="min-w-0">
                    <span className="text-slate-500">{KIND[t.kind].icon} {KIND[t.kind].text} · </span>
                    <span className="text-slate-900">{t.label}</span>
                    {t.detail && <span className="text-xs text-slate-500"> ({DETAIL[t.detail] ?? t.detail})</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <p className="font-bold text-slate-900">{value}</p>
      <p className="text-[11px] leading-tight text-slate-500 px-1">{label}</p>
    </div>
  )
}

// 14 hari terakhir: jumlah orang di-FU per hari, garis putus-putus = target.
function History({ history, target }: { history: DailyRow['history']; target: number }) {
  const max = Math.max(target, ...history.map(h => h.fu))
  const hit = history.filter(h => h.fu >= target).length
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">14 hari terakhir · {hit} hari capai target</p>
      <div className="relative h-16 flex items-end gap-[2px]" role="img" aria-label={history.map(h => `${dayLabel(h.date)}: ${h.fu} FU`).join(', ')}>
        <div className="absolute inset-x-0 border-t border-dashed border-slate-400" style={{ bottom: `${(target / max) * 100}%` }} />
        {history.map(h => (
          <div key={h.date} className="group relative flex-1 h-full flex items-end" title={`${dayLabel(h.date)}: ${h.fu} FU`}>
            <div
              className={`w-full rounded-t ${h.fu >= target ? 'bg-[#7FB300]' : 'bg-[#7FB300]/45'} group-hover:bg-[#5c8200]`}
              style={{ height: h.fu ? `max(${(h.fu / max) * 100}%, 3px)` : '0' }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
        <span>{dayLabel(history[0].date)}</span>
        <span>{dayLabel(history[history.length - 1].date)}</span>
      </div>
    </div>
  )
}
