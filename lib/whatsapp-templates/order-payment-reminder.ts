const SHIPPING_LABEL: Record<string, string> = {
  reguler: 'Reguler (J&T)',
  instan: 'Instan (Grab)',
  sameday: 'Sameday (Grab)',
}

/** Pengingat bayar untuk pesanan yang belum dibayar ±5 menit setelah checkout. */
export function orderPaymentReminderMessage(o: {
  id: string
  customerName: string
  totalAmount: number
  shippingMethod: string | null
  invoiceUrl: string
}): string {
  const total = new Intl.NumberFormat('id-ID').format(o.totalAmount)
  return (
    `Halo ${o.customerName},\n\n` +
    `Pesanan Anda di EVC Mercato belum dibayar 🙏\n` +
    `No. Pesanan: #${o.id.slice(0, 8).toUpperCase()}\n` +
    `Total: Rp ${total}\n` +
    `Pengiriman: ${SHIPPING_LABEL[o.shippingMethod ?? 'reguler'] ?? o.shippingMethod}\n\n` +
    `Lanjutkan pembayaran melalui link ini (berlaku 24 jam):\n` +
    `${o.invoiceUrl}\n\n` +
    `Pesanan juga bisa dibuka kapan saja di menu Pesanan Saya:\n` +
    `https://shop.evcmercato.com/orders/${o.id}\n\n` +
    `Kesulitan bayar lewat Virtual Account / QRIS? Hubungi admin: wa.me/6285820852908\n\n` +
    `Pesan ini dikirim oleh EVC Mercato`
  )
}
