import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const promoType = searchParams.get('promo_type')
    const activeOnly = searchParams.get('active') === 'true'

    let query = admin
      .from('point_promos')
      .select(`
        id, promo_type, title, is_active, active_until, created_at,
        bonus_points, points_multiplier, product_id, variant_id,
        products(id, name, image_url),
        product_variants(id, name)
      `)
      .order('created_at', { ascending: false })

    if (promoType) query = query.eq('promo_type', promoType)
    if (activeOnly) query = query.eq('is_active', true)

    const { data, error } = await query

    if (error) {
      // Table might not exist yet — return empty gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ promos: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ promos: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const body = await req.json()
    const { promo_type, title, bonus_points, points_multiplier, product_id, variant_id, active_until } = body

    if (!promo_type || !['new_user', 'purchase_bonus'].includes(promo_type)) {
      return NextResponse.json({ error: 'promo_type harus new_user atau purchase_bonus' }, { status: 400 })
    }
    if (!title) return NextResponse.json({ error: 'title wajib diisi' }, { status: 400 })

    if (promo_type === 'new_user' && (!bonus_points || bonus_points < 1)) {
      return NextResponse.json({ error: 'bonus_points wajib diisi untuk new_user promo' }, { status: 400 })
    }
    if (promo_type === 'purchase_bonus' && !product_id) {
      return NextResponse.json({ error: 'product_id wajib untuk purchase_bonus promo' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      promo_type,
      title,
      is_active: true,
      active_until: active_until ?? null,
    }
    if (promo_type === 'new_user') insertData.bonus_points = bonus_points
    if (promo_type === 'purchase_bonus') {
      insertData.product_id = product_id
      insertData.variant_id = variant_id ?? null
      insertData.points_multiplier = points_multiplier ?? 2.0
    }

    const { data, error } = await admin
      .from('point_promos')
      .insert(insertData)
      .select(`
        id, promo_type, title, is_active, active_until, created_at,
        bonus_points, points_multiplier, product_id, variant_id,
        products(id, name, image_url),
        product_variants(id, name)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ promo: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
