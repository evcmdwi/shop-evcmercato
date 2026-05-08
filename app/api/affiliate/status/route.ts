import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select(
      'id, status, applied_at, full_name_kkd, kki_member_id, affiliate_code, lifetime_pv, lifetime_orders, rejected_reason, suspended_reason, suspended_at'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[affiliate/status] query error:', error)
    return NextResponse.json({ error: 'Gagal mengambil status affiliate' }, { status: 500 })
  }

  if (!affiliate) {
    return NextResponse.json({ status: null })
  }

  switch (affiliate.status) {
    case 'pending':
      return NextResponse.json({
        status: 'pending',
        applied_at: affiliate.applied_at,
        full_name_kkd: affiliate.full_name_kkd,
        kki_member_id: affiliate.kki_member_id,
      })

    case 'approved':
      return NextResponse.json({
        status: 'approved',
        affiliate_code: affiliate.affiliate_code,
        lifetime_pv: affiliate.lifetime_pv,
        lifetime_orders: affiliate.lifetime_orders,
      })

    case 'rejected':
      return NextResponse.json({
        status: 'rejected',
        rejected_reason: affiliate.rejected_reason,
      })

    case 'suspended':
      return NextResponse.json({
        status: 'suspended',
        suspended_reason: affiliate.suspended_reason,
        suspended_at: affiliate.suspended_at,
      })

    default:
      return NextResponse.json({ status: affiliate.status })
  }
}
