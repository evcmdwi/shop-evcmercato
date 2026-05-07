import { subscribeToOrderPaid, subscribeToOrderExpired, subscribeToOrderProcessed, subscribeToOrderShipped, subscribeToOrderDelivered } from './order-events'
import { generateOrderProcessedBuyerWA } from '../whatsapp-templates/order-processed'
import { generateOrderShippedBuyerWA } from '../whatsapp-templates/order-shipped'
import { generateOrderDeliveredBuyerWA } from '../whatsapp-templates/order-delivered'
import { sendEmail } from '../email'
import { generateOrderPaidEmail } from '../email-templates/order-paid'
import { generateOrderExpiredEmail } from '../email-templates/order-expired'
import { sendWhatsApp } from '../whatsapp'
import { generateOrderPaidBuyerWA, generateOrderPaidAdminWA } from '../whatsapp-templates/order-paid'
import { generateOrderExpiredBuyerWA } from '../whatsapp-templates/order-expired'
import { getSupabaseAdmin } from '../supabase-admin'

let initialized = false

export function setupEventListeners() {
  if (initialized) return
  initialized = true

  // ── EMAIL ──────────────────────────────────────────
  // Email: order paid
  subscribeToOrderPaid(async (payload) => {
    if (!payload.payerEmail) {
      console.log('[email] skipped order.paid — no email')
      return
    }
    const { subject, html } = generateOrderPaidEmail(payload)
    await sendEmail({ to: payload.payerEmail, subject, html })
  })

  // Email: order expired
  subscribeToOrderExpired(async ({ orderId }) => {
    // Fetch order + user info untuk email
    // Untuk simplicity Phase 1: log saja dulu, implement full later
    console.log('[email] order.expired —', orderId, '(email notification placeholder)')
  })

  // ── WHATSAPP ───────────────────────────────────────
  // WA ke buyer saat order paid
  subscribeToOrderPaid(async (payload) => {
    if (!payload.payerPhone) {
      console.warn('[whatsapp] paid — no payerPhone for order', payload.orderShortId)
      return
    }
    const message = generateOrderPaidBuyerWA(payload)
    const result = await sendWhatsApp({ to: payload.payerPhone, message })
    if (!result?.success) {
      console.error('[whatsapp] paid buyer — failed', payload.payerPhone, result?.error)
    } else {
      console.log('[whatsapp] paid buyer — sent to', payload.payerPhone, 'order', payload.orderShortId)
    }
  })

  // WA ke admin saat order paid
  subscribeToOrderPaid(async (payload) => {
    const adminPhone = process.env.FONNTE_ADMIN_PHONE
    if (!adminPhone) {
      console.warn('[whatsapp] admin — FONNTE_ADMIN_PHONE not set, skipping')
      return
    }
    const message = generateOrderPaidAdminWA(payload)
    const result = await sendWhatsApp({ to: adminPhone, message })
    if (!result?.success) {
      console.error('[whatsapp] paid admin — failed', adminPhone, result?.error)
    } else {
      console.log('[whatsapp] paid admin — sent to', adminPhone, 'order', payload.orderShortId)
    }
  })

  // WA ke buyer saat order expired (butuh data dari DB)
  subscribeToOrderExpired(async ({ orderId }) => {
    // Phase 1: log placeholder — need to fetch user data from DB
    console.log('[whatsapp] order.expired placeholder —', orderId)
    // TODO Phase 2: fetch user phone + name from orders/users, send expired WA
  })

  // WA ke buyer saat order PROCESSED
  subscribeToOrderProcessed(async (payload) => {
    if (!payload.payerPhone) {
      console.warn('[whatsapp] processed — no payerPhone for order', payload.orderShortId)
      return
    }
    const message = generateOrderProcessedBuyerWA(payload.orderShortId, payload.customerName)
    const result = await sendWhatsApp({ to: payload.payerPhone, message })
    if (!result?.success) {
      console.error('[whatsapp] processed — failed', payload.payerPhone, result?.error)
    } else {
      console.log('[whatsapp] processed — sent to', payload.payerPhone, 'order', payload.orderShortId)
    }
  })

  // WA ke buyer saat order SHIPPED
  subscribeToOrderShipped(async (payload) => {
    if (!payload.payerPhone) {
      console.warn('[whatsapp] shipped — no payerPhone for order', payload.orderShortId)
      return
    }
    if (!payload.courier) {
      console.warn('[whatsapp] shipped — no courier for order', payload.orderShortId)
      return
    }
    if (!payload.trackingNumber) {
      console.warn('[whatsapp] shipped — no trackingNumber for order', payload.orderShortId)
      return
    }
    const message = generateOrderShippedBuyerWA(
      payload.orderShortId,
      payload.customerName,
      payload.courier,
      payload.trackingNumber,
      payload.trackingUrl,
      payload.shippingMethod
    )
    const result = await sendWhatsApp({ to: payload.payerPhone, message })
    if (!result?.success) {
      console.error('[whatsapp] shipped — failed to send to', payload.payerPhone, 'order', payload.orderShortId, result?.error)
    } else {
      console.log('[whatsapp] shipped — sent to', payload.payerPhone, 'order', payload.orderShortId)
    }
  })

  // WA ke buyer saat order DELIVERED
  subscribeToOrderDelivered(async (payload) => {
    if (!payload.payerPhone) {
      console.warn('[whatsapp] delivered — no payerPhone for order', payload.orderShortId)
      return
    }
    const message = generateOrderDeliveredBuyerWA(payload.orderShortId, payload.customerName, payload.deliveredNote)
    const result = await sendWhatsApp({ to: payload.payerPhone, message })
    if (!result?.success) {
      console.error('[whatsapp] delivered — failed', payload.payerPhone, result?.error)
    } else {
      console.log('[whatsapp] delivered — sent to', payload.payerPhone, 'order', payload.orderShortId)
    }
  })

  // Update sold count setelah order PAID
  subscribeToOrderPaid(async (payload) => {
    const admin = getSupabaseAdmin()
    for (const item of payload.items) {
      try {
        const productName = item.product_name.split(' (')[0]
        const { data: product } = await admin
          .from('products')
          .select('id, initial_sold_count')
          .ilike('name', `%${productName}%`)
          .single()

        if (product) {
          await admin
            .from('products')
            .update({ initial_sold_count: (product.initial_sold_count || 0) + item.quantity })
            .eq('id', product.id)
        }
      } catch (err) {
        console.error('[sold_count] failed for item:', item.product_name, err)
      }
    }
  })

  console.log('[events] Email + WhatsApp + SoldCount listeners initialized')
}

