import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  // Fetch user profile from public.users (includes total_points, tier)
  const { data: userData } = await supabase
    .from('users')
    .select('name, email, total_points, tier')
    .eq('id', user.id)
    .single()

  const displayName = userData?.name ?? user.email ?? 'User'

  // Fetch count orders aktif (status: paid, processed, shipped)
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .in('status', ['paid', 'processed', 'shipped'])

  const activeOrderCount = activeOrders?.length ?? 0

  const tierLabel = userData?.tier
    ? userData.tier.charAt(0).toUpperCase() + userData.tier.slice(1).toLowerCase()
    : 'Silver'

  const tierIcon =
    tierLabel === 'Gold' ? '🥇' : tierLabel === 'Platinum' ? '💎' : '🥈'

  return (
    <div className="min-h-screen bg-slate-50">
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
              <p className="text-sm text-slate-400">{userData?.email ?? user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-2xl font-bold text-slate-800">{activeOrderCount}</p>
              <p className="text-sm text-slate-500 mt-0.5">Pesanan Aktif</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-2xl font-bold text-slate-800">{userData?.total_points ?? 0} pt</p>
              <p className="text-sm text-slate-500 mt-0.5">EVC Points</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl mb-2">{tierIcon}</div>
              <p className="text-2xl font-bold text-slate-800">{tierLabel}</p>
              <p className="text-sm text-slate-500 mt-0.5">Tier Member</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/katalog"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#7FB300] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4338a0] transition-colors"
            >
              🛍️ Lanjut Belanja
            </Link>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            🚧 Dashboard sedang dalam pengembangan
          </p>
        </div>
      </main>
    </div>
  )
}
