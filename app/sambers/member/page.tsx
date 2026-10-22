'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  total_points: number
  tier: string
  has_order: boolean
  special_discount_pct: number | null
  kki_distributor: boolean
  kki_suspect: { reasons: string[] } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    silver: 'bg-gray-100 text-gray-700',
    gold: 'bg-amber-100 text-amber-700',
    platinum: 'bg-violet-100 text-violet-700',
  }
  const key = tier?.toLowerCase() ?? 'silver'
  const cls = styles[key] ?? styles.silver
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cls}`}>
      {key}
    </span>
  )
}

function VipBadge({ pct }: { pct: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
      💛 VIP {pct}%
    </span>
  )
}

function KkiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800 border border-rose-300" title="Dikecualikan dari broadcast, follow up, dan semua diskon">
      🚫 Distributor KKI
    </span>
  )
}

function SuspectBadge({ reasons }: { reasons: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-800 border border-orange-300" title={reasons.join(' · ')}>
      ⚠️ Mirip Distributor KKI
    </span>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function AdminMembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [kkiOnly, setKkiOnly] = useState(false)
  const [suspectOnly, setSuspectOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (kkiOnly) params.set('kki', '1')
    if (suspectOnly) params.set('suspect', '1')
    const res = await fetch(`/api/sambers/members?${params}`)
    const data = await res.json()
    setMembers(data.members ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [debouncedSearch, kkiOnly, suspectOnly])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/sambers/members/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      const data = await res.json()
      if (data.anonymized) {
        alert(`✅ ${data.message}`)
      }
      setMembers(prev => prev.filter(m => m.id !== deleteTarget.id))
      setTotal(prev => prev - 1)
      setDeleteTarget(null)
    } else {
      const d = await res.json()
      alert(d.error ?? 'Gagal menghapus member')
    }
  }

  const openAdd = () => {
    setForm({ name: '', phone: '', email: '' })
    setAddError('')
    setShowAdd(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/sambers/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    setAdding(false)
    if (!res.ok) {
      setAddError(data.error ?? 'Gagal menambah member')
      return
    }
    alert(`✅ Member ditambahkan. Login: ${form.email.trim().toLowerCase()} / password ${data.password}`)
    router.push('/sambers/member/' + data.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Member</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} member</p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-[#7FB300] text-white hover:bg-[#6E9C00] transition-colors"
        >
          + Member
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <input
          type="text"
          placeholder="Cari nama, email, atau no WA..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] focus:border-transparent"
        />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={kkiOnly} onChange={e => setKkiOnly(e.target.checked)} className="accent-rose-600" />
            Distributor KKI saja
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={suspectOnly} onChange={e => setSuspectOnly(e.target.checked)} className="accent-orange-600" />
            Mirip Distributor KKI
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            {debouncedSearch ? 'Tidak ada member yang cocok.' : 'Belum ada member.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Tanggal Join</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Nama</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">No WA</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">EVC Points</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Sudah Order</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push('/sambers/member/' + member.id)}
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(member.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{member.name || <span className="text-slate-400 italic">—</span>}</span>
                        {member.special_discount_pct && member.special_discount_pct > 0 && (
                          <VipBadge pct={member.special_discount_pct} />
                        )}
                        {member.kki_distributor && <KkiBadge />}
                        {member.kki_suspect && <SuspectBadge reasons={member.kki_suspect.reasons} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {member.phone || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {member.email}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {(member.total_points ?? 0).toLocaleString('id-ID')}
                        </span>
                        <TierBadge tier={member.tier} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {member.has_order ? (
                        <span className="text-green-600 font-medium">✅ Ya</span>
                      ) : (
                        <span className="text-slate-400">— Belum</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(member) }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus member"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tambah member */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Tambah Member</h2>
            {([
              ['name', 'Nama', 'text', 'Nama lengkap'],
              ['phone', 'No WA', 'tel', '081234567890'],
              ['email', 'Email', 'email', 'nama@email.com'],
            ] as const).map(([key, label, type, placeholder]) => (
              <label key={key} className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <input
                  type={type}
                  required
                  autoFocus={key === 'name'}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] focus:border-transparent"
                />
              </label>
            ))}
            <p className="text-xs text-slate-500">
              Member login dengan email ini dan password awal <span className="font-semibold">123456</span>
              {' '}(bisa diganti sendiri nanti).
            </p>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                disabled={adding}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#7FB300] text-white hover:bg-[#6E9C00] transition-colors disabled:opacity-50"
              >
                {adding ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Hapus Member</h2>
            <p className="text-sm text-slate-600">
              Yakin hapus member{' '}
              <span className="font-semibold">{deleteTarget.name || deleteTarget.email}</span>?
              Semua data termasuk order history tidak ikut terhapus.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
