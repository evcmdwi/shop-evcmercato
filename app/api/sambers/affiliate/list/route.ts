import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

  const admin = getSupabaseAdmin()

  let query = admin
    .from('affiliates')
    .select(
      'id, affiliate_code, full_name_kkd, kki_member_id, director_leader, whatsapp, email, status, lifetime_pv, lifetime_orders, lifetime_members, approved_at',
      { count: 'exact' }
    )
    .order('approved_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  } else {
    // Default: exclude pending/rejected for "affiliate list"
    query = query.in('status', ['approved', 'suspended'])
  }

  if (search) {
    query = query.or(`full_name_kkd.ilike.%${search}%,affiliate_code.ilike.%${search}%,kki_member_id.ilike.%${search}%`)
  }

  const { data: affiliates, error, count } = await query

  if (error) {
    console.error('[GET /api/sambers/affiliate/list]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ affiliates: affiliates ?? [], total: count ?? 0 })
}
