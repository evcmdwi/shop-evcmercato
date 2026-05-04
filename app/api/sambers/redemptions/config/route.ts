import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('point_redemption_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ config: data })
  } catch (err) {
    console.error('[sambers/redemptions/config GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const body = await req.json()
    const { shipping_cost, admin_fee } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (shipping_cost !== undefined) updateData.shipping_cost = parseInt(shipping_cost)
    if (admin_fee !== undefined) updateData.admin_fee = parseInt(admin_fee)

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Get admin user id
    const { createClient } = await import('@/lib/supabase-server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) updateData.updated_by = user.id

    const { data, error } = await admin
      .from('point_redemption_config')
      .update(updateData)
      .eq('id', 1)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ config: data })
  } catch (err) {
    console.error('[sambers/redemptions/config PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
