import { subscribeToOrderPaid, subscribeToOrderExpired } from './order-events'
import { sendEmail } from '../email'
import { generateOrderPaidEmail } from '../email-templates/order-paid'
import { generateOrderExpiredEmail } from '../email-templates/order-expired'

let initialized = false

export function setupEventListeners() {
  if (initialized) return
  initialized = true

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

  console.log('[events] Email listeners initialized')
}
