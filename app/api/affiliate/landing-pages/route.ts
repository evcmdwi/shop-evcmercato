/**
 * GET /api/affiliate/landing-pages
 *
 * Returns all affiliate_active landing pages with:
 * - pre-created short link for this affiliate
 * - 7-day aggregate stats
 *
 * Requires: authenticated affiliate (status = 'approved')
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getOrCreateAffiliateLPShortLink } from '@/lib/affiliate/short-link-helper'

export async function GET(_req: NextRequest) {
  // ── 1. Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getSession().then(r => ({ data: { user: r.data.session?.user ?? null }, error: r.error }))

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Verify affiliate (SAME pattern as dashboard-stats) ─────────────────────
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, affiliate_code, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    console.error('[landing-pages] affiliate lookup:', affiliateError?.message, '| user_id:', user.id)
    return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  // ── 3. Fetch active landing pages (admin for landing_pages table) ───────────────
  const adminSupabase = getSupabaseAdmin()

  const { data: landingPages, error: lpError } = await adminSupabase
    .from('landing_pages')
    .select('id, slug, title, description, preview_image_url, target_audience, conversion_benchmark_pct, approved_for_affiliate_at')
    .eq('status', 'affiliate_active')
    .order('approved_for_affiliate_at', { ascending: false })

  if (lpError) {
    console.error('[affiliate/landing-pages] LP fetch error:', lpError)
    return NextResponse.json({ error: 'Gagal mengambil landing pages' }, { status: 500 })
  }

  if (!landingPages || landingPages.length === 0) {
    return NextResponse.json({ landing_pages: [] })
  }

  // ── 4. Fetch 7-day stats for all LPs for this affiliate ───────────────────
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dateFrom = sevenDaysAgo.toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: statsRows, error: statsError } = await adminSupabase
    .from('landing_page_daily_stats')
    .select('landing_page_id, click_count, signup_count, order_count')
    .eq('affiliate_id', affiliate.id)
    .gte('date', dateFrom)

  if (statsError) {
    console.error('[affiliate/landing-pages] stats fetch error:', statsError)
    // Non-fatal: continue with zero stats
  }

  // Aggregate stats per LP
  type Stats = { clicks: number; signups: number; orders: number }
  const statsMap = new Map<string, Stats>()

  for (const row of statsRows ?? []) {
    const existing = statsMap.get(row.landing_page_id) ?? { clicks: 0, signups: 0, orders: 0 }
    statsMap.set(row.landing_page_id, {
      clicks:  existing.clicks  + (row.click_count  ?? 0),
      signups: existing.signups + (row.signup_count  ?? 0),
      orders:  existing.orders  + (row.order_count   ?? 0),
    })
  }

  // ── 5. Build response — get/create short link per LP ────────────────────────
  const results = await Promise.all(
    landingPages.map(async (lp) => {
      let shortLink: { short_code: string; url: string } | null = null
      try {
        shortLink = await getOrCreateAffiliateLPShortLink(
          affiliate.id,
          lp.id,
          affiliate.affiliate_code,
        )
      } catch (err) {
        console.error(`[affiliate/landing-pages] short-link error for LP ${lp.id}:`, err)
      }

      const stats = statsMap.get(lp.id) ?? { clicks: 0, signups: 0, orders: 0 }

      return {
        id:                       lp.id,
        slug:                     lp.slug,
        title:                    lp.title,
        description:              lp.description,
        preview_image_url:        lp.preview_image_url,
        target_audience:          lp.target_audience,
        conversion_benchmark_pct: lp.conversion_benchmark_pct,
        approved_for_affiliate_at: lp.approved_for_affiliate_at,
        short_code:               shortLink?.short_code ?? null,
        short_url:                shortLink
          ? `https://evcmercato.com/s/${shortLink.short_code}`
          : null,
        target_url:               shortLink?.url ?? null,
        stats_7d: {
          clicks:  stats.clicks,
          signups: stats.signups,
          orders:  stats.orders,
        },
      }
    }),
  )

  return NextResponse.json({ landing_pages: results })
}
