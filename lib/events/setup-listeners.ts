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
      console.log('[whatsapp] buyer — no phone, skipping')
      return
    }
    const message = generateOrderPaidBuyerWA(payload)
    await sendWhatsApp({ to: payload.payerPhone, message })
  })

  // WA ke admin saat order paid
  subscribeToOrderPaid(async (payload) => {
    const adminPhone = process.env.FONNTE_ADMIN_PHONE
    if (!adminPhone) {
      console.log('[whatsapp] admin — FONNTE_ADMIN_PHONE not set, skipping')
      return
    }
    const message = generateOrderPaidAdminWA(payload)
    await sendWhatsApp({ to: adminPhone, message })
  })

  // WA ke buyer saat order expired (butuh data dari DB)
  subscribeToOrderExpired(async ({ orderId }) => {
    // Phase 1: log placeholder — need to fetch user data from DB
    console.log('[whatsapp] order.expired placeholder —', orderId)
    // TODO Phase 2: fetch user phone + name from orders/users, send expired WA
  })

  // WA ke buyer saat order PROCESSED
  subscribeToOrderProcessed(async (payload) => {
    if (!payload.payerPhone) return
    const message = generateOrderProcessedBuyerWA(payload.orderShortId, payload.customerName)
    await sendWhatsApp({ to: payload.payerPhone, message })
  })

  // WA ke buyer saat order SHIPPED
  subscribeToOrderShipped(async (payload) => {
    if (!payload.payerPhone || !payload.courier || !payload.trackingNumber) return
    const message = generateOrderShippedBuyerWA(
      payload.orderShortId,
      payload.customerName,
      payload.courier,
      payload.trackingNumber
    )
    await sendWhatsApp({ to: payload.payerPhone, message })
  })

  // WA ke buyer saat order DELIVERED
  subscribeToOrderDelivered(async (payload) => {
    if (!payload.payerPhone) return
    const message = generateOrderDeliveredBuyerWA(payload.orderShortId, payload.customerName)
    await sendWhatsApp({ to: payload.payerPhone, message })
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

