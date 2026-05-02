import type { OrderPaidPayload } from '@/lib/events/order-events'
import { formatRupiah } from '@/lib/format'

// Pesan untuk BUYER
export function generateOrderPaidBuyerWA(payload: OrderPaidPayload): string {
  return `Halo ${payload.customerName}! 👋

Pembayaran pesanan #${payload.orderShortId} sudah kami terima ✅

💰 Total: ${formatRupiah(payload.totalAmount)}
📦 Estimasi 3-5 hari kerja
✨ +${payload.evc_points_earned} EVC Points

Cek status: shop.evcmercato.com/orders/${payload.orderId}

Terima kasih sudah belanja di EVC Mercato 💚`
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

👉 shop.evcmercato.com/sambers/orders/${payload.orderId}`
}
