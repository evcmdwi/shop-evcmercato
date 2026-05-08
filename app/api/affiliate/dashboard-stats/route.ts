import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

type Period = 'current_month' | 'last_month' | 'all_time'

function getPeriodRange(period: Period): { start: string; end: string } | null {
  if (period === 'all_time') return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  if (period === 'current_month') {
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    return { start, end }
  }

  // last_month
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()
  return { start, end }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, status, affiliate_code, lifetime_pv, lifetime_orders, lifetime_members')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const periodParam = searchParams.get('period') ?? 'current_month'
  const validPeriods: Period[] = ['current_month', 'last_month', 'all_time']

  if (!validPeriods.includes(periodParam as Period)) {
    return NextResponse.json(
      { error: 'period harus salah satu dari: current_month, last_month, all_time' },
      { status: 400 }
    )
  }

  const period = periodParam as Period
  const range = getPeriodRange(period)

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Total clicks
  let clicksQuery = adminClient
    .from('short_links')
    .select('click_count')
    .eq('affiliate_id', affiliate.id)

  const { data: linksData } = await clicksQuery
  const totalClicks = (linksData ?? []).reduce((sum: number, l: { click_count: number }) => sum + (l.click_count ?? 0), 0)

  // Commissions
  let commissionsQuery = adminClient
    .from('commissions')
    .select('pv_earned, status')
    .eq('affiliate_id', affiliate.id)

  if (range) {
    commissionsQuery = commissionsQuery
      .gte('created_at', range.start)
      .lte('created_at', range.end)
  }

  const { data: commissions } = await commissionsQuery

  const totalCommissions = (commissions ?? []).length
  const validPv = (commissions ?? [])
    .filter((c: { status: string }) => c.status === 'valid')
    .reduce((sum: number, c: { pv_earned: number }) => sum + (c.pv_earned ?? 0), 0)
  const pendingPv = (commissions ?? [])
    .filter((c: { status: string }) => c.status === 'pending')
    .reduce((sum: number, c: { pv_earned: number }) => sum + (c.pv_earned ?? 0), 0)

  // Total referred members
  let membersQuery = adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by_affiliate_code', affiliate.affiliate_code)

  if (range) {
    membersQuery = membersQuery
      .gte('created_at', range.start)
      .lte('created_at', range.end)
  }

  const { count: totalMembers } = await membersQuery

  return NextResponse.json({
    period,
    total_clicks: totalClicks,
    total_commissions: totalCommissions,
    valid_pv: validPv,
    pending_pv: pendingPv,
    total_members: totalMembers ?? 0,
    lifetime_pv: affiliate.lifetime_pv,
    lifetime_orders: affiliate.lifetime_orders,
    lifetime_members: affiliate.lifetime_members,
  })
}
