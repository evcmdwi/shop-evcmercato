import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit
    const activeOnly = searchParams.get('active') === 'true'

    let query = admin
      .from('point_redemptions')
      .select(`
        id, title, description, points_required, redeem_stock, redeemed_count,
        max_per_user, is_active, is_featured, active_from, active_until, created_at, updated_at,
        products!inner(id, name, image_url),
        product_variants(id, name, price)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (activeOnly) query = query.eq('is_active', true)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      redemptions: data ?? [],
      total: count ?? 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('[sambers/redemptions GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const body = await req.json()
    const {
      product_id,
      variant_id,
      points_required,
      redeem_stock,
      max_per_user,
      title,
      description,
      is_featured,
      active_until,
    } = body

    if (!product_id || !points_required || !redeem_stock || !title) {
      return NextResponse.json({ error: 'Missing required fields: product_id, points_required, redeem_stock, title' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Get admin user id from auth
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await admin
      .from('point_redemptions')
      .insert({
        product_id,
        variant_id: variant_id || null,
        points_required: parseInt(points_required),
        redeem_stock: parseInt(redeem_stock),
        max_per_user: max_per_user ? parseInt(max_per_user) : 1,
        title,
        description: description || null,
        is_featured: is_featured ?? false,
        active_until: active_until || null,
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ redemption: data }, { status: 201 })
  } catch (err) {
    console.error('[sambers/redemptions POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
