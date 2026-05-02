import { subscribeToOrderPaid, subscribeToOrderExpired } from './order-events'
import { sendEmail } from '../email'
import { generateOrderPaidEmail } from '../email-templates/order-paid'
import { generateOrderExpiredEmail } from '../email-templates/order-expired'
import { sendWhatsApp } from '../whatsapp'
import { generateOrderPaidBuyerWA, generateOrderPaidAdminWA } from '../whatsapp-templates/order-paid'
import { generateOrderExpiredBuyerWA } from '../whatsapp-templates/order-expired'

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

  console.log('[events] Email + WhatsApp listeners initialized')
}
