// Setup all event listeners
// E2 (email) dan E3 (WhatsApp) akan menambahkan listener mereka di sini

let initialized = false

export function setupEventListeners() {
  if (initialized) return
  initialized = true

  console.log('[events] Event listeners initialized (E2/E3 listeners will be added in future PRs)')

  // Placeholder — E2 akan tambahkan:
  // subscribeToOrderPaid(sendOrderPaidEmail)

  // E3 akan tambahkan:
  // subscribeToOrderPaid(sendOrderPaidWhatsApp)
}
