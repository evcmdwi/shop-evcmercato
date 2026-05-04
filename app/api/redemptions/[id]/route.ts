import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const admin = getSupabaseAdmin()

  const { data: redemption } = await admin
    .from('point_redemptions')
    .select(`*, products!inner(id, name, image_url, images), product_variants(id, name, price)`)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!redemption) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check user auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userEligible = false, userPointsBalance = 0, userAlreadyRedeemed = 0, canRedeem = false

  if (user) {
    const { data: userData } = await admin.from('users').select('total_points').eq('id', user.id).single()
    userPointsBalance = (userData as any)?.total_points ?? 0

    const { count } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('redemption_id', id)
      .in('status', ['paid', 'processed', 'shipped', 'delivered'])

    userAlreadyRedeemed = count ?? 0
    const stockAvailable = redemption.redeem_stock - redemption.redeemed_count
    userEligible = userPointsBalance >= redemption.points_required
    canRedeem = userEligible && stockAvailable > 0 && userAlreadyRedeemed < redemption.max_per_user
  }

  return NextResponse.json({
    redemption,
    user_eligible: userEligible,
    user_points_balance: userPointsBalance,
    user_already_redeemed: userAlreadyRedeemed,
    can_redeem: canRedeem,
  })
}
