import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, effectiveAdminCode } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createMemberAccount, DEFAULT_MEMBER_PASSWORD } from '@/lib/admin-members'
import { activeLeadLock, lockMessage } from '@/lib/lead-followups'
import { LEAD_MEMBER_LOCK_DAYS } from '@/lib/followup-target'

// Admin mendaftarkan lead jadi member → Join tercatat untuk admin ini, member dipegang
// LEAD_MEMBER_LOCK_DAYS hari supaya belanja pertamanya jadi closing admin ini.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { admin_code?: string; name?: string; phone?: string; email?: string }
  const adminCode = effectiveAdminCode(auth.account, String(body.admin_code ?? '').trim().toUpperCase())

  const admin = getSupabaseAdmin()
  const { data: code } = await admin.from('admin_codes').select('code, is_active').eq('code', adminCode).maybeSingle()
  if (!code?.is_active) return NextResponse.json({ error: 'Pilih kode admin yang aktif' }, { status: 400 })

  const { data: lead } = await admin.from('leads').select('id, converted_user_id').eq('id', id).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 })
  if (lead.converted_user_id) return NextResponse.json({ error: 'Lead ini sudah jadi member' }, { status: 409 })
  const lock = await activeLeadLock(admin, id)
  if (lock && lock.admin_code !== adminCode) return NextResponse.json({ error: lockMessage(lock) }, { status: 409 })

  const res = await createMemberAccount(admin, body)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })

  // Trigger mark_lead_converted sudah menandai lead bila nomornya sama & lead dikunci admin ini;
  // lengkapi untuk lead yang belum pernah di-FU atau nomornya diganti saat daftar.
  const now = new Date().toISOString()
  await admin
    .from('leads')
    .update({ status: 'converted', converted_user_id: res.id, converted_at: now, converted_by_admin: adminCode, updated_at: now })
    .eq('id', id)
    .is('converted_by_admin', null)
  const { data: existing } = await admin.from('admin_followups').select('id').eq('user_id', res.id).eq('lead_id', id).limit(1).maybeSingle()
  if (!existing) {
    await admin.from('admin_followups').insert({
      user_id: res.id,
      admin_code: adminCode,
      segment: 'new',
      lead_id: id,
      expires_at: new Date(Date.now() + LEAD_MEMBER_LOCK_DAYS * 86400000).toISOString(),
    })
  }
  return NextResponse.json({ id: res.id, email: res.email, phone: res.phone, password: DEFAULT_MEMBER_PASSWORD })
}
