'use client'

import { useState } from 'react'
import { useAdminAccount } from '@/lib/admin-account-context'

export default function AkunPage() {
  const account = useAdminAccount()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (next !== repeat) return setMsg({ ok: false, text: 'Ulangi password baru tidak sama' })
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/sambers/akun/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current, next }),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return setMsg({ ok: false, text: json.error || 'Gagal mengganti password' })
    setCurrent(''); setNext(''); setRepeat('')
    setMsg({ ok: true, text: 'Password berhasil diganti. Pakai password baru saat masuk berikutnya.' })
  }

  const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white'

  return (
    <div className="max-w-sm space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">🔑 Ubah Password</h1>
        {account && <p className="text-sm text-slate-500">User ID: <b>{account.username}</b></p>}
      </div>
      <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Password lama</label>
          <input type="password" required autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Password baru (min. 6 karakter)</label>
          <input type="password" required minLength={6} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Ulangi password baru</label>
          <input type="password" required minLength={6} autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} className={inputCls} />
        </div>
        {msg && <p className={`text-sm ${msg.ok ? 'text-[#5c8200]' : 'text-red-600'}`}>{msg.ok ? '✅' : '❌'} {msg.text}</p>}
        <button type="submit" disabled={saving} className="w-full bg-[#7FB300] hover:bg-[#6a9600] disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm">
          {saving ? 'Menyimpan…' : 'Simpan Password'}
        </button>
      </form>
    </div>
  )
}
