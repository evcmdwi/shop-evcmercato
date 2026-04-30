import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AlamatClient from './AlamatClient'

export const metadata = {
  title: 'Alamat Pengiriman — EVC Mercato',
}

export default async function AlamatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect_to=/profile/alamat')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <a
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ‹ Kembali ke Profil
      </a>
      <AlamatClient />
    </div>
  )
}
