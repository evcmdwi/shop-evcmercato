import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/sambers/orders/[id] — order detail with items + user + address
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json(
      { data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { id } = await params

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(
      `
      id,
      status,
      total_amount,
      subtotal,
      shipping_cost,
      service_fee,
      created_at,
      paid_at,
      shipped_at,
      tracking_number,
      xendit_invoice_url,
      profiles!orders_user_id_fkey (
        full_name,
        email,
        phone
      ),
      order_items (
        id,
        quantity,
        price,
        subtotal,
        product_variants (
          id,
          name,
          sku,
          products (
            id,
            name,
            images
          )
        )
      ),
      shipping_addresses (
        recipient_name,
        recipient_phone,
        address_line1,
        address_line2,
        city,
        province,
        postal_code
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ data: { order } })
}

// PATCH /api/sambers/orders/[id] — update status + tracking_number
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json(
      { data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { id } = await params
  const body = await req.json() as { status?: string; tracking_number?: string }

  // Fetch current order status
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    paid: ['shipped', 'delivered'],
    shipped: ['delivered'],
  }

  if (body.status) {
    const allowed = validTransitions[existing.status as string] ?? []
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${existing.status} → ${body.status}` },
        { status: 400 }
      )
    }
  }

  const updateData: Record<string, unknown> = {}
  if (body.status) {
    updateData.status = body.status
    if (body.status === 'shipped') {
      updateData.shipped_at = new Date().toISOString()
    }
  }
  if (body.tracking_number !== undefined) {
    updateData.tracking_number = body.tracking_number
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select('id, status, tracking_number, shipped_at')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ data: { order: updated } })
}
