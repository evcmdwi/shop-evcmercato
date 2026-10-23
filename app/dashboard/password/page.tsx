'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function GantiPasswordPage() {
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
    const res = await fetch('/api/user/password', {
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

  const inputCls = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#7FB300]'

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <main className="w-full max-w-md mx-auto px-4 py-10">
        <Link href="/dashboard" prefetch={false} className="text-sm text-slate-500 hover:text-slate-800">‹ Kembali ke Akun</Link>
        <h1 className="text-xl font-bold text-slate-900 mt-3 mb-4">🔑 Ganti Password</h1>
        <form onSubmit={save} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div>
            <label htmlFor="pw-current" className="block text-sm font-semibold text-slate-700 mb-1">Password lama</label>
            <input id="pw-current" type="password" required autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pw-next" className="block text-sm font-semibold text-slate-700 mb-1">Password baru (min. 6 karakter)</label>
            <input id="pw-next" type="password" required minLength={6} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pw-repeat" className="block text-sm font-semibold text-slate-700 mb-1">Ulangi password baru</label>
            <input id="pw-repeat" type="password" required minLength={6} autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} className={inputCls} />
          </div>
          {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-[#5c8200]' : 'text-red-600'}`}>{msg.ok ? '✅' : '❌'} {msg.text}</p>}
          <button type="submit" disabled={saving} className="w-full bg-[#7FB300] hover:bg-[#6a9600] disabled:opacity-60 text-white font-semibold py-3 rounded-xl">
            {saving ? 'Menyimpan…' : 'Simpan Password'}
          </button>
          <p className="text-xs text-slate-500 text-center">
            Lupa password lama? <Link href="/lupa-password" prefetch={false} className="text-[#5c8200] font-semibold">Reset lewat email</Link>
          </p>
        </form>
      </main>
    </div>
  )
}
