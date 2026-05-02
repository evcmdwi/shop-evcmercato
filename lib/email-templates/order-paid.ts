import type { OrderPaidPayload } from '@/lib/events/order-events'
import { formatRupiah } from '@/lib/format'

export function generateOrderPaidEmail(payload: OrderPaidPayload): { subject: string; html: string } {
  const subject = `Pembayaran Diterima - Pesanan #${payload.orderShortId}`

  const itemRows = payload.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
          ${item.product_name} × ${item.quantity}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
          ${formatRupiah(item.subtotal)}
        </td>
      </tr>`
    )
    .join('')

  const shippingDisplay =
    payload.shipping_fee === 0
      ? '<span style="color: #1a7f37; font-weight: bold;">GRATIS 💚</span>'
      : formatRupiah(payload.shipping_fee)

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px; width: 100%;">
        
        <!-- Header -->
        <tr><td style="background-color: #534AB7; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">EVC Mercato</h1>
          <p style="color: #c8c4f8; margin: 4px 0 0; font-size: 14px;">Produk Kesehatan Wanita</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding: 32px 24px;">
          <h2 style="color: #1a7f37; margin: 0 0 8px;">✅ Pembayaran Diterima!</h2>
          <p style="color: #555; margin: 0 0 24px;">Halo <strong>${payload.customerName}</strong>, pembayaran pesanan #${payload.orderShortId} sudah kami terima. Terima kasih sudah belanja di EVC Mercato!</p>

          <!-- Items -->
          <h3 style="color: #333; border-bottom: 2px solid #534AB7; padding-bottom: 8px;">🛒 Detail Pesanan</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
            <tr>
              <td style="padding: 8px 0;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right;">${formatRupiah(payload.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Ongkos Kirim</td>
              <td style="padding: 8px 0; text-align: right;">${shippingDisplay}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Biaya Layanan</td>
              <td style="padding: 8px 0; text-align: right; color: #1a7f37;">GRATIS 💚</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="padding: 12px 0; font-weight: bold; font-size: 16px;">Total Bayar</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px; color: #534AB7;">${formatRupiah(payload.totalAmount)}</td>
            </tr>
          </table>

          <!-- Shipping -->
          <h3 style="color: #333; border-bottom: 2px solid #534AB7; padding-bottom: 8px; margin-top: 24px;">📦 Alamat Pengiriman</h3>
          <p style="color: #555; margin: 0; line-height: 1.6;">
            <strong>${payload.shipping_address.name}</strong><br>
            ${payload.shipping_address.phone}<br>
            ${payload.shipping_address.address}<br>
            ${payload.shipping_address.city}, ${payload.shipping_address.province} ${payload.shipping_address.postal_code}
          </p>
          <p style="color: #888; font-size: 13px; margin: 8px 0 0;">🚚 Estimasi tiba: 3-5 hari kerja</p>

          <!-- EVC Points -->
          <div style="background: #EEEDFE; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #534AB7; font-weight: bold;">✨ Kamu mendapat <strong>${payload.evc_points_earned} EVC Points</strong> dari pembelian ini!</p>
            <p style="margin: 4px 0 0; color: #666; font-size: 13px;">Points akan masuk setelah barang diterima.</p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://shop.evcmercato.com/orders/${payload.orderId}" style="background-color: #534AB7; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Lihat Status Pesanan</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color: #f9f9f9; padding: 16px 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px; margin: 0;">EVC Mercato — Balikpapan, Kalimantan Timur<br>
          Ada pertanyaan? Reply email ini atau WhatsApp kami.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html }
}
