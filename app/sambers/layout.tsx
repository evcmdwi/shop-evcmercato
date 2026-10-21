import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { resolveAdmin } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/sambers-login')
  }

  const { isAdmin, account } = await resolveAdmin(user)

  if (!isAdmin) {
    redirect('/')
  }

  return <AdminShell account={account}>{children}</AdminShell>
}
