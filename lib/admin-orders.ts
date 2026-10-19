import type { SupabaseClient } from '@supabase/supabase-js'
import { createInvoice } from '@/lib/xendit'
import { sendWhatsApp } from '@/lib/whatsapp'
import { paymentLinkCreatedMessage } from '@/lib/whatsapp-templates/payment-link-created'

// Pesanan yang dibuat admin dari Sambers (Buat Pesanan). Rumus biaya sama dengan /api/checkout.

export const SERVICE_FEE = 3000
export const FREE_SHIPPING_MIN_SUBTOTAL = 80000
export const SHIPPING_DISCOUNT = 10000

export function computeAdminOrderTotals(subtotal: number, shippingBaseRate: number, discount: number) {
  const shippingDiscount = subtotal >= FREE_SHIPPING_MIN_SUBTOTAL ? SHIPPING_DISCOUNT : 0
  const shippingCost = Math.max(0, shippingBaseRate - shippingDiscount)
  // Biaya layanan selalu digratiskan (sama seperti checkout).
  const total = Math.max(0, subtotal + shippingCost - discount)
  return { shippingDiscount, shippingCost, total }
}

/** 0812… / +62812… / 62812… → 0812… */
export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  return d.startsWith('62') ? '0' + d.slice(2) : d
}

/**
 * Buat invoice Xendit untuk pesanan pending lalu kirim link-nya ke WA penerima.
 * external_id = id pesanan, sehingga webhook Xendit memproses pesanan ini seperti biasa.
 */
export async function createOrderPaymentLink(
  admin: SupabaseClient,
  orderId: string
): Promise<{ payment_url: string; wa_sent: boolean | null }> {
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, status, total_amount, shipping_recipient_name, shipping_phone, order_items(product_name, variant_name, price, quantity)')
    .eq('id', orderId)
    .single()
  if (!order) throw new Error('Pesanan tidak ditemukan')
  if (order.status !== 'pending') throw new Error('Pesanan sudah tidak menunggu pembayaran')
  if (order.total_amount < 1000) throw new Error('Total minimal Rp1.000 untuk link pembayaran')

  const { data: user } = await admin.from('users').select('name, email, phone').eq('id', order.user_id).single()
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shop.evcmercato.com'
  const shortId = order.id.slice(0, 8).toUpperCase()
  const items = (order.order_items ?? []) as { product_name: string; variant_name: string | null; price: number; quantity: number }[]

  const invoice = await createInvoice({
    external_id: order.id,
    amount: order.total_amount,
    payer_email: user?.email || '',
    description: `Order #${shortId} - EVC Mercato`,
    items: items.map((i) => ({
      name: i.product_name + (i.variant_name ? ` (${i.variant_name})` : ''),
      quantity: i.quantity,
      price: i.price,
    })),
    success_redirect_url: `${APP_URL}/orders/${order.id}/sukses`,
    failure_redirect_url: `${APP_URL}/orders/${order.id}/gagal`,
    customer_name: order.shipping_recipient_name || user?.name || 'Customer',
    customer_phone: order.shipping_phone || user?.phone || undefined,
  })

  await admin
    .from('orders')
    .update({ xendit_invoice_id: invoice.id, xendit_invoice_url: invoice.invoice_url })
    .eq('id', order.id)

  let wa_sent: boolean | null = null
  const to = order.shipping_phone || user?.phone
  if (to) {
    const summary = items.map((i) => `${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''} x${i.quantity}`).join(', ')
    const res = await sendWhatsApp({
      to,
      message: paymentLinkCreatedMessage(order.total_amount, `Order #${shortId} — ${summary}`, invoice.invoice_url),
    })
    wa_sent = res.success
    if (!res.success) console.error('[admin-order] WA link failed:', order.id, res.error)
  }
  return { payment_url: invoice.invoice_url, wa_sent }
}
