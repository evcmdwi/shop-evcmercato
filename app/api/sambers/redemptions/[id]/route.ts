import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const { id } = await params
    const admin = getSupabaseAdmin()

    const { data, error } = await admin
      .from('point_redemptions')
      .select(`
        *,
        products!inner(id, name, image_url, images),
        product_variants(id, name, price)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ redemption: data })
  } catch (err) {
    console.error('[sambers/redemptions/[id] GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const { id } = await params
    const body = await req.json()
    const admin = getSupabaseAdmin()

    // Allowed fields for partial update
    const allowedFields = [
      'title', 'description', 'points_required', 'redeem_stock', 'max_per_user',
      'is_active', 'is_featured', 'active_from', 'active_until', 'variant_id',
    ]
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    const { data, error } = await admin
      .from('point_redemptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ redemption: data })
  } catch (err) {
    console.error('[sambers/redemptions/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const { id } = await params
    const admin = getSupabaseAdmin()

    // Soft delete: set is_active = false
    const { data, error } = await admin
      .from('point_redemptions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, message: 'Redemption deactivated (soft delete)' })
  } catch (err) {
    console.error('[sambers/redemptions/[id] DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
