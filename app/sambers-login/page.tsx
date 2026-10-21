'use client'

import { useState } from 'react'

export default function SambersLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/sambers-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Gagal masuk')
      window.location.href = '/sambers'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk')
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7FB300] focus:border-transparent'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-900">SAMBERS</h1>
        <p className="text-sm text-slate-500 mb-6">Masuk admin EVC Mercato</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
            <input id="username" required autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username"
              value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input id="password" type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#7FB300] hover:bg-[#6a9600] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
