import { createClient } from '@/lib/supabase-server'

export async function checkAdminAuth(): Promise<{ ok: boolean; userId?: string; status?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { ok: false, status: 401 }
    }

    const adminEmails = (process.env.ADMIN_EMAIL ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    const isAdmin = adminEmails.includes(user.email?.toLowerCase() ?? '')

    if (!isAdmin) {
      return { ok: false, status: 403 }
    }

    return { ok: true, userId: user.id }
  } catch {
    return { ok: false, status: 500 }
  }
}
