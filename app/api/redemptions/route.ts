import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('point_redemptions')
    .select(`
      id, title, description, points_required, redeem_stock, redeemed_count,
      max_per_user, is_featured, active_from, active_until,
      products!inner(id, name, image_url, images),
      product_variants(id, name, price)
    `)
    .eq('is_active', true)
    .or('active_until.is.null,active_until.gt.now()')
    .order('is_featured', { ascending: false })
    .order('points_required', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ redemptions: data ?? [] })
}
