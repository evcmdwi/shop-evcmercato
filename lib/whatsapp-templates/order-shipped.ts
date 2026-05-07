export function generateOrderShippedBuyerWA(
  orderShortId: string,
  customerName: string,
  courier: string,
  trackingNumber: string,
  trackingUrl?: string,
  shippingMethod?: string
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

  const estimasi = shippingMethod === 'instan'
    ? '30-60 menit'
    : shippingMethod === 'sameday'
    ? '2-8 jam'
    : '1-3 hari kerja'

  return `Halo ${customerName}! 🚀

Pesanan #${orderShortId} sudah dikirim!

📦 Ekspedisi: ${courier}
🔢 No. Resi: ${trackingNumber}
🔍 Lacak Paket: ${resolvedTrackingUrl}

Estimasi tiba ${estimasi}.
Terima kasih sudah belanja di EVC Mercato 💚`
}
