export function generateOrderExpiredBuyerWA(orderShortId: string, customerName: string): string {
  return `Halo ${customerName},

Pesanan #${orderShortId} telah kedaluwarsa karena pembayaran tidak diterima dalam 24 jam ⏰

Stok sudah dikembalikan. Kamu bisa order lagi kapan saja:
👉 shop.evcmercato.com/katalog

EVC Mercato 💚`
}
