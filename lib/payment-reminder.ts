import type { SupabaseClient } from '@supabase/supabase-js'
import { sendWhatsApp } from '@/lib/whatsapp'
import { orderPaymentReminderMessage } from '@/lib/whatsapp-templates/order-payment-reminder'

const REMIND_AFTER_MS = 5 * 60_000
// Hanya pesanan yang baru dibuat — pesanan lama yang menggantung tidak ikut dikirimi.
const REMIND_WINDOW_MS = 60 * 60_000

/**
 * Kirim WA pengingat sekali untuk pesanan `pending` yang belum dibayar ≥5 menit.
 * Dipanggil cron per menit (process-paid-orders). Klaim via payment_reminder_sent_at
 * agar tidak terkirim dobel; bila WA gagal, klaim dilepas untuk dicoba lagi.
 */
export async function sendPaymentReminders(admin: SupabaseClient): Promise<number> {
  const now = Date.now()
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, user_id, total_amount, shipping_method, shipping_phone, shipping_recipient_name, xendit_invoice_url')
    .eq('status', 'pending')
    .is('payment_reminder_sent_at', null)
    .not('xendit_invoice_url', 'is', null)
    .lt('created_at', new Date(now - REMIND_AFTER_MS).toISOString())
    .gt('created_at', new Date(now - REMIND_WINDOW_MS).toISOString())
    .limit(10)

  if (error) {
    console.error('[payment-reminder] fetch error:', error.message)
    return 0
  }

  let sent = 0
  for (const order of orders ?? []) {
    const { data: claimed } = await admin
      .from('orders')
      .update({ payment_reminder_sent_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('status', 'pending')
      .is('payment_reminder_sent_at', null)
      .select('id')
    if (!claimed?.length) continue

    let phone = order.shipping_phone as string | null
    if (!phone) {
      const { data: user } = await admin.from('users').select('phone').eq('id', order.user_id).single()
      phone = user?.phone ?? null
    }
    if (!phone) continue

    const result = await sendWhatsApp({
      to: phone,
      message: orderPaymentReminderMessage({
        id: order.id,
        customerName: order.shipping_recipient_name || 'Pelanggan',
        totalAmount: order.total_amount,
        shippingMethod: order.shipping_method,
        invoiceUrl: order.xendit_invoice_url as string,
      }),
    })
    if (result.success) {
      sent++
    } else {
      await admin.from('orders').update({ payment_reminder_sent_at: null }).eq('id', order.id)
      console.error('[payment-reminder] WA gagal:', order.id, result.error)
    }
  }
  return sent
}
