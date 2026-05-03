export function generateOrderExpiredEmail(orderId: string, orderShortId: string, customerName: string): { subject: string; html: string } {
  const subject = `Pesanan #${orderShortId} Kedaluwarsa - EVC Mercato`
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px;">
    <h2 style="color: #d97706;">⏰ Pesanan Kedaluwarsa</h2>
    <p>Halo <strong>${customerName}</strong>,</p>
    <p>Pesanan <strong>#${orderShortId}</strong> telah kedaluwarsa karena pembayaran tidak diterima dalam 24 jam.</p>
    <p>Stok produk sudah dikembalikan. Kamu bisa melakukan pemesanan baru kapan saja.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://shop.evcmercato.com/katalog" style="background: #7FB300; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Belanja Lagi</a>
    </div>
    <p style="color: #888; font-size: 12px;">EVC Mercato — orders@evcmercato.com</p>
  </div>
</body>
</html>`
  return { subject, html }
}
