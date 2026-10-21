import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { LEAD_LOCK_DAYS } from '@/lib/followup-target'
import { activeLeadLock, lockMessage } from '@/lib/lead-followups'

// Catat follow-up lead: lead dipegang admin ini LEAD_LOCK_DAYS hari.
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const leadId = String(body.lead_id ?? '')
  const adminCode = String(body.admin_code ?? '').trim().toUpperCase()
  if (!leadId) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: code } = await admin.from('admin_codes').select('code, is_active').eq('code', adminCode).maybeSingle()
  if (!code?.is_active) return NextResponse.json({ error: 'Pilih kode admin yang aktif' }, { status: 400 })

  const { data: lead } = await admin.from('leads').select('id, status').eq('id', leadId).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 })
  if (lead.status === 'converted') return NextResponse.json({ error: 'Lead ini sudah jadi member' }, { status: 409 })

  const lock = await activeLeadLock(admin, leadId)
  if (lock && lock.admin_code !== adminCode) return NextResponse.json({ error: lockMessage(lock) }, { status: 409 })

  const { data, error } = await admin
    .from('lead_followups')
    .insert({ lead_id: leadId, admin_code: adminCode, expires_at: new Date(Date.now() + LEAD_LOCK_DAYS * 86400000).toISOString() })
    .select('id, admin_code, created_at, expires_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (lead.status === 'new') {
    await admin.from('leads').update({ status: 'contacted', updated_at: new Date().toISOString() }).eq('id', leadId)
  }
  return NextResponse.json({ followup: data }, { status: 201 })
}
