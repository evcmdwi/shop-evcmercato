/**
 * GET /api/affiliate/landing-pages/[id]/stats
 *
 * Returns detailed daily stats for a specific landing page for the
 * authenticated affiliate.
 *
 * Query params:
 *   from  YYYY-MM-DD  (default: 30 days ago)
 *   to    YYYY-MM-DD  (default: today)
 *   Max range: 90 days
 *
 * Requires: authenticated affiliate (status = 'approved')
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// ── Date helpers ────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const msPerDay = 86_400_000
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / msPerDay)
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime())
}

// ── Route ───────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: lpId } = await params

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Verify affiliate ────────────────────────────────────────────────────
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, code, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  // ── 3. Parse & validate date range ────────────────────────────────────────
  const today = toDateString(new Date())
  const thirtyDaysAgo = toDateString(new Date(Date.now() - 30 * 86_400_000))

  const rawFrom = req.nextUrl.searchParams.get('from') ?? thirtyDaysAgo
  const rawTo   = req.nextUrl.searchParams.get('to')   ?? today

  if (!isValidDate(rawFrom) || !isValidDate(rawTo)) {
    return NextResponse.json(
      { error: 'Parameter from/to harus format YYYY-MM-DD' },
      { status: 400 },
    )
  }

  if (rawFrom > rawTo) {
    return NextResponse.json(
      { error: 'Parameter from tidak boleh lebih besar dari to' },
      { status: 400 },
    )
  }

  const rangeDays = daysBetween(rawFrom, rawTo)
  if (rangeDays > 90) {
    return NextResponse.json(
      { error: 'Rentang tanggal maksimal 90 hari' },
      { status: 400 },
    )
  }

  // ── 4. Validate landing page exists & is affiliate_active ─────────────────
  const adminSupabase = getSupabaseAdmin()

  const { data: lp, error: lpError } = await adminSupabase
    .from('landing_pages')
    .select('id, title')
    .eq('id', lpId)
    .eq('status', 'affiliate_active')
    .maybeSingle()

  if (lpError) {
    console.error('[affiliate/landing-pages/stats] LP fetch error:', lpError)
    return NextResponse.json({ error: 'Gagal memvalidasi landing page' }, { status: 500 })
  }

  if (!lp) {
    return NextResponse.json({ error: 'Landing page tidak ditemukan' }, { status: 404 })
  }

  // ── 5. Get short link for this affiliate × LP combo ───────────────────────
  const { data: shortLink } = await adminSupabase
    .from('short_links')
    .select('short_code, target_url')
    .eq('affiliate_id', affiliate.id)
    .eq('landing_page_id', lpId)
    .eq('link_type', 'landing_page')
    .eq('status', 'active')
    .maybeSingle()

  // ── 6. Query daily stats ───────────────────────────────────────────────────
  const { data: statsRows, error: statsError } = await adminSupabase
    .from('landing_page_daily_stats')
    .select('date, click_count, signup_count, order_count')
    .eq('affiliate_id', affiliate.id)
    .eq('landing_page_id', lpId)
    .gte('date', rawFrom)
    .lte('date', rawTo)
    .order('date', { ascending: true })

  if (statsError) {
    console.error('[affiliate/landing-pages/stats] stats fetch error:', statsError)
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 })
  }

  // ── 7. Calculate summary totals ───────────────────────────────────────────
  let totalClicks  = 0
  let totalSignups = 0
  let totalOrders  = 0

  const daily = (statsRows ?? []).map((row) => {
    const clicks  = row.click_count  ?? 0
    const signups = row.signup_count ?? 0
    const orders  = row.order_count  ?? 0

    totalClicks  += clicks
    totalSignups += signups
    totalOrders  += orders

    return {
      date:    row.date,
      clicks,
      signups,
      orders,
    }
  })

  // conversion_rate_pct = orders / clicks * 100, rounded to 2 dp
  const conversionRatePct =
    totalClicks > 0
      ? Math.round((totalOrders / totalClicks) * 10_000) / 100
      : 0

  // ── 8. Build response ─────────────────────────────────────────────────────
  return NextResponse.json({
    lp_id:    lp.id,
    lp_title: lp.title,
    short_link: shortLink
      ? {
          code: shortLink.short_code,
          url:  `https://shop.evcmercato.com/r/${shortLink.short_code}`,
        }
      : null,
    period: {
      from: rawFrom,
      to:   rawTo,
    },
    summary: {
      total_clicks:          totalClicks,
      total_signups:         totalSignups,
      total_orders:          totalOrders,
      conversion_rate_pct:   conversionRatePct,
    },
    daily,
  })
}
