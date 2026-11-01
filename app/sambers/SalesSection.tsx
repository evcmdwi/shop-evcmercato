'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Totals { omzet: number; orders: number }
interface DayRow extends Totals { date: string }
interface SalesData {
  today: string
  summary: { today: Totals; last7: Totals; last30: Totals }
  range: Totals & { from: string; to: string; days: number }
  daily: DayRow[]
}
type Preset = '30d' | 'this_month' | 'last_month' | 'custom'

// ─── Helpers (tanggal WIB, sama dengan papan skor Follow Up) ─────────────────

const DAY = 86400000
const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n)
const compact = (n: number) =>
  n >= 1e9 ? `${+(n / 1e9).toFixed(1)}M` : n >= 1e6 ? `${+(n / 1e6).toFixed(1)}jt` : n >= 1e3 ? `${Math.round(n / 1e3)}rb` : `${n}`
const wibToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
const shift = (date: string, days: number) =>
  new Date(new Date(date + 'T12:00:00+07:00').getTime() + days * DAY).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(date + 'T12:00:00+07:00').toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', ...opts })

function presetRange(p: Exclude<Preset, 'custom'>): { from: string; to: string } {
  const today = wibToday()
  if (p === '30d') return { from: shift(today, -29), to: today }
  const [y, m] = today.split('-').map(Number)
  if (p === 'this_month') return { from: `${today.slice(0, 7)}-01`, to: today }
  const py = m === 1 ? y - 1 : y
  const pm = m === 1 ? 12 : m - 1
  const first = `${py}-${String(pm).padStart(2, '0')}-01`
  return { from: first, to: shift(`${today.slice(0, 7)}-01`, -1) }
}

// "Nice" batas atas sumbu Y: 1/2/2.5/5 × 10^n.
function niceMax(v: number) {
  if (v <= 0) return 100000
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  for (const s of [1, 2, 2.5, 5, 10]) if (v <= s * p) return s * p
  return 10 * p
}

// ─── Grafik garis (SVG, tanpa library) ────────────────────────────────────────

function SalesChart({ rows }: { rows: DayRow[] }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const H = 240
  const pad = { l: 48, r: 12, t: 12, b: 28 }
  const iw = Math.max(0, w - pad.l - pad.r)
  const ih = H - pad.t - pad.b
  const max = niceMax(Math.max(...rows.map(r => r.omzet), 0))
  const n = rows.length
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / max) * ih
  const path = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.omzet).toFixed(1)}`).join(' ')
  const area = n ? `${path} L${x(n - 1).toFixed(1)},${pad.t + ih} L${x(0).toFixed(1)},${pad.t + ih} Z` : ''
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max)
  // Label tanggal: maksimal ±7 label agar tidak bertumpuk.
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))))

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    setHover(n <= 1 ? 0 : Math.min(n - 1, Math.max(0, Math.round((px / rect.width) * (n - 1)))))
  }

  const h = hover !== null ? rows[hover] : null

  return (
    <div ref={wrap} className="relative w-full select-none">
      {w > 0 && (
        <svg width={w} height={H} className="block">
          {ticks.map(t => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t ? '3 3' : undefined} />
              <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{compact(t)}</text>
            </g>
          ))}
          {rows.map((r, i) => (i % every === 0 || i === n - 1) && (n - 1 - i >= every / 2 || i === n - 1) ? (
            <text key={r.date} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
              {fmt(r.date, { day: 'numeric', month: 'short' })}
            </text>
          ) : null)}
          <path d={area} fill="#7FB300" fillOpacity={0.1} />
          <path d={path} fill="none" stroke="#7FB300" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {n <= 45 && rows.map((r, i) => (
            <circle key={r.date} cx={x(i)} cy={y(r.omzet)} r={2.5} fill="#7FB300" />
          ))}
          {h && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#94a3b8" />
              <circle cx={x(hover)} cy={y(h.omzet)} r={5} fill="#fff" stroke="#7FB300" strokeWidth={2.5} />
            </g>
          )}
          <rect
            x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent"
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
          style={{ left: Math.min(Math.max(x(hover) - 70, 0), Math.max(0, w - 150)) }}
        >
          <p className="text-slate-300">{fmt(h.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="font-semibold text-sm">{rp(h.omzet)}</p>
          <p className="text-slate-300">{h.orders} pesanan</p>
        </div>
      )}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function SalesSection() {
  const [preset, setPreset] = useState<Preset>('30d')
  const [range, setRange] = useState(() => presetRange('30d'))
  const [draft, setDraft] = useState(range)
  // Hasil terakhir + kunci rentangnya; "loading" = hasil belum untuk rentang yang dipilih.
  const [result, setResult] = useState<{ key: string; data: SalesData | null; error: string } | null>(null)
  const key = `${range.from}_${range.to}`

  useEffect(() => {
    let alive = true
    fetch(`/api/sambers/dashboard/sales?from=${range.from}&to=${range.to}`)
      .then(async r => {
        const j = await r.json()
        if (!alive) return
        setResult(prev => r.ok
          ? { key, data: j.data, error: '' }
          : { key, data: prev?.data ?? null, error: j.error ?? 'Gagal memuat data' })
      })
      .catch(() => alive && setResult(prev => ({ key, data: prev?.data ?? null, error: 'Gagal memuat data' })))
    return () => { alive = false }
  }, [key, range.from, range.to])

  const data = result?.data ?? null
  const loading = result?.key !== key
  const error = loading ? '' : result?.error ?? ''

  function pick(p: Preset) {
    setPreset(p)
    if (p !== 'custom') {
      const r = presetRange(p)
      setRange(r)
      setDraft(r)
    }
  }

  const today = wibToday()
  const avg = data && data.range.days ? Math.round(data.range.omzet / data.range.days) : 0
  const rangeLabel = useMemo(() => {
    if (!data) return ''
    const { from, to } = data.range
    return from === to
      ? fmt(from, { day: 'numeric', month: 'long', year: 'numeric' })
      : `${fmt(from, { day: 'numeric', month: 'short', year: 'numeric' })} – ${fmt(to, { day: 'numeric', month: 'short', year: 'numeric' })}`
  }, [data])

  const cards = [
    { label: 'Penjualan Hari Ini', t: data?.summary.today, sub: fmt(today, { weekday: 'long', day: 'numeric', month: 'short' }) },
    { label: '7 Hari Terakhir', t: data?.summary.last7, sub: `${fmt(shift(today, -6), { day: 'numeric', month: 'short' })} – ${fmt(today, { day: 'numeric', month: 'short' })}` },
    { label: '30 Hari Terakhir', t: data?.summary.last30, sub: `${fmt(shift(today, -29), { day: 'numeric', month: 'short' })} – ${fmt(today, { day: 'numeric', month: 'short' })}` },
  ]

  const presets: { key: Preset; label: string }[] = [
    { key: '30d', label: '30 Hari' },
    { key: 'this_month', label: 'Bulan Ini' },
    { key: 'last_month', label: 'Bulan Lalu' },
    { key: 'custom', label: 'Pilih Tanggal' },
  ]

  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">💰 Penjualan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map(c => (
          <div key={c.label} className="border border-slate-200 rounded-xl p-4 bg-white">
            <p className="text-sm font-medium text-slate-600">{c.label}</p>
            <p className="text-2xl font-bold text-[#7FB300] mt-1">
              {data ? rp(c.t?.omzet ?? 0) : <span className="animate-pulse text-slate-300">—</span>}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {data ? `${c.t?.orders ?? 0} pesanan · ` : ''}{c.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 border border-slate-200 rounded-xl p-4 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Penjualan Harian</p>
            <p className="text-xs text-slate-400">{rangeLabel || ' '}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => pick(p.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  preset === p.key
                    ? 'bg-[#7FB300] border-[#7FB300] text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            onSubmit={e => { e.preventDefault(); setRange({ ...draft }) }}
          >
            <label className="text-xs text-slate-500">
              Dari
              <input
                type="date" value={draft.from} max={today} required
                onChange={e => setDraft(d => ({ ...d, from: e.target.value }))}
                className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs text-slate-500">
              Sampai
              <input
                type="date" value={draft.to} min={draft.from} max={today} required
                onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
                className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
              />
            </label>
            <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700">
              Tampilkan
            </button>
          </form>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
          <div>
            <p className="text-[11px] text-slate-400">Total Omzet</p>
            <p className="text-sm sm:text-base font-bold text-slate-800">{data ? rp(data.range.omzet) : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Pesanan</p>
            <p className="text-sm sm:text-base font-bold text-slate-800">{data ? data.range.orders : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Rata-rata / Hari</p>
            <p className="text-sm sm:text-base font-bold text-slate-800">{data ? rp(avg) : '—'}</p>
          </div>
        </div>

        <div className={`mt-4 transition-opacity ${loading ? 'opacity-40' : ''}`}>
          {error ? (
            <p className="py-10 text-center text-sm text-red-500">{error}</p>
          ) : data ? (
            <SalesChart rows={data.daily} />
          ) : (
            <div className="h-60 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Pesanan lunas (dibayar–selesai) menurut tanggal bayar, tanpa ongkir. Hari berganti 00.00 WIB.
        </p>
      </div>
    </section>
  )
}
