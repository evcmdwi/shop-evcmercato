import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emitOrderPaid, emitOrderExpired } from '@/lib/events/order-events'
import { setupEventListeners } from '@/lib/events/setup-listeners'

// Initialize listeners
setupEventListeners()

export async function POST(req: NextRequest) {
  // 1. Verify webhook signature
  const callbackToken = req.headers.get('x-callback-token')
  if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
    console.warn('[webhook] Invalid callback token')
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { external_id, status, payment_method, paid_at, amount } = payload as {
    external_id: string
    status: string
    payment_method: string
    paid_at: string
    amount: number
  }

  console.log('[webhook] Received + token OK:', { external_id, status })

  // Process SYNCHRONOUSLY before returning — Vercel serverless terminates the
  // function immediately after response, so fire-and-forget never completes.
  // Xendit webhook timeout is ~30s — plenty of time to await processWebhook.
  try {
    await processWebhook(external_id, status, payment_method, paid_at, amount)
  } catch (err) {
    // Log error but still return 200 — Xendit does NOT retry on 200, so
    // returning non-200 would cause unwanted duplicate processing on retry.
    console.error('[webhook] processWebhook error:', err)
  }

  return NextResponse.json({ received: true })
}

async function processWebhook(
  orderId: string,
  status: string,
  paymentMethod: string,
  paidAt: string,
  amount: number
) {
  const admin = getSupabaseAdmin()

  console.log('[webhook] Processing:', { orderId, status })

  // Get current order (for idempotency check)
  const { data: order, error } = await admin
    .from('orders')
    .select(`
      id, status, paid_at, user_id, total_amount, subtotal,
      shipping_cost, shipping_cost_discount, service_fee, service_fee_discount,
      shipping_recipient_name, shipping_phone, shipping_full_address,
      shipping_city, shipping_province, shipping_postal_code,
      points_earned, shipping_method
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('[webhook] Order not found:', orderId, error?.message)
    return
  }

  console.log('[webhook] Order found:', { id: order.id, currentStatus: order.status })

  if (status === 'PAID') {
    // IDEMPOTENCY: skip jika sudah paid
    if (order.status === 'paid' && order.paid_at) {
      console.log('[webhook] Already paid, skipping:', orderId)
      return
    }

    console.log('[webhook] Updating status to paid:', orderId)

    // Update order status
    const { error: updateError } = await admin
      .from('orders')
      .update({
        status: 'paid',
        paid_at: paidAt || new Date().toISOString(),
        xendit_payment_method: paymentMethod,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('[webhook] DB update failed:', updateError.message)
      throw updateError
    }

    console.log('[webhook] Status updated to paid:', orderId)

    // Notif admin via WhatsApp
    try {
      const { sendWhatsApp } = await import('@/lib/whatsapp')
      const orderCode = orderId.slice(-8).toUpperCase()
      const buyerName = order.shipping_recipient_name || 'Customer'
      const totalFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.total_amount || 0)
      await sendWhatsApp({
        to: '081386295426',
        message: `🔔 *Order Baru Masuk!*\n\nOrder: #${orderCode}\nPembeli: ${buyerName}\nTotal: ${totalFormatted}\nMetode: ${paymentMethod || '-'}\n\nCek admin: https://shop.evcmercato.com/sambers/pesanan`
      })
    } catch (e) {
      console.warn('[webhook] Admin WA notif failed (non-critical):', e)
    }

    // Check purchase_bonus promo for any product in order
    const { data: orderItems } = await admin
      .from('order_items')
      .select('product_id, variant_id')
      .eq('order_id', orderId)
    let multiplier = 1.0

    if (orderItems && orderItems.length > 0) {
      const productIds = orderItems.map((i: { product_id: string; variant_id: string | null }) => i.product_id)
      const { data: bonusPromo } = await admin
        .from('point_promos')
        .select('points_multiplier')
        .eq('promo_type', 'purchase_bonus')
        .eq('is_active', true)
        .or(`active_until.is.null,active_until.gt.${new Date().toISOString()}`)
        .in('product_id', productIds)
        .order('points_multiplier', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (bonusPromo?.points_multiplier) {
        multiplier = bonusPromo.points_multiplier
      }
    }

    // Kredit EVC Points ke user saat PAID
    // base_points: dari order, digunakan untuk tier calculation
    const basePoints = order.points_earned || Math.floor(order.subtotal / 1000)
    // Apply purchase_bonus promo multiplier (existing logic) to base points
    const pointsWithBonus = Math.floor(basePoints * multiplier)

    let newTotal = 0
    if (order.user_id) {
      const { data: currentUser } = await admin
        .from('users')
        .select('total_points')
        .eq('id', order.user_id)
        .single()

      const currentPoints = currentUser?.total_points ?? 0

      // Check active Extra Point Khusus promo for this user
      const now = new Date().toISOString()
      const { data: extraPromo } = await admin
        .from('user_extra_point_promos')
        .select('multiplier')
        .eq('user_id', order.user_id)
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('multiplier', { ascending: false })
        .limit(1)
        .maybeSingle()

      // extra_points = floor(basePoints * (extraMultiplier - 1)), does NOT count toward tier
      const extraPoints = extraPromo
        ? Math.floor(basePoints * (Number(extraPromo.multiplier) - 1))
        : 0

      const totalNewPoints = pointsWithBonus + extraPoints

      // tier hanya dari base+bonus points (bukan extra)
      const tierPoints = currentPoints + pointsWithBonus
      const newTier = tierPoints >= 3001 ? 'platinum' : tierPoints >= 1001 ? 'gold' : 'silver'

      newTotal = currentPoints + totalNewPoints

      // Update user: total_points includes all, tier from base+bonus only
      await admin
        .from('users')
        .update({ total_points: newTotal, tier: newTier })
        .eq('id', order.user_id)

      console.log(`[webhook] EVC Points base+bonus: +${pointsWithBonus} extra: +${extraPoints} → user ${order.user_id} total: ${newTotal}`)

      // Record 1: base+bonus points (type='earned')
      if (pointsWithBonus > 0) {
        await admin.from('point_transactions').insert({
          user_id: order.user_id,
          type: 'earned',
          amount: pointsWithBonus,
          balance_after: currentPoints + pointsWithBonus,
          related_order_id: orderId,
          notes: `Pembelian Order #${orderId.slice(0, 8).toUpperCase()}`,
        })
      }

      // Record 2: extra points (type='bonus') — only if Extra Point Khusus active
      if (extraPoints > 0 && extraPromo) {
        await admin.from('point_transactions').insert({
          user_id: order.user_id,
          type: 'bonus',
          amount: extraPoints,
          balance_after: currentPoints + pointsWithBonus + extraPoints,
          related_order_id: orderId,
          notes: `Extra Point Khusus (${extraPromo.multiplier}x)`,
        })
      }
    }

    // Get order items
    const { data: items } = await admin
      .from('order_items')
      .select('product_name, variant_name, quantity, price')
      .eq('order_id', orderId)

    // Get user info
    const { data: user } = await admin
      .from('users')
      .select('name, email, phone')
      .eq('id', order.user_id)
      .single()

    const shipping_fee = Math.max(0,
      (order.shipping_cost || 10000) - (order.shipping_cost_discount || 0)
    )

    // Emit event for E2 (email) dan E3 (WhatsApp)
    await emitOrderPaid({
      orderId: order.id,
      orderShortId: order.id.slice(0, 8).toUpperCase(),
      customerName: user?.name || 'Customer',
      payerEmail: user?.email || '',
      payerPhone: user?.phone || order.shipping_phone || '',
      totalAmount: order.total_amount,
      items: (items || []).map((item: { product_name: string; variant_name: string | null; quantity: number; price: number }) => ({
        product_name: item.variant_name
          ? `${item.product_name} (${item.variant_name})`
          : item.product_name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      })),
      subtotal: order.subtotal,
      shipping_fee,
      shipping_address: {
        name: order.shipping_recipient_name || '',
        phone: order.shipping_phone || '',
        address: order.shipping_full_address || '',
        city: order.shipping_city || '',
        province: order.shipping_province || '',
        postal_code: order.shipping_postal_code || '',
      },
      evc_points_earned: pointsWithBonus,
      total_points_after: newTotal,
      paid_at: paidAt || new Date().toISOString(),
      shipping_method: (order.shipping_method as 'reguler' | 'instan' | 'sameday') || 'reguler',
    })

  } else if (status === 'EXPIRED') {
    if (order.status === 'expired' || order.status === 'cancelled') return

    await admin
      .from('orders')
      .update({
        status: 'expired',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    await emitOrderExpired(orderId)

  } else if (status === 'FAILED') {
    if (order.status === 'failed' || order.status === 'cancelled') return

    await admin
      .from('orders')
      .update({
        status: 'failed',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', orderId)
  }

  console.log('[webhook] Processed OK:', { orderId, status })
}
