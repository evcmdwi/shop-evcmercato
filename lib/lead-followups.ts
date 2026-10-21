import type { SupabaseClient } from '@supabase/supabase-js'

/** Kunci aktif lead (follow-up terakhir yang belum kedaluwarsa), jika ada. */
export async function activeLeadLock(admin: SupabaseClient, leadId: string) {
  const { data } = await admin
    .from('lead_followups')
    .select('admin_code, expires_at')
    .eq('lead_id', leadId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as { admin_code: string; expires_at: string } | null
}

export function lockMessage(lock: { admin_code: string; expires_at: string }) {
  const until = new Date(lock.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })
  return `Lead ini sedang di-follow up ${lock.admin_code} sampai ${until}`
}
