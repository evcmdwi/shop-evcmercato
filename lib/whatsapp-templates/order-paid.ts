import type { OrderPaidPayload } from '@/lib/events/order-events'
import { formatRupiah } from '@/lib/format'
import { EXPRESS_HOURS } from '@/lib/shipping'

// Pesan untuk BUYER
export function generateOrderPaidBuyerWA(payload: OrderPaidPayload): string {
  const method = payload.shipping_method
  const shippingLabel = method === 'instan' ? '⚡ Instan (Grab)' :
                        method === 'sameday' ? '🚚 Sameday (Grab)' :
                        '📦 Reguler J&T (1-3 hari)'
  // Instan/Sameday hanya dikirim di jam kerja — jangan janjikan estimasi jam tiba.
  const expressNote = method === 'instan' || method === 'sameday'
    ? `

🕘 Jam kirim ${method === 'instan' ? 'Instan' : 'Sameday'}:
Senin–Jumat ${EXPRESS_HOURS[method].weekday}
Sabtu ${EXPRESS_HOURS[method].saturday}
Minggu & tanggal merah libur

Pesanan yang dibayar di luar jam kirim akan dikirim pada jam kerja berikutnya (mis. dibayar hari Minggu → dikirim Senin pagi). Kurir akan menghubungi nomor ini saat mengantar.`
    : ''
  return `Halo ${payload.customerName}! 👋

Pembayaran pesanan #${payload.orderShortId} sudah kami terima ✅

💰 Total: ${formatRupiah(payload.totalAmount)}
📦 Pengiriman: ${shippingLabel}
✨ +${payload.evc_points_earned} EVC Points${payload.total_points_after ? ` (Total: ${payload.total_points_after} pts)` : ''}${expressNote}

Cek status: shop.evcmercato.com/orders/${payload.orderId}

Terima kasih sudah belanja di EVC Mercato 💚 Semoga Anda sehat selalu 🤗`
}

// Pesan untuk ADMIN (Dwi)
export function generateOrderPaidAdminWA(payload: OrderPaidPayload): string {
  const itemsList = payload.items
    .map(i => `- ${i.product_name} ×${i.quantity}`)
    .join('\n')

  return `🛒 ORDER BARU MASUK

#${payload.orderShortId}
👤 ${payload.customerName}
📱 ${payload.payerPhone || '-'}

Items:
${itemsList}

💰 Total: ${formatRupiah(payload.totalAmount)}

📍 ${payload.shipping_address.city}, ${payload.shipping_address.province}

👉 shop.evcmercato.com/sambers/pesanan/${payload.orderId}`
}
