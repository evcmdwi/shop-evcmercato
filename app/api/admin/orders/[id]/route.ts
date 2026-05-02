import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  emitOrderProcessed,
  emitOrderShipped,
  emitOrderDelivered,
  type OrderStatusChangePayload,
} from '@/lib/events/order-events'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/admin/orders/[id] — order detail with items + user + address
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

// PATCH /api/admin/orders/[id] — update status + tracking_number
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json(
      { data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { id } = await params
  const body = await req.json() as {
    status?: string
    tracking_number?: string
    shipping_courier?: string
    delivered_note?: string
  }

  const { status, tracking_number, shipping_courier, delivered_note } = body

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
    paid: ['processed', 'shipped', 'delivered'],
    processed: ['shipped'],
    shipped: ['delivered'],
  }

  if (status) {
    const allowed = validTransitions[existing.status as string] ?? []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${existing.status} → ${status}` },
        { status: 400 }
      )
    }
  }

  const updateData: Record<string, unknown> = {}

  if (status === 'processed') {
    updateData.status = 'processed'
    updateData.processed_at = new Date().toISOString()
  } else if (status === 'shipped') {
    if (!tracking_number || !shipping_courier) {
      return NextResponse.json(
        { error: 'Nomor resi dan ekspedisi wajib diisi' },
        { status: 400 }
      )
    }
    updateData.status = 'shipped'
    updateData.tracking_number = tracking_number
    updateData.shipping_courier = shipping_courier
    updateData.shipped_at = new Date().toISOString()
  } else if (status === 'delivered') {
    updateData.status = 'delivered'
    updateData.delivered_at = new Date().toISOString()
    updateData.delivered_note = delivered_note || null
  } else if (status) {
    updateData.status = status
  }

  if (tracking_number !== undefined && status !== 'shipped') {
    updateData.tracking_number = tracking_number
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select('id, status, tracking_number, shipped_at, processed_at, delivered_at, shipping_courier')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Emit WA events for status transitions
  if (status && ['processed', 'shipped', 'delivered'].includes(status)) {
    try {
      const { data: orderInfo } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, shipping_phone, shipping_recipient_name, shipping_courier, tracking_number')
        .eq('id', id)
        .single()

      const { data: userInfo } = orderInfo?.user_id
        ? await supabaseAdmin
            .from('profiles')
            .select('full_name, phone')
            .eq('id', orderInfo.user_id)
            .single()
        : { data: null }

      const eventPayload: OrderStatusChangePayload = {
        orderId: id,
        orderShortId: id.slice(0, 8).toUpperCase(),
        customerName: (userInfo as any)?.full_name || orderInfo?.shipping_recipient_name || 'Customer',
        payerPhone: (userInfo as any)?.phone || orderInfo?.shipping_phone || '',
        status,
        courier: (updateData.shipping_courier as string) || undefined,
        trackingNumber: (updateData.tracking_number as string) || undefined,
        deliveredNote: delivered_note || undefined,
      }

      if (status === 'processed') emitOrderProcessed(eventPayload).catch(console.error)
      else if (status === 'shipped') emitOrderShipped(eventPayload).catch(console.error)
      else if (status === 'delivered') emitOrderDelivered(eventPayload).catch(console.error)
    } catch (err) {
      console.error('[admin PATCH] failed to emit WA event:', err)
    }
  }

  return NextResponse.json({ data: { order: updated } })
}
