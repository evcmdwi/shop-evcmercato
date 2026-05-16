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

  // Aggregate real PV from commissions (lifetime_pv may be stale)
  const affiliateIds = (affiliates ?? []).map((a: { id: string }) => a.id)
  let pvMap: Record<string, number> = {}
  let ordersMap: Record<string, number> = {}

  if (affiliateIds.length > 0) {
    const { data: commissions } = await admin
      .from('commissions')
      .select('affiliate_id, pv_earned')
      .in('affiliate_id', affiliateIds)
      .in('status', ['pending', 'valid'])

    for (const c of commissions ?? []) {
      pvMap[c.affiliate_id] = (pvMap[c.affiliate_id] ?? 0) + c.pv_earned
      ordersMap[c.affiliate_id] = (ordersMap[c.affiliate_id] ?? 0) + 1
    }
  }

  const enriched = (affiliates ?? []).map((a: Record<string, unknown>) => ({
    ...a,
    lifetime_pv: pvMap[a.id as string] ?? a.lifetime_pv ?? 0,
    lifetime_orders: ordersMap[a.id as string] ?? a.lifetime_orders ?? 0,
  }))

  return NextResponse.json({ affiliates: enriched, total: count ?? 0 })
}
