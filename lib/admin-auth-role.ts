import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { resolveAdmin } from '@/lib/admin-auth'

export type AdminRole = 'admin_evc' | 'super_admin' | null

export interface AdminAuthResult {
  ok: boolean
  userId?: string
  role?: AdminRole
  status?: number
}

/**
 * Check admin auth AND return user role from users table.
 * Admin = admin_accounts atau env ADMIN_EMAIL (lihat resolveAdmin).
 */
export async function checkAdminAuthWithRole(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { ok: false, status: 401 }
    }

    const { isAdmin } = await resolveAdmin(user)
    if (!isAdmin) {
      return { ok: false, status: 403 }
    }

    // Fetch role from users table
    const admin = getSupabaseAdmin()
    const { data: userData } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (userData?.role as AdminRole) ?? 'admin_evc'

    return { ok: true, userId: user.id, role }
  } catch {
    return { ok: false, status: 500 }
  }
}
