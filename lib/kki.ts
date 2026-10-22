import type { SupabaseClient } from '@supabase/supabase-js'

// Distributor KKI lain yang ingin melihat sistem EVC: dikecualikan dari broadcast, follow up,
// pengingat bayar, dan semua diskon. Member & lead dicocokkan lewat nomor WA ternormalisasi.

export const KKI_LABEL = 'Distributor KKI'
export const KKI_EXCLUDED_MESSAGE = 'Dikecualikan: distributor KKI'

/** Sama dengan SQL normalize_id_phone: (+62)812… / 62812… / 0812… / 812… → 0812… */
export function normalizeIdPhone(raw: string | null | undefined): string | null {
  const d = (raw ?? '').replace(/\D/g, '')
  if (!d) return null
  return '0' + (d.startsWith('62') ? d.slice(2) : d).replace(/^0+/, '')
}

/** Semua nomor bertanda KKI (member + leads), format 08…. */
export async function loadKkiPhones(admin: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await admin.rpc('kki_phones')
  if (error) throw new Error(`kki_phones: ${error.message}`)
  return new Set(((data ?? []) as string[]).filter(Boolean))
}

export function isKkiPhone(phones: Set<string>, raw: string | null | undefined): boolean {
  const p = normalizeIdPhone(raw)
  return p != null && phones.has(p)
}

export async function isKkiUser(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await admin.rpc('is_kki_user', { p_user: userId })
  if (error) throw new Error(`is_kki_user: ${error.message}`)
  return data === true
}

/** Buang lead distributor KKI (ditandai langsung, atau nomornya bertanda KKI). */
export async function withoutKkiLeads<T extends { phone: string | null; kki_distributor?: boolean | null }>(
  admin: SupabaseClient,
  leads: T[]
): Promise<T[]> {
  const phones = await loadKkiPhones(admin)
  return leads.filter((l) => !l.kki_distributor && !isKkiPhone(phones, l.phone))
}
