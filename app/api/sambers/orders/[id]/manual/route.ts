import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { expireInvoice } from '@/lib/xendit'
import { createOrderPaymentLink } from '@/lib/admin-orders'

type RouteContext = { params: Promise<{ id: string }> }

// POST { action } untuk pesanan yang masih menunggu pembayaran:
//   send_link — buat link Xendit baru (link lama dimatikan) & kirim ke WA penerima
//   mark_paid — pembeli transfer langsung ke rekening BCA → tandai lunas
//   cancel    — batalkan pesanan (stok dikembalikan trigger)
// Setelah lunas, poin / WA "pembayaran diterima" / komisi diproses cron seperti biasa.
export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action as string
  const admin = getSupabaseAdmin()

  const { data: order } = await admin
    .from('orders')
    .select('id, status, order_type, xendit_invoice_id, notes')
    .eq('id', id)
    .single()
  if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
  if (order.status !== 'pending' || order.order_type !== 'purchase') {
    return NextResponse.json({ error: 'Pesanan sudah tidak menunggu pembayaran' }, { status: 409 })
  }

  if (action === 'send_link') {
    if (order.xendit_invoice_id) await expireInvoice(order.xendit_invoice_id)
    try {
      const res = await createOrderPaymentLink(admin, id)
      return NextResponse.json(res)
    } catch (e) {
      console.error('[orders/manual] send_link:', e)
      return NextResponse.json({ error: e instanceof Error ? e.message : 'Gagal membuat link' }, { status: 502 })
    }
  }

  if (action === 'mark_paid' || action === 'cancel') {
    const now = new Date().toISOString()
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : ''
    const line = action === 'mark_paid'
      ? `[${now.slice(0, 16).replace('T', ' ')} UTC] Lunas via transfer BCA (dikonfirmasi admin)${note ? ` — ${note}` : ''}`
      : `[${now.slice(0, 16).replace('T', ' ')} UTC] Dibatalkan admin${note ? ` — ${note}` : ''}`
    const update = action === 'mark_paid'
      ? { status: 'paid', paid_at: now, xendit_payment_method: 'TRANSFER_BCA' }
      : { status: 'cancelled', cancelled_at: now }

    // .eq('status','pending') → aman bila webhook Xendit masuk bersamaan.
    const { data: updated, error } = await admin
      .from('orders')
      .update({ ...update, notes: order.notes ? `${order.notes}\n${line}` : line })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id, status, paid_at, cancelled_at')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!updated) return NextResponse.json({ error: 'Status pesanan baru saja berubah — muat ulang halaman' }, { status: 409 })

    // Link Xendit yang masih terbuka dimatikan supaya pembeli tidak membayar dua kali.
    if (order.xendit_invoice_id) await expireInvoice(order.xendit_invoice_id)
    return NextResponse.json({ order: updated })
  }

  return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 })
}
