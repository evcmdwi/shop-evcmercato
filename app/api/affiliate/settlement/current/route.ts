import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentPeriod } from '@/lib/affiliate/settlement-period'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, status, affiliate_code')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const period = getCurrentPeriod()

  // days_until_settlement
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const settleDate = new Date(period.settlementDate + 'T00:00:00Z')
  const daysUntilSettlement = Math.max(
    0,
    Math.ceil((settleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  )

  const admin = getSupabaseAdmin()

  // Fetch commissions + join orders for delivered_at
  const { data: commissions, error: commError } = await admin
    .from('commissions')
    .select('order_id, pv_earned, status, valid_at, order_total, created_at')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  if (commError) {
    console.error('[affiliate/settlement/current] query error:', commError)
    return NextResponse.json({ error: 'Gagal mengambil data settlement' }, { status: 500 })
  }

  // Fetch orders to get delivered_at for each commission
  const orderIds = (commissions ?? []).map((c) => c.order_id).filter(Boolean)
  let deliveredAtMap: Record<string, string | null> = {}

  if (orderIds.length > 0) {
    const { data: orders } = await admin
      .from('orders')
      .select('id, delivered_at')
      .in('id', orderIds)

    if (orders) {
      for (const o of orders) {
        deliveredAtMap[o.id] = o.delivered_at ?? null
      }
    }
  }

  const orders = (commissions ?? []).map((c: {
    order_id: string
    pv_earned: number
    status: string
    valid_at: string | null
    order_total: number
    created_at: string
  }) => {
    const delivered_at = deliveredAtMap[c.order_id] ?? null
    const estimated_valid_at =
      c.status === 'pending' && delivered_at
        ? new Date(new Date(delivered_at).getTime() + 48 * 60 * 60 * 1000).toISOString()
        : null

    return {
      order_id: c.order_id,
      pv_earned: c.pv_earned,
      status: c.status,
      valid_at: c.valid_at,
      order_total: c.order_total,
      delivered_at,
      estimated_valid_at,
    }
  })

  const validPv = orders
    .filter((o) => o.status === 'valid')
    .reduce((sum, o) => sum + (o.pv_earned ?? 0), 0)

  const pendingPv = orders
    .filter((o) => o.status === 'pending')
    .reduce((sum, o) => sum + (o.pv_earned ?? 0), 0)

  return NextResponse.json({
    period: {
      label: period.label,
      start: period.start,
      end: period.end,
      settlement_date: period.settlementDate,
      days_until_settlement: daysUntilSettlement,
    },
    orders,
    totals: {
      valid_pv: validPv,
      pending_pv: pendingPv,
    },
  })
}
