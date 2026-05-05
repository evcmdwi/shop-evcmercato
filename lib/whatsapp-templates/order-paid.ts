import type { OrderPaidPayload } from '@/lib/events/order-events'
import { formatRupiah } from '@/lib/format'

// Pesan untuk BUYER
export function generateOrderPaidBuyerWA(payload: OrderPaidPayload): string {
  const shippingLabel = payload.shipping_method === 'instan' ? '⚡ Instan (2-3 jam)' :
                        payload.shipping_method === 'sameday' ? '🚚 Sameday (8-12 jam)' :
                        '📦 Reguler JNT (1-3 hari)'
  return `Halo ${payload.customerName}! 👋

Pembayaran pesanan #${payload.orderShortId} sudah kami terima ✅

💰 Total: ${formatRupiah(payload.totalAmount)}
📦 Pengiriman: ${shippingLabel}
✨ +${payload.evc_points_earned} EVC Points${payload.total_points_after ? ` (Total: ${payload.total_points_after} pts)` : ''}

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

👉 shop.evcmercato.com/admin/orders/${payload.orderId}`
}
