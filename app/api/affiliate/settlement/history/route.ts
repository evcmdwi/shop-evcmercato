import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPreviousPeriods, getOrCreatePeriodRecord } from '@/lib/affiliate/settlement-period'

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

  const admin = getSupabaseAdmin()
  const periods = getPreviousPeriods(6)

  const history = await Promise.all(
    periods.map(async (period) => {
      // Ensure period record exists in DB and get its id
      let periodId: string | null = null
      try {
        periodId = await getOrCreatePeriodRecord({
          period_label: period.label,
          period_type: period.type,
          period_start: period.start + 'T00:00:00Z',
          period_end: period.end + 'T23:59:59Z',
          settlement_date: period.settlementDate,
        })
      } catch (e) {
        console.error('[settlement/history] getOrCreatePeriodRecord error:', e)
      }

      // Query commissions for this period
      const { data: commissions, error: commError } = await admin
        .from('commissions')
        .select('order_id, pv_earned, status, valid_at, order_total')
        .eq('affiliate_id', affiliate.id)
        .in('status', ['valid', 'settled'])
        .gte('created_at', period.start + 'T00:00:00Z')
        .lte('created_at', period.end + 'T23:59:59Z')

      if (commError) {
        console.error('[settlement/history] commissions query error:', commError)
      }

      const commList = (commissions ?? []).map((c) => ({
        order_id: c.order_id,
        pv_earned: c.pv_earned,
        valid_at: c.valid_at,
        order_total: c.order_total ?? 0,
      }))

      const totalValidPv = commList.reduce((sum, c) => sum + (c.pv_earned ?? 0), 0)
      const totalTransactions = commList.length

      // Look up settlement_processing
      let processingStatus: string | null = null
      let processedAt: string | null = null

      if (periodId) {
        const { data: sp } = await admin
          .from('settlement_processing')
          .select('processing_status, processed_at')
          .eq('period_id', periodId)
          .eq('affiliate_id', affiliate.id)
          .maybeSingle()

        if (sp) {
          processingStatus = sp.processing_status
          processedAt = sp.processed_at
        }
      }

      return {
        period_label: period.label,
        period_start: period.start,
        period_end: period.end,
        settlement_date: period.settlementDate,
        total_valid_pv: totalValidPv,
        total_transactions: totalTransactions,
        processing_status: processingStatus ?? 'pending',
        processed_at: processedAt,
        commissions: commList,
      }
    })
  )

  // Filter out periods with zero transactions (nothing to show)
  const filtered = history.filter((h) => h.total_transactions > 0)

  return NextResponse.json({ history: filtered })
}
