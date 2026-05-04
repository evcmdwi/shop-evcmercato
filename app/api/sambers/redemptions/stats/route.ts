import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Points earned this month
    const { data: earned } = await admin
      .from('point_transactions')
      .select('amount')
      .eq('type', 'earned')
      .gte('created_at', startOfMonth)

    // Points redeemed this month
    const { data: redeemed } = await admin
      .from('point_transactions')
      .select('amount')
      .eq('type', 'redeemed')
      .gte('created_at', startOfMonth)

    // Redeem orders this month
    const { count: orderCount } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('order_type', 'redeem')
      .gte('created_at', startOfMonth)

    // Fee revenue from redeem orders this month (admin_fee per order)
    const { data: config } = await admin
      .from('point_redemption_config')
      .select('admin_fee')
      .eq('id', 1)
      .single()

    const totalEarned = (earned ?? []).reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)
    const totalRedeemed = (redeemed ?? []).reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)
    const feeRevenue = (orderCount ?? 0) * ((config as any)?.admin_fee ?? 3000)

    // All-time totals
    const { count: totalRedemptions } = await admin
      .from('point_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalUsers } = await admin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', 0)

    return NextResponse.json({
      month: {
        points_earned: totalEarned,
        points_redeemed: totalRedeemed,
        redeem_orders: orderCount ?? 0,
        fee_revenue: feeRevenue,
        period_start: startOfMonth,
      },
      alltime: {
        active_redemptions: totalRedemptions ?? 0,
        users_with_points: totalUsers ?? 0,
      },
    })
  } catch (err) {
    console.error('[sambers/redemptions/stats GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
