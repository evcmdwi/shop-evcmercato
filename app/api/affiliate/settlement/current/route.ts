import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

interface PeriodInfo {
  start: string
  end: string
  settlementDate: string
  label: string
}

function getCurrentPeriod(): PeriodInfo {
  const now = new Date()
  const day = now.getDate()
  const month = now.getMonth()
  const year = now.getFullYear()

  if (day >= 27) {
    // Periode A: 27 ini → 14 bulan depan
    const start = new Date(year, month, 27)
    const end = new Date(year, month + 1, 14)
    const settle = new Date(year, month + 1, 15)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      settlementDate: settle.toISOString().split('T')[0],
      label: `Periode A ${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`,
    }
  } else if (day >= 15) {
    // Periode B: 15 ini → 26 ini, settle 27
    const start = new Date(year, month, 15)
    const end = new Date(year, month, 26)
    const settle = new Date(year, month, 27)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      settlementDate: settle.toISOString().split('T')[0],
      label: `Periode B ${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`,
    }
  } else {
    // Periode A: 27 bulan lalu → 14 ini, settle 15
    const start = new Date(year, month - 1, 27)
    const end = new Date(year, month, 14)
    const settle = new Date(year, month, 15)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      settlementDate: settle.toISOString().split('T')[0],
      label: `Periode A ${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`,
    }
  }
}

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

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: commissions, error: commError } = await adminClient
    .from('commissions')
    .select('order_id, pv_earned, status, valid_at, order_total, created_at')
    .eq('affiliate_id', affiliate.id)
    
    
    .order('created_at', { ascending: false })

  if (commError) {
    console.error('[affiliate/settlement/current] query error:', commError)
    return NextResponse.json({ error: 'Gagal mengambil data settlement' }, { status: 500 })
  }

  const orders = (commissions ?? []).map((c: {
    order_id: string
    pv_earned: number
    status: string
    valid_at: string | null
    order_total: number
  }) => ({
    order_id: c.order_id,
    pv_earned: c.pv_earned,
    status: c.status,
    valid_at: c.valid_at,
    order_total: c.order_total,
  }))

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
    },
    orders,
    totals: {
      valid_pv: validPv,
      pending_pv: pendingPv,
    },
  })
}
