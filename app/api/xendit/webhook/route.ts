import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emitOrderExpired } from '@/lib/events/order-events'
import { setupEventListeners } from '@/lib/events/setup-listeners'

// Initialize listeners (needed for EXPIRED/FAILED paths)
setupEventListeners()

export async function POST(req: NextRequest) {
  const t0 = Date.now()

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

  const { external_id, status, payment_method, paid_at } = payload as {
    external_id: string
    status: string
    payment_method: string
    paid_at: string
    amount: number
  }

  console.log('[webhook] Received + token OK:', { external_id, status })

  try {
    await processWebhook(external_id, status, payment_method, paid_at)
  } catch (err) {
    // Log error but still return 200 — Xendit does NOT retry on 200
    console.error('[webhook] processWebhook error:', err)
  }

  console.log('[webhook] done', { orderId: external_id, status, ms: Date.now() - t0 })
  return NextResponse.json({ received: true })
}

async function processWebhook(
  orderId: string,
  status: string,
  paymentMethod: string,
  paidAt: string,
) {
  const admin = getSupabaseAdmin()

  console.log('[webhook] Processing:', { orderId, status })

  // Get current order (for idempotency check)
  const { data: order, error } = await admin
    .from('orders')
    .select('id, status, paid_at')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('[webhook] Order not found:', orderId, error?.message)
    return
  }

  if (status === 'PAID') {
    // IDEMPOTENCY: skip if already paid
    if (order.status === 'paid' && order.paid_at) {
      console.log('[webhook] Already paid, skipping:', orderId)
      return
    }

    // Update order status only — worker handles points/notifications/commission
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

    console.log('[webhook] Status → paid:', orderId, '| worker will handle points/notif/commission')

  } else if (status === 'EXPIRED') {
    if (order.status === 'expired' || order.status === 'cancelled') return

    await admin
      .from('orders')
      .update({
        status: 'expired',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // EXPIRED still fires synchronously — low overhead, no blocking queries
    emitOrderExpired(orderId).catch(e => console.error('[webhook] emitOrderExpired failed:', e))

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
