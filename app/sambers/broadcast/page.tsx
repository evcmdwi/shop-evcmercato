'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  nama: string
  phone: string
  kota: string | null
  broadcast_count: number // berapa kali masuk campaign
}

interface CampaignLog {
  id: string
  lead_id: string
  nama: string
  phone: string
  status: 'sent' | 'failed' | 'pending'
  sent_at: string | null
  error?: string
}

interface Campaign {
  id: string
  nama: string
  pesan: string
  total_leads: number
  sent: number
  failed: number
  status: 'draft' | 'running' | 'paused' | 'done' | 'stopped'
  created_at: string
  logs?: CampaignLog[]
}

interface CampaignStatus {
  campaign_id: string
  status: 'draft' | 'running' | 'paused' | 'done' | 'stopped'
  total: number
  sent: number
  failed: number
  logs: CampaignLog[]
}

// ─── LeadsModal ───────────────────────────────────────────────────────────────

function LeadsModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (ids: string[]) => void
  onClose: () => void
}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filterKota, setFilterKota] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingAuto, setLoadingAuto] = useState(false)

  const fetchLeads = useCallback(async (p = 1, q = '', kota = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (q) params.set('search', q)
      if (kota) params.set('kota', kota)
      const res = await fetch(`/api/sambers/leads?${params}`)
      const data = await res.json()
      setLeads(data.data ?? [])
      setTotal(data.count ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { fetchLeads(1, search, filterKota); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search, filterKota, fetchLeads])

  useEffect(() => { fetchLeads(page, search, filterKota) }, [page]) // eslint-disable-line

  const handleAutoSelect50 = async () => {
    setLoadingAuto(true)
    try {
      const res = await fetch('/api/sambers/broadcast/leads-uncontacted?limit=50')
      const data = await res.json()
      const ids: string[] = (data.leads ?? []).map((l: Lead) => l.id)
      setSelectedIds(new Set(ids))
    } finally {
      setLoadingAuto(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (leads.every(l => selectedIds.has(l.id))) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        leads.forEach(l => next.delete(l.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        leads.forEach(l => next.add(l.id))
        return next
      })
    }
  }

  const allOnPageSelected = leads.length > 0 && leads.every(l => selectedIds.has(l.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">📋 Pilih Leads</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama / HP..."
            className="flex-1 min-w-[160px] border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
          />
          <input
            type="text"
            value={filterKota}
            onChange={e => setFilterKota(e.target.value)}
            placeholder="Filter kota..."
            className="w-36 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
          />
          <button
            onClick={handleAutoSelect50}
            disabled={loadingAuto}
            className="px-3 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loadingAuto ? '⏳ Memilih...' : '⚡ Pilih 50 Belum Terkirim'}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    className="rounded cursor-pointer accent-[#7FB300]"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Nama</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">HP/WA</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Kota</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Campaign</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Memuat...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada data</td></tr>
              ) : leads.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => toggleSelect(lead.id)}
                  className={`border-b border-slate-50 cursor-pointer transition-colors ${
                    selectedIds.has(lead.id) ? 'bg-green-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => {}}
                      className="rounded cursor-pointer accent-[#7FB300]"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{lead.nama}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-xs">{lead.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.kota || '—'}</td>
                  <td className="px-4 py-3">
                    {lead.broadcast_count > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                        📢 {lead.broadcast_count}x
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
            <span className="px-3 py-1.5 text-xs text-slate-500">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {selectedIds.size > 0
              ? <span className="font-semibold text-[#7FB300]">{selectedIds.size} leads dipilih</span>
              : `Total: ${total} leads`}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Batal</button>
            <button
              onClick={() => onConfirm([...selectedIds])}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 text-sm bg-[#7FB300] text-white font-semibold rounded-xl hover:bg-[#6B9700] disabled:opacity-50 transition-colors"
            >
              Konfirmasi Pilihan ({selectedIds.size} leads)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CampaignProgress ─────────────────────────────────────────────────────────

function CampaignProgress({
  campaignId,
  onDone,
}: {
  campaignId: string
  onDone: () => void
}) {
  const [status, setStatus] = useState<CampaignStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [coolingMsg, setCoolingMsg] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/sambers/broadcast/${campaignId}/status`)
      if (!res.ok) return
      const data: CampaignStatus = await res.json()
      setStatus(data)
      setLoading(false)
      if (data.status === 'done' || data.status === 'stopped') {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setRunning(false)
      }
    } catch {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      abortRef.current = true
    }
  }, [fetchStatus])

  // Client-driven broadcast loop
  const runLoop = useCallback(async () => {
    abortRef.current = false
    setRunning(true)
    setCoolingMsg('')

    while (!abortRef.current) {
      try {
        const res = await fetch(`/api/sambers/broadcast/${campaignId}/send-next`, {
          method: 'POST',
        })
        const data = await res.json()

        // Refresh status display
        await fetchStatus()

        if (data.done || data.status === 'done') {
          setCoolingMsg('')
          setRunning(false)
          break
        }

        if (data.paused) {
          setCoolingMsg('')
          setRunning(false)
          break
        }

        if (data.nextDelayMs && data.nextDelayMs > 0) {
          const delaySec = Math.round(data.nextDelayMs / 1000)
          if (data.isCooling) {
            setCoolingMsg(`☕ Cooling break ${delaySec}s (tiap 10 pesan)`)
          } else {
            setCoolingMsg(`⏳ Menunggu ${delaySec}s sebelum pesan berikutnya...`)
          }

          await new Promise<void>((resolve) => {
            timeoutRef.current = setTimeout(() => {
              setCoolingMsg('')
              resolve()
            }, data.nextDelayMs)
          })
        }
      } catch {
        // network error — tunggu 10 detik lalu retry
        setCoolingMsg('⚠️ Network error, retry dalam 10s...')
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(() => {
            setCoolingMsg('')
            resolve()
          }, 10000)
        })
      }
    }
  }, [campaignId, fetchStatus])

  const handleStart = () => {
    runLoop()
  }

  const handlePause = async () => {
    abortRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCoolingMsg('')
    setRunning(false)
    await fetch(`/api/sambers/broadcast/${campaignId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' }),
    })
    fetchStatus()
  }

  const handleStop = async () => {
    if (!confirm('Hentikan campaign ini?')) return
    abortRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCoolingMsg('')
    setRunning(false)
    await fetch(`/api/sambers/broadcast/${campaignId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    })
    fetchStatus()
  }

  const handleAction = async (action: 'pause' | 'resume' | 'stop') => {
    await fetch(`/api/sambers/broadcast/${campaignId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    fetchStatus()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-sm text-slate-400 text-center py-4">Memuat status campaign...</p>
      </div>
    )
  }

  if (!status) return null

  const pct = status.total > 0 ? Math.round(((status.sent + status.failed) / status.total) * 100) : 0

  const statusConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
    running: { icon: '🟢', label: 'Running', color: 'text-green-700', bg: 'bg-green-50' },
    paused:  { icon: '⏸️', label: 'Paused',  color: 'text-yellow-700', bg: 'bg-yellow-50' },
    done:    { icon: '✅', label: 'Selesai', color: 'text-blue-700',  bg: 'bg-blue-50' },
    stopped: { icon: '🛑', label: 'Dihentikan', color: 'text-red-700', bg: 'bg-red-50' },
  }
  const sc = statusConfig[status.status] ?? statusConfig.done

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800">📡 Progress Broadcast</h2>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${sc.bg} ${sc.color}`}>
          {sc.icon} {sc.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{status.sent + status.failed} / {status.total} diproses</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-[#7FB300] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2">
          <span className="text-xs text-green-600 font-semibold">✅ Terkirim: {status.sent}</span>
          <span className="text-xs text-red-500 font-semibold">❌ Gagal: {status.failed}</span>
          <span className="text-xs text-slate-400">Sisa: {status.total - status.sent - status.failed}</span>
        </div>
      </div>

      {/* Info interval */}
      <div className="bg-slate-50 rounded-xl px-4 py-2.5 mb-4">
        <p className="text-xs text-slate-500">
          ℹ️ Interval: random 15–120 detik per pesan · Istirahat otomatis tiap 10 pesan
        </p>
      </div>

      {/* Cooling / waiting message */}
      {coolingMsg && (
        <div className="bg-amber-50 text-amber-700 text-xs px-4 py-2.5 rounded-xl mb-3 font-medium">
          {coolingMsg}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {/* START — campaign draft/paused dan loop tidak sedang berjalan */}
        {!running && (status.status === 'draft' || status.status === 'paused') && (
          <button
            onClick={status.status === 'paused' ? () => { handleAction('resume'); handleStart() } : handleStart}
            className="px-4 py-2 text-sm bg-[#7FB300] text-white font-semibold rounded-xl hover:bg-[#6B9700] transition-colors"
          >
            {status.status === 'paused' ? '▶️ Resume' : '▶️ Mulai Kirim'}
          </button>
        )}
        {/* PAUSE — loop sedang berjalan */}
        {running && (
          <button
            onClick={handlePause}
            className="px-4 py-2 text-sm bg-yellow-50 text-yellow-700 font-semibold rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors"
          >
            ⏸️ Pause
          </button>
        )}
        {/* STOP */}
        {(running || status.status === 'running' || status.status === 'paused') && (
          <button
            onClick={handleStop}
            className="px-4 py-2 text-sm bg-red-50 text-red-600 font-semibold rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
          >
            🛑 Stop
          </button>
        )}
        {/* SELESAI */}
        {!running && (status.status === 'done' || status.status === 'stopped') && (
          <button
            onClick={onDone}
            className="px-4 py-2 text-sm bg-[#7FB300] text-white font-semibold rounded-xl hover:bg-[#6B9700] transition-colors"
          >
            ✅ Selesai — Buat Campaign Baru
          </button>
        )}
      </div>

      {/* Log table */}
      {status.logs && status.logs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">📋 Log Pengiriman</h3>
          <div className="overflow-auto max-h-64 border border-slate-100 rounded-xl">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Nama</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Nomor</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {status.logs.map(log => (
                  <tr key={log.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{log.nama}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{log.phone}</td>
                    <td className="px-3 py-2">
                      {log.status === 'sent' && <span className="text-green-600 font-semibold">✅ Terkirim</span>}
                      {log.status === 'failed' && (
                        <span className="text-red-500 font-semibold" title={log.error}>❌ Gagal</span>
                      )}
                      {log.status === 'pending' && <span className="text-slate-400">⏳ Pending</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {log.sent_at ? new Date(log.sent_at).toLocaleTimeString('id-ID') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CampaignHistory ──────────────────────────────────────────────────────────

function CampaignHistory({ onViewDetail }: { onViewDetail: (id: string) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CampaignLog[] | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    fetch('/api/sambers/broadcast')
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleRowClick = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return }
    setExpandedId(id)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/sambers/broadcast/${id}/status`)
      const data = await res.json()
      setDetail(data.logs ?? [])
    } finally {
      setLoadingDetail(false)
    }
  }

  const statusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      running: 'bg-green-100 text-green-700',
      paused:  'bg-yellow-100 text-yellow-700',
      done:    'bg-blue-100 text-blue-700',
      stopped: 'bg-red-100 text-red-600',
    }
    const labels: Record<string, string> = {
      running: '🟢 Running', paused: '⏸️ Paused', done: '✅ Selesai', stopped: '🛑 Dihentikan',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[status] ?? 'bg-slate-100 text-slate-600'}`}>
        {labels[status] ?? status}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800">📂 Riwayat Campaign</h2>
      </div>

      {loading ? (
        <p className="text-center py-8 text-slate-400 text-sm">Memuat riwayat...</p>
      ) : campaigns.length === 0 ? (
        <p className="text-center py-8 text-slate-400 text-sm">Belum ada campaign</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Nama Campaign</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">Total</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">Sent</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center">Failed</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <>
                  <tr
                    key={c.id}
                    onClick={() => handleRowClick(c.id)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-xs text-slate-400">{expandedId === c.id ? '▾' : '▸'}</span>
                        {c.nama}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">{c.total_leads}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">{c.sent}</td>
                    <td className="px-4 py-3 text-center text-red-500 font-semibold">{c.failed}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3">
                      {(c.status === 'draft' || c.status === 'paused') && (
                        <button
                          onClick={e => { e.stopPropagation(); onViewDetail(c.id) }}
                          className="px-3 py-1 text-xs bg-[#7FB300] text-white font-semibold rounded-lg hover:bg-[#6B9700] transition-colors whitespace-nowrap"
                        >
                          ▶️ {c.status === 'paused' ? 'Resume' : 'Mulai'}
                        </button>
                      )}
                      {c.status === 'running' && (
                        <button
                          onClick={e => { e.stopPropagation(); onViewDetail(c.id) }}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                        >
                          👁 Monitor
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-detail`}>
                      <td colSpan={6} className="bg-slate-50 px-6 py-4">
                        {loadingDetail ? (
                          <p className="text-xs text-slate-400 text-center py-2">Memuat log...</p>
                        ) : !detail || detail.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-2">Tidak ada log</p>
                        ) : (
                          <div className="overflow-auto max-h-52">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-slate-500">
                                  <th className="pb-1 pr-4">Nama</th>
                                  <th className="pb-1 pr-4">Nomor</th>
                                  <th className="pb-1 pr-4">Status</th>
                                  <th className="pb-1">Waktu</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.map(log => (
                                  <tr key={log.id} className="border-t border-slate-100">
                                    <td className="py-1 pr-4 font-medium">{log.nama}</td>
                                    <td className="py-1 pr-4 font-mono">{log.phone}</td>
                                    <td className="py-1 pr-4">
                                      {log.status === 'sent' && <span className="text-green-600">✅ Terkirim</span>}
                                      {log.status === 'failed' && <span className="text-red-500">❌ Gagal</span>}
                                      {log.status === 'pending' && <span className="text-slate-400">⏳ Pending</span>}
                                    </td>
                                    <td className="py-1 text-slate-400">
                                      {log.sent_at ? new Date(log.sent_at).toLocaleString('id-ID') : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── TestSendPanel ───────────────────────────────────────────────────────────

function TestSendPanel({ message }: { message: string }) {
  const [nama, setNama] = useState('')
  const [phone, setPhone] = useState('')
  const [kota, setKota] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleTest = async () => {
    if (!nama.trim() || !phone.trim()) return
    if (!message.trim() || message.trim().length < 5) {
      setResult({ ok: false, msg: 'Isi pesan dulu sebelum test kirim' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/sambers/broadcast/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, nama, kota, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ ok: false, msg: data.error || 'Gagal kirim' })
      } else {
        setResult({ ok: true, msg: `✅ Pesan test berhasil dikirim ke ${phone}` })
      }
    } catch {
      setResult({ ok: false, msg: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  // Preview pesan dengan variabel dirender
  const preview = message
    .replace(/\{Nama\}/g, nama || '{Nama}')
    .replace(/\{Kota\}/g, kota || '{Kota}')
    .replace(/\{Interest\}/g, '')

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
      <h3 className="font-bold text-amber-800 mb-3">🧪 Test Kirim — Preview Pesan</h3>
      <p className="text-xs text-amber-700 mb-4">Kirim ke 1 nomor dulu untuk lihat tampilan akhir sebelum broadcast ke semua leads.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Penerima *</label>
          <input
            type="text"
            value={nama}
            onChange={e => setNama(e.target.value)}
            placeholder="Contoh: Budi"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">No WA *</label>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Kota (opsional)</label>
          <input
            type="text"
            value={kota}
            onChange={e => setKota(e.target.value)}
            placeholder="Contoh: Balikpapan"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Preview */}
      {message.trim().length > 0 && (
        <div className="bg-white border border-amber-100 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-1">👁 Preview pesan:</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{preview}</p>
        </div>
      )}

      {result && (
        <div className={`text-sm px-4 py-2 rounded-xl mb-3 ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {result.msg}
        </div>
      )}

      <button
        onClick={handleTest}
        disabled={loading || !nama.trim() || !phone.trim() || message.trim().length < 5}
        className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
      >
        {loading ? '⏳ Mengirim...' : '📤 Kirim Test WA'}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BroadcastPage() {
  const [showLeadsModal, setShowLeadsModal] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [namaCampaign, setNamaCampaign] = useState('')
  const [pesan, setPesan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [excludedConverted, setExcludedConverted] = useState<number>(0)

  const MAX_CHARS = 1000
  const charCount = pesan.length

  const handleConfirmLeads = (ids: string[]) => {
    setSelectedLeadIds(ids)
    setShowLeadsModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!namaCampaign.trim()) { setError('Nama campaign wajib diisi'); return }
    if (!pesan.trim() || pesan.trim().length < 5) { setError('Pesan minimal 5 karakter'); return }
    if (selectedLeadIds.length === 0) { setError('Pilih minimal 1 lead'); return }

    if (!confirm(`Mulai broadcast ke ${selectedLeadIds.length} leads?`)) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/sambers/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: namaCampaign,
          pesan,
          lead_ids: selectedLeadIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal membuat campaign'); return }
      setExcludedConverted(data.excluded_converted ?? 0)
      setActiveCampaignId(data.campaign_id)
      setNamaCampaign('')
      setPesan('')
      setSelectedLeadIds([])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">📢 Broadcast Campaign</h1>
        <p className="text-sm text-slate-500">Kirim pesan WhatsApp ke banyak leads sekaligus via Fonnte</p>
      </div>

      {/* Section 1: Buat Campaign */}
      {!activeCampaignId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">✏️ Buat Campaign Baru</h2>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-xl mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Campaign */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Campaign *</label>
              <input
                type="text"
                value={namaCampaign}
                onChange={e => setNamaCampaign(e.target.value)}
                placeholder="Contoh: Promo Mei 2026 — Balikpapan"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
              />
            </div>

            {/* Pesan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Pesan WhatsApp *</label>
                <span className={`text-xs font-mono ${charCount > MAX_CHARS ? 'text-red-500' : 'text-slate-400'}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-1.5">
                Gunakan <code className="bg-slate-100 px-1 rounded">{'{Nama}'}</code> atau <code className="bg-slate-100 px-1 rounded">{'{Kota}'}</code> sebagai variabel personalisasi
              </p>
              <div className="flex gap-2 mb-2 flex-wrap">
                {['{Nama}', '{Kota}', '{Interest}'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPesan(p => p + v)}
                    className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors font-mono"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <textarea
                value={pesan}
                onChange={e => setPesan(e.target.value)}
                rows={6}
                placeholder={`Halo Kak {Nama}! 👋\n\nKami dari EVC Mercato ingin menginfokan promo spesial untuk kamu di {Kota}...\n\nReply pesan ini untuk info lebih lanjut ya! 🙏`}
                maxLength={MAX_CHARS + 100}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none ${
                  charCount > MAX_CHARS
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-[#7FB300]'
                }`}
              />
            </div>

            {/* Pilih Leads */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Target Leads *</label>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowLeadsModal(true)}
                  className="px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
                >
                  📋 Pilih Leads
                </button>
                {selectedLeadIds.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[#7FB300] font-semibold">
                      ✅ {selectedLeadIds.length} leads dipilih
                    </span>
                    {excludedConverted > 0 && (
                      <span className="text-xs text-emerald-600">
                        👤 {excludedConverted} leads dikecualikan karena sudah jadi member
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Belum ada leads dipilih</span>
                )}
                {selectedLeadIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLeadIds([])}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    × Reset
                  </button>
                )}
              </div>
            </div>

            {/* Test Kirim */}
            <TestSendPanel message={pesan} />

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || charCount > MAX_CHARS}
                className="w-full sm:w-auto px-6 py-3 bg-[#7FB300] text-white font-bold rounded-xl hover:bg-[#6B9700] disabled:opacity-50 transition-colors text-sm"
              >
                {submitting ? '⏳ Membuat campaign...' : '🚀 Mulai Broadcast'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 2: Progress */}
      {activeCampaignId && (
        <CampaignProgress
          campaignId={activeCampaignId}
          onDone={() => setActiveCampaignId(null)}
        />
      )}

      {/* Section 3: Riwayat */}
      <CampaignHistory onViewDetail={setActiveCampaignId} />

      {/* Modal */}
      {showLeadsModal && (
        <LeadsModal
          onConfirm={handleConfirmLeads}
          onClose={() => setShowLeadsModal(false)}
        />
      )}
    </div>
  )
}
