import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface AdminAccount {
  username: string
  admin_code: string | null
  is_owner: boolean
}

/** Akun login Sambers (username) milik user ini, null bila tidak ada / nonaktif. */
export async function getAdminAccount(userId: string): Promise<AdminAccount | null> {
  const { data } = await getSupabaseAdmin()
    .from('admin_accounts')
    .select('username, admin_code, is_owner')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  return data ?? null
}

/** Admin = punya akun di admin_accounts, atau email-nya ada di env ADMIN_EMAIL (cara lama). */
export async function resolveAdmin(user: User): Promise<{ isAdmin: boolean; account: AdminAccount | null }> {
  const account = await getAdminAccount(user.id)
  if (account) return { isAdmin: true, account }
  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return { isAdmin: adminEmails.includes(user.email?.toLowerCase() ?? ''), account: null }
}

/**
 * Kode admin yang dipakai untuk mencatat FU / pesanan. Admin biasa selalu memakai kode
 * akunnya sendiri (tidak bisa mencatat atas nama admin lain); pemilik & login lama via
 * email bebas memilih.
 */
export function effectiveAdminCode(account: AdminAccount | null | undefined, requested: string): string {
  if (account && !account.is_owner && account.admin_code) return account.admin_code
  return requested
}

export async function checkAdminAuth(): Promise<{ ok: boolean; userId?: string; account?: AdminAccount | null; status?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { ok: false, status: 401 }
    }

    const { isAdmin, account } = await resolveAdmin(user)
    if (!isAdmin) {
      return { ok: false, status: 403 }
    }

    return { ok: true, userId: user.id, account }
  } catch {
    return { ok: false, status: 500 }
  }
}
