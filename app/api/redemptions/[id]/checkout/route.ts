import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createInvoice } from '@/lib/xendit'

type RouteContext = { params: Promise<{ id: string }> }

const RESERVE_ERRORS: Record<string, string> = {
  insufficient_points: 'Points tidak mencukupi',
  out_of_stock: 'Stok habis',
  max_per_user: 'Sudah melebihi batas penukaran',
  reward_inactive: 'Promo tukar poin sudah tidak berlaku',
}

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

    // Cek awal (pesan error yang jelas). Pemotongan poin, stok hadiah, & batas per member
    // dicek ulang secara atomik oleh reserve_redemption_points() di database.
    const { data: userData } = await admin
      .from('users')
      .select('total_points, name, phone, email')
      .eq('id', user.id)
      .single()

    const userPoints = userData?.total_points ?? 0
    if (userPoints < redemption.points_required) {
      return NextResponse.json({ error: 'Points tidak mencukupi' }, { status: 400 })
    }
    if (redemption.redeem_stock - redemption.redeemed_count <= 0) {
      return NextResponse.json({ error: 'Stok habis' }, { status: 400 })
    }
    const now = Date.now()
    if (
      (redemption.active_from && Date.parse(redemption.active_from) > now) ||
      (redemption.active_until && Date.parse(redemption.active_until) <= now)
    ) {
      return NextResponse.json({ error: 'Promo tukar poin sudah tidak berlaku' }, { status: 400 })
    }

    // 1. Buat pesanan (pending). external_id invoice = id pesanan, sama seperti pembelian
    //    biasa, supaya webhook Xendit menemukan pesanan ini.
    const orderId = crypto.randomUUID()
    const { error: orderError } = await admin.from('orders').insert({
      id: orderId,
      user_id: user.id,
      status: 'pending',
      order_type: 'redeem',
      redemption_id: id,
      points_used: redemption.points_required,
      points_earned: 0,
      subtotal: 0,
      shipping_cost: shippingCost,
      service_fee: adminFee,
      total_amount: totalAmount,
      total_price: totalAmount, // kolom lama, masih NOT NULL
      shipping_method: 'reguler',
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
      console.error('[redemption checkout] order insert:', orderError.message)
      return NextResponse.json({ error: 'Gagal membuat pesanan penukaran' }, { status: 500 })
    }

    const productName = (redemption.products as { name: string }).name
    await admin.from('order_items').insert({
      order_id: orderId,
      product_id: redemption.product_id,
      variant_id: redemption.variant_id,
      product_name: productName,
      quantity: 1,
      price: 0,
    })

    // 2. Potong poin + stok hadiah secara atomik. Gagal → pesanan dihapus lagi.
    const { error: reserveError } = await admin.rpc('reserve_redemption_points', { p_order_id: orderId })
    if (reserveError) {
      await admin.from('order_items').delete().eq('order_id', orderId)
      await admin.from('orders').delete().eq('id', orderId)
      const msg = RESERVE_ERRORS[Object.keys(RESERVE_ERRORS).find((k) => reserveError.message.includes(k)) ?? '']
      if (!msg) console.error('[redemption checkout] reserve:', reserveError.message)
      return NextResponse.json({ error: msg ?? 'Gagal menukar poin' }, { status: msg ? 400 : 500 })
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shop.evcmercato.com'

    // 3a. Digabung dengan pesanan lain → gratis ongkir & biaya admin → langsung lunas.
    if (totalAmount <= 0) {
      await admin
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString(), xendit_payment_method: 'POINTS' })
        .eq('id', orderId)
      return NextResponse.json({ order_id: orderId, payment_url: `${APP_URL}/orders/${orderId}/sukses` })
    }

    // 3b. Invoice ongkir + biaya admin. Gagal → poin dikembalikan & pesanan dibatalkan.
    let invoice: { id: string; invoice_url: string }
    try {
      invoice = await createInvoice({
        external_id: orderId,
        amount: totalAmount,
        payer_email: userData?.email || user.email || '',
        description: `Tukar EVC Points: ${redemption.title} — Order #${orderId.slice(0, 8).toUpperCase()}`,
        items: [
          ...(shippingCost > 0 ? [{ name: 'Ongkos kirim', quantity: 1, price: shippingCost }] : []),
          ...(adminFee > 0 ? [{ name: 'Biaya admin', quantity: 1, price: adminFee }] : []),
        ],
        success_redirect_url: `${APP_URL}/orders/${orderId}/sukses`,
        failure_redirect_url: `${APP_URL}/orders/${orderId}/gagal`,
        customer_name: shipping_address.recipient_name || userData?.name || 'Customer',
        customer_phone: shipping_address.shipping_phone || userData?.phone || undefined,
      })
    } catch (err) {
      console.error('[redemption checkout] xendit:', err)
      await admin.from('orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', orderId)
      await admin.rpc('refund_redemption_points', { p_order_id: orderId })
      return NextResponse.json({ error: 'Gagal membuat invoice pembayaran' }, { status: 500 })
    }

    await admin
      .from('orders')
      .update({ xendit_invoice_id: invoice.id, xendit_invoice_url: invoice.invoice_url })
      .eq('id', orderId)

    return NextResponse.json({
      order_id: orderId,
      payment_url: invoice.invoice_url,
    })
  } catch (err) {
    console.error('[redemption checkout]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
