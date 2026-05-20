import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = getSupabaseAdmin()

  const { data: order, error } = await admin
    .from('orders')
    .select('id, status, total_amount, shipping_recipient_name, shipping_phone, xendit_invoice_url, user_id')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Order bukan pending' }, { status: 400 })
  }

  // Get user name + phone
  const { data: user } = await admin
    .from('users')
    .select('name, phone')
    .eq('id', order.user_id)
    .single()

  const customerName = (user as any)?.name || order.shipping_recipient_name || 'Kakak'
  const phone = (user as any)?.phone || order.shipping_phone || ''
  const shortId = id.slice(0, 8).toUpperCase()
  const totalFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(order.total_amount || 0)

  const message = `Hai Kak ${customerName},\nKami telah menerima pesanan Kakak dengan nomor *#${shortId}* senilai *${totalFormatted}*.\n\nSilakan lanjutkan pembayaran melalui link berikut:\n${order.xendit_invoice_url || '-'}\n\nBila ada yang perlu ditanyakan, Kakak bisa langsung hubungi admin kami di nomor WhatsApp ini. Kami siap membantu. 😊\n\nTerima kasih sudah belanja di EVC Mercato! 💚`

  const result = await sendWhatsApp({ to: phone, message })

  if (!result?.success) {
    return NextResponse.json({ error: result?.error || 'Gagal kirim WA' }, { status: 500 })
  }

  return NextResponse.json({ success: true, to: phone })
}
