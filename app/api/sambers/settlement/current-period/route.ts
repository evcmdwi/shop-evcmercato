import { NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentPeriod } from '@/lib/affiliate/settlement-period'

export async function GET() {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const { label, start, end, settlementDate } = getCurrentPeriod()
  const admin = getSupabaseAdmin()

  const { data: commissions, error } = await admin
    .from('commissions')
    .select('id, affiliate_id, order_id, pv_earned, status, valid_at, created_at')
    .in('status', ['pending', 'valid', 'owed_back'])
    .gte('created_at', `${start}T00:00:00.000Z`)
    .lte('created_at', `${end}T23:59:59.999Z`)

  if (error) {
    console.error('[settlement/current-period] error:', error)
    return NextResponse.json({
      error: 'Failed to fetch commissions',
      _debug: { message: error.message, code: error.code, hint: error.hint, details: error.details }
    }, { status: 500 })
  }

  // Group by affiliate
  const affiliateMap = new Map<string, {
    affiliate_id: string
    affiliate_code: string
    affiliate_name: string
    kki_member_id: string | null
    orders_count: number
    total_pv: number
    owed_back_pv: number
    net_pv: number
    orders: { order_id: string; order_total: number; pv_earned: number; valid_at: string }[]
  }>()

  // Fetch affiliate details separately
  const affiliateIds = [...new Set((commissions ?? []).map(c => c.affiliate_id))]
  const { data: affiliateRows } = affiliateIds.length > 0
    ? await admin.from('affiliates').select('id, affiliate_code, full_name_kkd, kki_member_id').in('id', affiliateIds)
    : { data: [] }
  const affById: Record<string, { affiliate_code: string; full_name_kkd: string; kki_member_id: string | null }> = {}
  for (const a of affiliateRows ?? []) affById[a.id] = a

  for (const c of commissions ?? []) {
    const aff = affById[c.affiliate_id]
    if (!aff) continue

    if (!affiliateMap.has(c.affiliate_id)) {
      affiliateMap.set(c.affiliate_id, {
        affiliate_id: c.affiliate_id,
        affiliate_code: aff.affiliate_code,
        affiliate_name: aff.full_name_kkd,
        kki_member_id: aff.kki_member_id,
        orders_count: 0,
        total_pv: 0,
        owed_back_pv: 0,
        net_pv: 0,
        orders: [],
      })
    }

    const entry = affiliateMap.get(c.affiliate_id)!
    const orderTotal = 0 // order total not fetched in flat query

    if (c.status === 'owed_back') {
      entry.owed_back_pv += c.pv_earned
    } else {
      entry.total_pv += c.pv_earned
      entry.orders_count += 1
      entry.orders.push({
        order_id: c.order_id,
        order_total: orderTotal,
        pv_earned: c.pv_earned,
        valid_at: c.valid_at,
      })
    }
  }

  const affiliates = Array.from(affiliateMap.values()).map(a => ({
    ...a,
    net_pv: Math.max(0, a.total_pv - a.owed_back_pv),
  }))

  const totalOrders = affiliates.reduce((s, a) => s + a.orders_count, 0)
  const totalPv = affiliates.reduce((s, a) => s + a.net_pv, 0)

  return NextResponse.json({
    period: {
      label,
      start,
      end,
      settlement_date: settlementDate,
    },
    total_affiliates: affiliates.length,
    total_orders: totalOrders,
    total_pv: totalPv,
    affiliates,
  })
}
