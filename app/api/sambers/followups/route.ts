import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, effectiveAdminCode } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const SEGMENTS = ['repeat', 'dormant', 'unpaid', 'new']

// Catat follow-up: customer "dipegang" admin ini 7 hari. Closing dalam 7 hari → atribusi otomatis (trigger DB).
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const userId = String(body.user_id ?? '')
  const adminCode = effectiveAdminCode(auth.account, String(body.admin_code ?? '').trim().toUpperCase())
  const segment = String(body.segment ?? '')
  if (!userId || !SEGMENTS.includes(segment)) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { data: code } = await admin.from('admin_codes').select('code, is_active').eq('code', adminCode).maybeSingle()
  if (!code?.is_active) return NextResponse.json({ error: 'Pilih kode admin yang aktif' }, { status: 400 })

  const { data: lock } = await admin
    .from('admin_followups')
    .select('admin_code, expires_at')
    .eq('user_id', userId)
    .is('converted_order_id', null)
    .gt('expires_at', new Date().toISOString())
    .neq('admin_code', adminCode)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lock) {
    return NextResponse.json(
      { error: `Customer ini sedang di-follow up ${lock.admin_code} sampai ${new Date(lock.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })}` },
      { status: 409 }
    )
  }

  const { data, error } = await admin
    .from('admin_followups')
    .insert({ user_id: userId, admin_code: adminCode, segment })
    .select('id, admin_code, created_at, expires_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ followup: data }, { status: 201 })
}
