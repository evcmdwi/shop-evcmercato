import { EXPRESS_HOURS } from '@/lib/shipping'

const SHIPPING_LABEL: Record<string, string> = {
  reguler: '📦 Reguler J&T (1–3 hari)',
  instan: '⚡ Instan (Grab)',
  sameday: '🚚 Sameday (Grab)',
}

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n)

/**
 * WA ke pembeli untuk pesanan yang dibuat admin: rincian, alamat & jenis kiriman
 * (sekaligus konfirmasi pengiriman), lalu link pembayaran.
 */
export function adminOrderCreatedMessage(o: {
  id: string
  customerName: string
  items: { product_name: string; variant_name: string | null; price: number; quantity: number }[]
  subtotal: number
  shippingCost: number
  adminDiscount: number
  totalAmount: number
  shippingMethod: string | null
  recipientName: string
  recipientPhone: string
  address: string
  area: string
  deliveryNote: string | null
  invoiceUrl: string
}): string {
  const method = o.shippingMethod ?? 'reguler'
  const items = o.items
    .map((i) => `• ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''} x${i.quantity} — ${rp(i.price * i.quantity)}`)
    .join('\n')
  const express = method === 'instan' || method === 'sameday'
    ? `\n🕘 Jam kirim Grab: Senin–Jumat ${EXPRESS_HOURS[method].weekday}, Sabtu ${EXPRESS_HOURS[method].saturday}. Minggu & tanggal merah libur.`
    : ''

  return (
    `Halo ${o.customerName} 👋\n\n` +
    `Berikut rincian pesanan Anda di EVC Mercato:\n` +
    `No. Pesanan: #${o.id.slice(0, 8).toUpperCase()}\n\n` +
    `🛍️ *Pesanan*\n${items}\n\n` +
    `Subtotal: ${rp(o.subtotal)}\n` +
    `Ongkir: ${o.shippingCost > 0 ? rp(o.shippingCost) : 'GRATIS'}\n` +
    (o.adminDiscount > 0 ? `Diskon: -${rp(o.adminDiscount)}\n` : '') +
    `*Total bayar: ${rp(o.totalAmount)}*\n\n` +
    `🚚 *Pengiriman*\n` +
    `Pesanan akan dikirim ke:\n` +
    `${o.recipientName} (${o.recipientPhone})\n` +
    `${o.address}\n` +
    `${o.area}\n` +
    (o.deliveryNote ? `Catatan kurir: ${o.deliveryNote}\n` : '') +
    `Dikirim dengan: ${SHIPPING_LABEL[method] ?? method}` +
    `${express}\n\n` +
    `Mohon cek kembali alamat & jenis kiriman di atas. Jika ada yang perlu diubah, balas pesan ini sebelum membayar 🙏\n\n` +
    `💳 *Pembayaran* (berlaku 24 jam):\n` +
    `${o.invoiceUrl}\n\n` +
    `Pesanan dikirim setelah pembayaran kami terima. Terima kasih 💚`
  )
}
