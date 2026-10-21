import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, effectiveAdminCode } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const RESULT_STATUS: Record<string, string> = {
  replied: 'contacted',
  no_reply: 'contacted',
  interested: 'interested',
  not_interested: 'not_interested',
  invalid: 'invalid',
}

// Admin mencatat hasil follow-up lead (hanya follow-up terakhir miliknya sendiri).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const result = String(body.result ?? '')
  const adminCode = effectiveAdminCode(auth.account, String(body.admin_code ?? '').trim().toUpperCase())
  if (!RESULT_STATUS[result]) return NextResponse.json({ error: 'Hasil tidak valid' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: fu } = await admin.from('lead_followups').select('id, lead_id, admin_code').eq('id', id).maybeSingle()
  if (!fu) return NextResponse.json({ error: 'Follow up tidak ditemukan' }, { status: 404 })
  if (fu.admin_code !== adminCode) return NextResponse.json({ error: `Follow up ini milik ${fu.admin_code}` }, { status: 403 })

  const now = new Date().toISOString()
  const { error } = await admin.from('lead_followups').update({ result, result_at: now }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await admin.from('leads').update({ status: RESULT_STATUS[result], updated_at: now }).eq('id', fu.lead_id).neq('status', 'converted')
  return NextResponse.json({ ok: true })
}
