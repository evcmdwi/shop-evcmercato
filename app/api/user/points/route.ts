import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: userData } = await admin.from('users').select('total_points, tier').eq('id', user.id).single()
  const totalPoints = (userData as any)?.total_points ?? 0
  const tier = (userData as any)?.tier ?? 'silver'

  // Tier progression
  const nextTierPoints = tier === "silver" ? 1001 : tier === "gold" ? 3001 : null
  const pointsToNext = nextTierPoints ? nextTierPoints - totalPoints : null

  const { data: transactions } = await admin
    .from('point_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({
    total_points: totalPoints,
    tier,
    points_to_next_tier: pointsToNext,
    transactions: transactions ?? [],
  })
}
