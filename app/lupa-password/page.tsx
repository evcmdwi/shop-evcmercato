'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Masukkan alamat email kamu'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Terjadi kesalahan'); return }
      setSent(true)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a2332] to-[#2d3748] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email Terkirim!</h2>
          <p className="text-gray-600 text-sm mb-6">
            Link reset password sudah dikirim ke <strong>{email}</strong>.
            Cek inbox atau folder spam kamu.
          </p>
          <Link href="/login" className="text-[#7FB300] text-sm font-semibold hover:underline">
            ← Kembali ke halaman Masuk
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a2332] to-[#2d3748] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Lupa Password?</h1>
        <p className="text-gray-500 text-sm mb-6">
          Masukkan email kamu dan kami akan kirim link untuk reset password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#7FB300' }}
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            ← Kembali ke halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  )
}
