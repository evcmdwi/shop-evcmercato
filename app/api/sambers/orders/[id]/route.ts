import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emitOrderProcessed, emitOrderShipped, emitOrderDelivered, type OrderStatusChangePayload } from '@/lib/events/order-events'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { id } = await params

    const { data: order, error } = await admin
      .from('orders')
      .select(`
        id, status, order_type, total_amount, subtotal, shipping_cost, shipping_cost_discount,
        service_fee, service_fee_discount, created_at, paid_at, processed_at,
        shipped_at, delivered_at, delivered_note, tracking_number, shipping_courier,
        xendit_invoice_url, user_id, points_earned, points_used,
        shipping_recipient_name, shipping_phone, shipping_full_address,
        shipping_city, shipping_province, shipping_postal_code,
        shipping_district_name, shipping_regency_name, shipping_province_name,
        delivery_note, resi_barcode_url, courier_type, shipping_method, resi_generated_at,
        order_items (
          id, quantity, price, product_name, variant_name
        )
      `)
      .eq('id', id)
      .single()

    if (error || !order) {
      console.error('[/api/sambers/orders/[id]] error:', error?.message)
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    // Fetch user info separately
    const { data: user } = await admin
      .from('users')
      .select('id, name, email, phone')
      .eq('id', (order as any).user_id)
      .single()

    const enriched = {
      ...order,
      short_id: (order as any).id.slice(0, 8).toUpperCase(),
      user: user ?? null,
      customer_name: (user as any)?.name || (order as any).shipping_recipient_name || '—',
      customer_email: (user as any)?.email || '—',
    }

    return NextResponse.json({ data: { order: enriched } })
  } catch (err) {
    console.error('[/api/sambers/orders/[id]] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { id } = await params
    const body = await req.json()
    const { status, tracking_number, shipping_courier, delivered_note } = body

    let updateData: Record<string, unknown> = {}

    if (status === 'processed') {
      updateData = { status: 'processed', processed_at: new Date().toISOString() }
    } else if (status === 'shipped') {
      if (!tracking_number || !shipping_courier) {
        return NextResponse.json({ error: 'Nomor resi dan ekspedisi wajib diisi' }, { status: 400 })
      }
      updateData = { status: 'shipped', tracking_number, shipping_courier, shipped_at: new Date().toISOString() }
    } else if (status === 'delivered') {
      updateData = { status: 'delivered', delivered_at: new Date().toISOString(), delivered_note: delivered_note || null }
    } else {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const { data: updatedOrder, error } = await admin
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[/api/sambers/orders/[id] PATCH]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user for WA notification
    const { data: orderData } = await admin.from('orders').select('user_id, shipping_phone, shipping_recipient_name').eq('id', id).single()
    const { data: userData } = orderData ? await admin.from('users').select('name, phone').eq('id', orderData.user_id).single() : { data: null }

    const payload: OrderStatusChangePayload = {
      orderId: id,
      orderShortId: id.slice(0, 8).toUpperCase(),
      customerName: (userData as any)?.name || (orderData as any)?.shipping_recipient_name || 'Customer',
      payerPhone: (userData as any)?.phone || (orderData as any)?.shipping_phone || '',
      status: status as string,
      courier: shipping_courier,
      trackingNumber: tracking_number,
    }

    if (status === 'processed') emitOrderProcessed(payload).catch(console.error)
    else if (status === 'shipped') emitOrderShipped(payload).catch(console.error)
    else if (status === 'delivered') emitOrderDelivered(payload).catch(console.error)

    return NextResponse.json({ data: { order: updatedOrder }, message: 'Status berhasil diperbarui' })
  } catch (err) {
    console.error('[/api/sambers/orders/[id] PATCH] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
