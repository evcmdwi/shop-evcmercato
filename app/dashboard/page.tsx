import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  const { count: activeOrderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['paid', 'processed', 'shipped'])

  const tier = userData?.tier?.toLowerCase() ?? 'silver'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {/* User Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-teal-700 font-bold text-xl">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500">Selamat datang,</p>
              <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
              <p className="text-sm text-gray-500">{userData?.email ?? user.email}</p>
              <div className="mt-1 flex items-center gap-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  tier === 'platinum' ? 'bg-violet-100 text-violet-700' :
                  tier === 'gold' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {tier === 'platinum' ? '💎 Member Platinum' :
                   tier === 'gold' ? '⭐ Member Gold' :
                   '🥈 Member Silver'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Boxes — 2 boxes, 1 row, clickable */}
          <div className="flex gap-3 mb-4">
            {/* Box 1: Pesanan Aktif — clickable ke /orders */}
            <Link href="/orders" prefetch={false} className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-1">📦</div>
              <p className="text-2xl font-bold text-gray-900">{activeOrderCount ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Pesanan Aktif</p>
            </Link>

            {/* Box 2: EVC Points — clickable ke /poin */}
            <Link href="/poin" prefetch={false} className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-2xl mb-1">💎</div>
              <p className="text-2xl font-bold text-amber-600">{userData?.total_points ?? 0} pt</p>
              <p className="text-sm text-gray-500 mt-1">EVC Points</p>
            </Link>
          </div>

          {/* Evie Health Poster */}
          <a
            href="https://t.me/evie_evc_bot?start=6285820852908"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden hover:opacity-95 transition-opacity cursor-pointer"
          >
            <div className="relative w-full aspect-square">
              <Image
                src="/evie-health-reference.jpg"
                alt="Evie Health — Konsultasi Kesehatan 24 Jam"
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-white py-2 px-3 text-center">
              <p className="text-sm text-gray-500 italic">Klik untuk konsultasi dengan Evie</p>
            </div>
          </a>
        </div>
      </main>
    </div>
  )
}
