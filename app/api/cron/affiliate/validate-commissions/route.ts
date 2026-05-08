import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { notifyCommissionValid } from '@/lib/affiliate/notifications'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: pending } = await admin
    .from('commissions')
    .select('id, affiliate_id, pv_earned')
    .eq('status', 'pending')
    .not('order_delivered_at', 'is', null)
    .lte('order_delivered_at', twoDaysAgo)

  let validated = 0
  for (const commission of pending || []) {
    try {
      await admin.from('commissions').update({ status: 'valid', valid_at: new Date().toISOString() }).eq('id', commission.id)
      const { data: aff } = await admin.from('affiliates').select('lifetime_pv, lifetime_orders').eq('id', commission.affiliate_id).single()
      if (aff) await admin.from('affiliates').update({ lifetime_pv: (aff.lifetime_pv || 0) + commission.pv_earned, lifetime_orders: (aff.lifetime_orders || 0) + 1 }).eq('id', commission.affiliate_id)
      notifyCommissionValid(commission.id).catch(console.error)
      validated++
    } catch (e) { console.error('[cron] commission validate failed:', commission.id, e) }
  }

  console.log(`[cron] affiliate validate-commissions: ${validated}/${pending?.length || 0}`)
  return NextResponse.json({ validated, checked: pending?.length || 0 })
}
