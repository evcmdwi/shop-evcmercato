import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect_to=/profile')

  // Fetch user data dari public.users
  const { data: userData } = await supabase
    .from('users')
    .select('name, email, tier, total_points')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profil Saya</h1>

      {/* Info user */}
      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[#534AB7] text-2xl font-bold">
            {userData?.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{userData?.name ?? 'Pengguna'}</h2>
            <p className="text-gray-500 text-sm">{userData?.email ?? user.email}</p>
          </div>
        </div>

        {/* EVC Points */}
        <div className="bg-[#EEEDFE] rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">EVC Points</p>
            <p className="text-2xl font-bold text-[#534AB7]">{userData?.total_points ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Tier</p>
            <p className="text-sm font-semibold text-[#534AB7] capitalize">{userData?.tier ?? 'silver'}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-xl border divide-y">
        <a href="/profile/alamat" className="flex items-center justify-between p-4 hover:bg-gray-50">
          <span>📍 Alamat Pengiriman</span>
          <span className="text-gray-400">›</span>
        </a>
        <a href="/orders" className="flex items-center justify-between p-4 hover:bg-gray-50">
          <span>📦 Riwayat Pesanan</span>
          <span className="text-gray-400">›</span>
        </a>
      </div>

      {/* Logout */}
      <LogoutButton />
    </div>
  )
}
