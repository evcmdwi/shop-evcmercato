import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const admin = getSupabaseAdmin()
    const body = await req.json()
    const { shipping_address, delivery_note, combined_order_id } = body

    // Validate address
    if (!shipping_address?.recipient_name || !shipping_address?.shipping_full_address) {
      return NextResponse.json({ error: 'Alamat pengiriman tidak lengkap' }, { status: 400 })
    }

    // Get redemption
    const { data: redemption } = await admin
      .from('point_redemptions')
      .select('*, products!inner(id, name, price)')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (!redemption) return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 })

    // Get config
    const { data: config } = await admin
      .from('point_redemption_config')
      .select('shipping_cost, admin_fee')
      .eq('id', 1)
      .single()

    // Validate combined_order_id if provided (user wants to ship together with existing order)
    let validatedCombinedOrderId: string | null = null
    if (combined_order_id) {
      const { data: combinedOrder } = await admin
        .from('orders')
        .select('id, status, user_id')
        .eq('id', combined_order_id)
        .single()

      if (
        combinedOrder &&
        combinedOrder.user_id === user.id &&
        ['paid', 'processed'].includes(combinedOrder.status)
      ) {
        validatedCombinedOrderId = combinedOrder.id
      }
    }

    // If valid combined order → free shipping and admin fee
    const shippingCost = validatedCombinedOrderId ? 0 : (config?.shipping_cost ?? 10000)
    const adminFee = validatedCombinedOrderId ? 0 : (config?.admin_fee ?? 3000)
    const totalAmount = shippingCost + adminFee

    // Check user points
    const { data: userData } = await admin
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single()

    const userPoints = (userData as any)?.total_points ?? 0
    if (userPoints < redemption.points_required) {
      return NextResponse.json({ error: 'Points tidak mencukupi' }, { status: 400 })
    }

    // Check stock
    const stockLeft = redemption.redeem_stock - redemption.redeemed_count
    if (stockLeft <= 0) {
      return NextResponse.json({ error: 'Stok habis' }, { status: 400 })
    }

    // Check max per user
    const { count } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('redemption_id', id)
      .in('status', ['paid', 'processed', 'shipped', 'delivered'])

    if ((count ?? 0) >= redemption.max_per_user) {
      return NextResponse.json({ error: 'Sudah melebihi batas penukaran' }, { status: 400 })
    }

    // Create Xendit invoice
    const orderId = crypto.randomUUID()
    const externalId = `redeem-${orderId.slice(0, 8)}`

    const xenditResp = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: totalAmount,
        description: `Redeem EVC Points: ${redemption.title}`,
        customer: { given_names: shipping_address.recipient_name },
        success_redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/${orderId}/sukses`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/${orderId}/gagal`,
      }),
    })

    if (!xenditResp.ok) {
      return NextResponse.json({ error: 'Gagal membuat invoice pembayaran' }, { status: 500 })
    }

    const xenditData = await xenditResp.json()

    // Create order
    const { error: orderError } = await admin.from('orders').insert({
      id: orderId,
      user_id: user.id,
      status: 'pending',
      order_type: 'redeem',
      redemption_id: id,
      points_used: redemption.points_required,
      subtotal: 0,
      shipping_cost: shippingCost,
      service_fee: adminFee,
      total_amount: totalAmount,
      xendit_invoice_id: xenditData.id,
      xendit_invoice_url: xenditData.invoice_url,
      payment_external_id: externalId,
      shipping_recipient_name: shipping_address.recipient_name,
      shipping_phone: shipping_address.shipping_phone,
      shipping_full_address: shipping_address.shipping_full_address,
      shipping_city: shipping_address.shipping_regency_name,
      shipping_province: shipping_address.shipping_province_name,
      shipping_district_name: shipping_address.shipping_district_name,
      shipping_regency_name: shipping_address.shipping_regency_name,
      shipping_province_name: shipping_address.shipping_province_name,
      delivery_note: delivery_note || null,
      combined_with_order_id: validatedCombinedOrderId,
    })

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Add order items (product being redeemed)
    await admin.from('order_items').insert({
      order_id: orderId,
      product_id: redemption.product_id,
      variant_id: redemption.variant_id,
      product_name: (redemption.products as any).name,
      quantity: 1,
      price: 0,
    })

    return NextResponse.json({
      order_id: orderId,
      payment_url: xenditData.invoice_url,
    })
  } catch (err) {
    console.error('[redemption checkout]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
