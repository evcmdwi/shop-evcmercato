import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AlamatClient from './AlamatClient'

export const metadata = {
  title: 'Alamat Pengiriman — EVC Mercato',
}

type Props = { searchParams: Promise<{ kembali?: string }> }

export default async function AlamatPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { kembali } = await searchParams
  const backUrl = kembali && kembali.startsWith('/') ? kembali : '/profile'

  if (!user) redirect('/login?redirect_to=/profile/alamat')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <a
        href={backUrl}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ‹ {kembali === '/checkout' ? 'Kembali ke Checkout' : 'Kembali ke Profil'}
      </a>
      <AlamatClient backUrl={backUrl} />
    </div>
  )
}
