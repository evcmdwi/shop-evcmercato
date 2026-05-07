export function generateOrderShippedBuyerWA(
  orderShortId: string,
  customerName: string,
  courier: string,
  trackingNumber: string,
  trackingUrl?: string
): string {
  const defaultTrackingUrls: Record<string, string> = {
    'JNE': 'https://www.jne.co.id/id/tracking/trace',
    'JNT': 'https://www.jet.co.id/track',
    'SiCepat': 'https://www.sicepat.com/checkAwb',
    'AnterAja': 'https://anteraja.id/tracking',
  }

  const resolvedTrackingUrl = trackingUrl ||
    defaultTrackingUrls[courier] ||
    `https://www.google.com/search?q=${encodeURIComponent(courier + ' ' + trackingNumber)}`

  let message = `Halo ${customerName}! 🚀

Pesanan #${orderShortId} sudah dikirim!

📦 Ekspedisi: ${courier}
🔢 No. Resi: ${trackingNumber}
🔍 Cek status: ${resolvedTrackingUrl}`

  if (trackingUrl) {
    message += `

🔍 *Lacak Paket:*
${trackingUrl}`
  }

  message += `

Estimasi tiba 1-3 hari kerja.
Terima kasih sudah belanja di EVC Mercato 💚`

  return message
}
