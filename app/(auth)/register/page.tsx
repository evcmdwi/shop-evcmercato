'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const safeRedirect = (url: string): string => {
  if (url.startsWith('/') && !url.startsWith('//')) return url
  return '/dashboard'
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirect_to') || '/dashboard')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.')
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    if (phone.replace(/\D/g, '').length < 10) {
      setError('Nomor WhatsApp minimal 10 digit.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // 1. Sign up with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          phone: phone,
        }
      }
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Gagal mendaftar. Coba lagi.')
      setLoading(false)
      return
    }

    // 2. Insert into public.users via server-side API route (bypasses RLS using service role)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: data.user.id, email, name, phone, terms_accepted: true }),
    })

    if (!res.ok) {
      const json = (await res.json()) as { error?: string }
      setError(`Akun dibuat, tapi gagal simpan profil: ${json.error ?? 'Unknown error'}`)
      setLoading(false)
      return
    }

    // Sign out immediately so user goes through login flow
    await supabase.auth.signOut()
    // Redirect to /katalog after register; honor redirect_to if provided
    const loginUrl = redirectTo && redirectTo !== '/dashboard'
      ? `/login?redirect_to=${encodeURIComponent(redirectTo)}`
      : '/login?registered=true'
    router.push(loginUrl)
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Daftar</h2>
      <p className="text-slate-500 text-sm mb-6">
        Sudah punya akun?{' '}
        <Link
          href={`/login${redirectTo && redirectTo !== '/dashboard' ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''}`}
          className="text-teal-600 font-medium hover:underline"
        >
          Masuk di sini
        </Link>
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            Nama Lengkap
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
            Nomor WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xx..."
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 karakter"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
            Konfirmasi Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          />
        </div>

        {/* Layer 3: Terms consent */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            id="terms-accept"
            checked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[#7FB300] cursor-pointer"
          />
          <label htmlFor="terms-accept" className="text-xs text-gray-600 cursor-pointer leading-relaxed">
            Saya menyetujui{' '}
            <a href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer" className="text-[#7FB300] font-semibold hover:underline">
              Syarat &amp; Ketentuan
            </a>{' '}
            dan memahami bahwa Website ini dikelola oleh mitra usaha KKI Group secara independen, <strong>BUKAN</strong> official store KKI Group.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-2"
          style={{ backgroundColor: '#7FB300' }}
        >
          {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
        </button>
      </form>
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
