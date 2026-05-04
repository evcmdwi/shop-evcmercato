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
      points_earned
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

    // Kredit EVC Points ke user saat PAID
    const pointsToAdd = order.points_earned || Math.floor(order.subtotal / 1000)
    if (pointsToAdd > 0 && order.user_id) {
      const { data: currentUser } = await admin
        .from('users')
        .select('total_points')
        .eq('id', order.user_id)
        .single()

      const newTotal = (currentUser?.total_points || 0) + pointsToAdd
      const newTier = newTotal >= 20000 ? 'platinum' : newTotal >= 5000 ? 'gold' : 'silver'

      await admin
        .from('users')
        .update({ total_points: newTotal, tier: newTier })
        .eq('id', order.user_id)

      console.log(`[webhook] EVC Points +${pointsToAdd} → user ${order.user_id} total: ${newTotal}`)

      // Insert point_transactions audit log
      await admin.from('point_transactions').insert({
        user_id: order.user_id,
        type: 'earned',
        amount: pointsToAdd,
        balance_after: newTotal,
        related_order_id: orderId,
        notes: `Pembelian Order #${orderId.slice(0, 8).toUpperCase()}`,
      })
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
      evc_points_earned: order.points_earned || Math.floor(order.subtotal / 1000),
      paid_at: paidAt || new Date().toISOString(),
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
