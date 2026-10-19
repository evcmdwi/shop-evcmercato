'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface AdminCode { code: string; name: string; is_active: boolean; created_at: string }

export default function KodeAdminPage() {
  const [codes, setCodes] = useState<AdminCode[]>([])
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() =>
    fetch('/api/sambers/admin-codes').then(r => r.json()).then(json => setCodes(json.codes ?? [])).catch(() => {}), [])

  useEffect(() => {
    fetch('/api/sambers/admin-codes').then(r => r.json()).then(json => setCodes(json.codes ?? [])).catch(() => {})
  }, [])

  async function save(payload: Record<string, unknown>, okText: string) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/sambers/admin-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setMsg({ text: `❌ ${json.error ?? 'Gagal'}`, ok: false }); return false }
      setMsg({ text: okText, ok: true })
      await load()
      return true
    } finally {
      setBusy(false)
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (await save({ code: c, name }, `✅ Kode ${c} ditambahkan`)) { setCode(''); setName('') }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sambers/pesanan/baru" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kode Admin</h1>
          <p className="text-sm text-slate-500">Dicatat di setiap pesanan buatan admin — untuk tracking komisi admin</p>
        </div>
      </div>

      <form onSubmit={add} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-end gap-3">
        <div className="w-24">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Kode</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} placeholder="NN" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nama admin</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Neny" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button disabled={busy || code.length < 2 || !name.trim()} className="px-4 py-2 rounded-lg bg-[#7FB300] text-white text-sm font-semibold disabled:opacity-40">+ Tambah</button>
      </form>

      {msg && <p className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>}

      <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {codes.map(c => (
          <li key={c.code} className={`flex items-center gap-3 px-4 py-3 ${c.is_active ? '' : 'opacity-50'}`}>
            <span className="w-14 font-mono font-bold text-slate-900">{c.code}</span>
            <span className="flex-1 text-sm text-slate-700">{c.name}</span>
            <button
              disabled={busy}
              onClick={() => save({ code: c.code, is_active: !c.is_active }, c.is_active ? `Kode ${c.code} dinonaktifkan` : `Kode ${c.code} diaktifkan`)}
              className={`text-xs px-3 py-1 rounded-full border ${c.is_active ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-[#7FB300] text-[#5c8200]'}`}
            >
              {c.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </li>
        ))}
        {!codes.length && <li className="px-4 py-6 text-sm text-slate-500 text-center">Belum ada kode admin</li>}
      </ul>
      <p className="text-xs text-slate-500">Kode yang sudah dipakai di pesanan tidak bisa dihapus, cukup dinonaktifkan supaya tidak muncul di pilihan.</p>
    </div>
  )
}
