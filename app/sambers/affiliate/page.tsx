'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ─────────────────────────────────────────────────────────

interface Channel {
  platform: string
  link_or_username?: string
}

interface Application {
  id: string
  user_id: string
  full_name_kkd: string
  kki_member_id: string
  director_leader: string
  whatsapp: string
  email: string
  applied_at: string
  channels: Channel[]
}

interface AffiliateRow {
  id: string
  affiliate_code: string | null
  full_name_kkd: string
  kki_member_id: string
  status: string
  lifetime_pv: number
  lifetime_orders: number
  lifetime_members: number
  approved_at: string | null
}

type Tab = 'pengajuan' | 'aktif' | 'settlement'

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-gray-100 text-gray-600',
  }
  const label: Record<string, string> = {
    approved: 'Aktif',
    suspended: 'Suspended',
    pending: 'Pending',
    rejected: 'Ditolak',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {label[status] ?? status}
    </span>
  )
}

// ─── Modal Component ─────────────────────────────────────────────────

interface ModalProps {
  title: string
  onClose: () => void
  onConfirm: (text: string) => void
  loading: boolean
  textLabel: string
  required: boolean
  confirmLabel: string
  confirmStyle?: string
}

function TextModal({ title, onClose, onConfirm, loading, textLabel, required, confirmLabel, confirmStyle }: ModalProps) {
  const [text, setText] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <label className="block text-sm font-medium text-gray-700 mb-1">{textLabel}</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={required ? 'Wajib diisi…' : 'Opsional…'}
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(text)}
            disabled={loading || (required && !text.trim())}
            className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${confirmStyle ?? 'bg-[#7FB300] hover:bg-[#6a9700]'}`}
          >
            {loading ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Pengajuan ─────────────────────────────────────────────────

function PengajuanTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ type: 'approve' | 'reject'; id: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/sambers/affiliate/applications?status=pending${q}&limit=50`)
      const data = await res.json()
      setApps(data.applications ?? [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  async function handleAction(text: string) {
    if (!modal) return
    setActionLoading(true)
    try {
      const url = modal.type === 'approve'
        ? `/api/sambers/affiliate/applications/${modal.id}/approve`
        : `/api/sambers/affiliate/applications/${modal.id}/reject`
      const body = modal.type === 'approve'
        ? { notes_for_user: text }
        : { notes_for_user: text }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({
          text: modal.type === 'approve'
            ? `✅ Disetujui! Kode: ${data.affiliate_code}`
            : '✅ Pengajuan ditolak.',
          ok: true,
        })
        setModal(null)
        load()
      } else {
        setMessage({ text: `❌ ${data.error}`, ok: false })
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
          <button className="ml-3 underline" onClick={() => setMessage(null)}>Tutup</button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama, KKI ID, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-8 text-center">Memuat…</div>
      ) : apps.length === 0 ? (
        <div className="text-sm text-gray-500 py-12 text-center">Tidak ada pengajuan pending.</div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{app.full_name_kkd}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    KKI ID: <span className="font-medium text-gray-700">{app.kki_member_id}</span>
                    {' · '}Director: <span className="font-medium text-gray-700">{app.director_leader}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">{formatDate(app.applied_at)}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>📱 <span className="font-medium">{app.whatsapp}</span></div>
                <div>✉️ <span className="font-medium">{app.email}</span></div>
              </div>

              {app.channels?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Channel Promosi:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {app.channels.map((ch, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full capitalize">
                        {ch.platform}{ch.link_or_username ? `: ${ch.link_or_username}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setModal({ type: 'approve', id: app.id })}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setModal({ type: 'reject', id: app.id })}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium"
                  >
                    ❌ Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'approve' && (
        <TextModal
          title="Approve Pengajuan Affiliate"
          textLabel="Catatan untuk pemohon (opsional)"
          required={false}
          confirmLabel="Approve"
          confirmStyle="bg-green-600 hover:bg-green-700"
          loading={actionLoading}
          onClose={() => setModal(null)}
          onConfirm={handleAction}
        />
      )}

      {modal?.type === 'reject' && (
        <TextModal
          title="Tolak Pengajuan Affiliate"
          textLabel="Alasan penolakan (wajib)"
          required={true}
          confirmLabel="Tolak"
          confirmStyle="bg-red-600 hover:bg-red-700"
          loading={actionLoading}
          onClose={() => setModal(null)}
          onConfirm={handleAction}
        />
      )}
    </div>
  )
}

// ─── Tab: Affiliate Aktif ────────────────────────────────────────────

function AktifTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState<{ type: 'suspend' | 'reactivate'; id: string; name: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/sambers/affiliate/list?${params}`)
      const data = await res.json()
      setAffiliates(data.affiliates ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  async function handleSuspend(reason: string) {
    if (!modal) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/sambers/affiliate/${modal.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: '✅ Affiliate disuspend.', ok: true })
        setModal(null)
        load()
      } else {
        setMessage({ text: `❌ ${data.error}`, ok: false })
      }
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReactivate() {
    if (!modal) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/sambers/affiliate/${modal.id}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: '✅ Affiliate diaktifkan kembali.', ok: true })
        setModal(null)
        load()
      } else {
        setMessage({ text: `❌ ${data.error}`, ok: false })
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
          <button className="ml-3 underline" onClick={() => setMessage(null)}>Tutup</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari kode, nama, KKI ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] w-full max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
        >
          <option value="">Semua Status</option>
          <option value="approved">Aktif</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-8 text-center">Memuat…</div>
      ) : affiliates.length === 0 ? (
        <div className="text-sm text-gray-500 py-12 text-center">Tidak ada data affiliate.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Kode</th>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">KKI ID</th>
                <th className="px-4 py-3 text-right">PV Total</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-center">Status</th>
                {isSuperAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {affiliates.map(aff => (
                <tr key={aff.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-[#7FB300]">{aff.affiliate_code ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{aff.full_name_kkd}</td>
                  <td className="px-4 py-3 text-gray-600">{aff.kki_member_id}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{aff.lifetime_pv.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{aff.lifetime_orders}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={aff.status} /></td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-center">
                      {aff.status === 'approved' && (
                        <button
                          onClick={() => setModal({ type: 'suspend', id: aff.id, name: aff.full_name_kkd })}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-medium"
                        >
                          Suspend
                        </button>
                      )}
                      {aff.status === 'suspended' && (
                        <button
                          onClick={() => setModal({ type: 'reactivate', id: aff.id, name: aff.full_name_kkd })}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium"
                        >
                          Aktifkan
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suspend Modal */}
      {modal?.type === 'suspend' && (
        <TextModal
          title={`Suspend Affiliate: ${modal.name}`}
          textLabel="Alasan suspensi (wajib)"
          required={true}
          confirmLabel="Suspend"
          confirmStyle="bg-red-600 hover:bg-red-700"
          loading={actionLoading}
          onClose={() => setModal(null)}
          onConfirm={handleSuspend}
        />
      )}

      {/* Reactivate Confirm Modal (simple) */}
      {modal?.type === 'reactivate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-3">Aktifkan Kembali Affiliate?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Affiliate <strong>{modal.name}</strong> akan diaktifkan kembali dan semua short link-nya akan diaktifkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Memproses…' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Settlement (Placeholder) ──────────────────────────────────

function SettlementTab() {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-3">📊</div>
      <div className="text-lg font-semibold text-gray-700">Settlement — Phase 2</div>
      <div className="text-sm text-gray-500 mt-2">Fitur ini akan tersedia setelah Phase 1 selesai.</div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function AdminAffiliatePage() {
  const [activeTab, setActiveTab] = useState<Tab>('pengajuan')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [roleLoaded, setRoleLoaded] = useState(false)

  useEffect(() => {
    // Fetch current user role
    fetch('/api/sambers/me')
      .then(r => r.json())
      .then(d => {
        setIsSuperAdmin(d?.role === 'super_admin')
        setRoleLoaded(true)
      })
      .catch(() => setRoleLoaded(true))
  }, [])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pengajuan', label: '📝 Pengajuan' },
    { id: 'aktif', label: '✅ Affiliate Aktif' },
    { id: 'settlement', label: '📊 Settlement' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🤝 Affiliate Program</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengajuan, affiliate aktif, dan settlement.</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 text-[#7FB300] -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {!roleLoaded ? (
        <div className="text-sm text-gray-500 py-8 text-center">Memuat…</div>
      ) : (
        <>
          {activeTab === 'pengajuan' && <PengajuanTab isSuperAdmin={isSuperAdmin} />}
          {activeTab === 'aktif' && <AktifTab isSuperAdmin={isSuperAdmin} />}
          {activeTab === 'settlement' && <SettlementTab />}
        </>
      )}
    </div>
  )
}
