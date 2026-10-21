import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizePhone } from '@/lib/admin-orders'

// Password awal member yang ditambah admin (keputusan Dwi); member bisa menggantinya
// sendiri atau tetap memakainya.
export const DEFAULT_MEMBER_PASSWORD = '123456'

type Result = { ok: true; id: string; email: string; phone: string } | { ok: false; error: string; status: number }

/** Admin membuat akun member: login = email + DEFAULT_MEMBER_PASSWORD. Menolak email/WA dobel. */
export async function createMemberAccount(
  admin: SupabaseClient,
  input: { name?: string; phone?: string; email?: string }
): Promise<Result> {
  const name = (input.name ?? '').trim()
  const phone = normalizePhone(input.phone ?? '')
  const email = (input.email ?? '').trim().toLowerCase()
  if (!name) return { ok: false, error: 'Nama wajib diisi', status: 400 }
  if (!/^08\d{7,12}$/.test(phone)) return { ok: false, error: 'No. WA tidak valid (contoh: 081234567890)', status: 400 }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Email tidak valid', status: 400 }

  const { data: sameEmail } = await admin
    .from('users').select('id').ilike('email', email.replace(/[\\%_]/g, '\\$&')).limit(1).maybeSingle()
  if (sameEmail) return { ok: false, error: 'Email ini sudah terdaftar sebagai member', status: 409 }
  const { data: samePhone } = await admin
    .from('users').select('id, name').in('phone', [phone, '62' + phone.slice(1), '+62' + phone.slice(1)]).limit(1).maybeSingle()
  if (samePhone) return { ok: false, error: `No. WA ini sudah dipakai member ${samePhone.name || 'lain'}`, status: 409 }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_MEMBER_PASSWORD,
    email_confirm: true,
    user_metadata: { name, phone },
  })
  if (createErr || !created.user) {
    console.error('[createMemberAccount] create user:', createErr?.message)
    return { ok: false, error: 'Gagal membuat member: ' + (createErr?.message ?? 'unknown'), status: 500 }
  }
  // Trigger handle_new_user membuat baris users; pastikan nama & WA terisi.
  const { error: upErr } = await admin
    .from('users').upsert({ id: created.user.id, email, name, phone }, { onConflict: 'id' })
  if (upErr) console.error('[createMemberAccount] upsert users:', upErr.message)

  return { ok: true, id: created.user.id, email, phone }
}
