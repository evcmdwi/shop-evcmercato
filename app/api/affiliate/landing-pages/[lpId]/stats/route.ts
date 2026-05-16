/**
 * GET /api/affiliate/landing-pages/[lpId]/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns daily stats for a specific LP for the authenticated affiliate.
 * Default range: last 14 days.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Params {
  params: Promise<{ lpId: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  const { lpId } = await params

  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Verify affiliate ──────────────────────────────────────────────────────
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  // ── 3. Parse date range ──────────────────────────────────────────────────────
  const searchParams = req.nextUrl.searchParams
  const today = new Date()
  const toDate = searchParams.get('to') ?? today.toISOString().slice(0, 10)

  let fromDate = searchParams.get('from')
  if (!fromDate) {
    const d = new Date(today)
    d.setDate(d.getDate() - 13) // 14 days inclusive
    fromDate = d.toISOString().slice(0, 10)
  }

  // ── 4. Fetch daily stats ─────────────────────────────────────────────────────
  const adminSupabase = getSupabaseAdmin()

  const { data: rows, error: statsError } = await adminSupabase
    .from('landing_page_daily_stats')
    .select('date, click_count, signup_count, order_count')
    .eq('affiliate_id', affiliate.id)
    .eq('landing_page_id', lpId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true })

  if (statsError) {
    console.error('[lp-stats] fetch error:', statsError)
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 })
  }

  // ── 5. Build summary ─────────────────────────────────────────────────────────
  const daily = (rows ?? []).map((r) => ({
    date: r.date,
    clicks: r.click_count ?? 0,
    signups: r.signup_count ?? 0,
    orders: r.order_count ?? 0,
  }))

  const totals = daily.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clicks,
      signups: acc.signups + r.signups,
      orders: acc.orders + r.orders,
    }),
    { clicks: 0, signups: 0, orders: 0 },
  )

  const conversion_pct =
    totals.clicks > 0 ? Math.round((totals.orders / totals.clicks) * 100) : 0

  return NextResponse.json({
    lp_id: lpId,
    from: fromDate,
    to: toDate,
    summary: {
      total_clicks: totals.clicks,
      total_signups: totals.signups,
      total_orders: totals.orders,
      conversion_pct,
    },
    daily,
  })
}
