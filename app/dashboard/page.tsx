import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single()

  const displayName = profile?.name ?? user.email ?? 'User'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">EVC</span>
            </div>
            <span className="font-semibold text-slate-800">EVC Mercato</span>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-teal-700 font-bold text-xl">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Selamat datang,</p>
              <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
              <p className="text-sm text-slate-400">{profile?.email ?? user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Pesanan Aktif', value: '0', icon: '📦' },
              { label: 'EVC Points', value: '0 pt', icon: '⭐' },
              { label: 'Tier Member', value: 'Silver', icon: '🥈' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-50 rounded-xl p-4 border border-slate-100"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-400 text-sm mt-10">
            🚧 Dashboard sedang dalam pengembangan
          </p>
        </div>
      </main>
    </div>
  )
}
