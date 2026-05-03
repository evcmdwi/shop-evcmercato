'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Baca hash fragment manual dari URL — paling reliable di Next.js App Router
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token') || ''
    const type = params.get('type')

    if (accessToken && type === 'recovery') {
      // Set session langsung dari token di URL hash
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            console.error('[reset-password] setSession error:', error)
            setSessionError(true)
          } else {
            setSessionReady(true)
          }
        })
    } else {
      // Tidak ada token di hash — link tidak valid atau sudah dipakai
      setSessionError(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password minimal 8 karakter'); return }
    if (password !== confirm) { setError('Password tidak cocok'); return }

    setLoading(true)
    setError('')

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setError(error.message); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Password Berhasil Diubah!</h2>
        <p className="text-gray-600 text-sm">Kamu akan diarahkan ke halaman login...</p>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Tidak Valid atau Kadaluarsa</h2>
        <p className="text-gray-600 text-sm mb-6">
          Link reset password sudah kadaluarsa atau sudah pernah dipakai. Silakan minta link baru.
        </p>
        <a href="/lupa-password" className="text-[#7FB300] font-semibold hover:underline text-sm">
          Minta Link Baru →
        </a>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-[#7FB300] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Memverifikasi link reset password...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h1>
      <p className="text-gray-500 text-sm mb-6">Masukkan password baru kamu.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Ulangi password baru"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]"
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
          style={{ backgroundColor: '#7FB300' }}
        >
          {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a2332] to-[#2d3748] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <Suspense fallback={<p className="text-center text-gray-500">Memuat...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
