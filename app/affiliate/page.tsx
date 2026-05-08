import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AffiliateDashboard from './AffiliateDashboard'

export default async function AffiliatePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AffiliateDashboard userId={user.id} userEmail={user.email ?? ''} />
      </main>
    </div>
  )
}
