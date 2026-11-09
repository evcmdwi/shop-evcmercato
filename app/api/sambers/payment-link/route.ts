import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsApp } from '@/lib/whatsapp'
import { paymentLinkCreatedMessage } from '@/lib/whatsapp-templates/payment-link-created'
import { createPaymentSession } from '@/lib/xendit'

// POST /api/sambers/payment-link — create a new Xendit payment link
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
    }

    const body = await req.json()
    const { nominal, deskripsi: rawDeskripsi, no_wa: rawNoWa } = body as { nominal: unknown; deskripsi: unknown; no_wa: unknown }
    const deskripsi = typeof rawDeskripsi === 'string' ? rawDeskripsi.trim() : ''
    // Opsional — nomor WA pembeli untuk pesan "terima kasih" saat lunas.
    const no_wa = typeof rawNoWa === 'string' ? rawNoWa.replace(/\D/g, '') : ''

    if (typeof nominal !== 'number' || !Number.isInteger(nominal) || nominal < 1000) {
      return NextResponse.json({ error: 'Nominal minimal Rp 1.000 (bilangan bulat)' }, { status: 400 })
    }
    if (!deskripsi || deskripsi.length > 200) {
      return NextResponse.json({ error: 'Deskripsi wajib diisi (maks. 200 karakter)' }, { status: 400 })
    }
    if (no_wa && !/^(0|62)8\d{7,12}$/.test(no_wa)) {
      return NextResponse.json({ error: 'No. WhatsApp tidak valid (contoh: 081234567890)' }, { status: 400 })
    }

    if (!process.env.XENDIT_SECRET_KEY) {
      return NextResponse.json({ error: 'XENDIT_SECRET_KEY belum di-set di server' }, { status: 500 })
    }

    const external_id = `PAYLINK-${Date.now()}`

    // Xendit Payment Session (pengganti legacy /v2/invoices), berlaku 24 jam.
    let invoice: { id: string; payment_url: string; expires_at: string | null }
    try {
      invoice = await createPaymentSession({ reference_id: external_id, amount: nominal, description: deskripsi })
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      console.error('[payment-link] Xendit error:', detail)
      return NextResponse.json({ error: 'Gagal membuat link pembayaran di Xendit', detail }, { status: 502 })
    }

    // Save to payment_links table
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('payment_links')
      .insert({
        external_id,
        nominal,
        deskripsi,
        no_wa: no_wa || null,
        xendit_invoice_id: invoice.id,
        payment_url: invoice.payment_url,
        status: 'pending',
        created_by: auth.userId ?? null,
        expired_at: invoice.expires_at ?? null,
      })
      .select('id, external_id, payment_url, nominal, deskripsi, no_wa, status, created_at')
      .single()

    if (error) {
      console.error('[payment-link] DB insert failed:', error.message)
      // Invoice Xendit sudah terbuat — kembalikan URL-nya agar tetap bisa dipakai.
      return NextResponse.json(
        { error: 'Invoice dibuat tapi gagal disimpan ke history', detail: error.message, payment_url: invoice.payment_url },
        { status: 500 }
      )
    }

    // Kirim link ke WA pembeli — hasilnya ditampilkan ke admin (gagal → salin manual).
    let wa_link_sent: boolean | null = null
    if (no_wa) {
      const res = await sendWhatsApp({ to: no_wa, message: paymentLinkCreatedMessage(nominal, deskripsi, invoice.payment_url) })
      wa_link_sent = res.success
      if (!res.success) console.error('[payment-link] WA link failed:', external_id, res.error)
    }

    return NextResponse.json({ ...data, wa_link_sent }, { status: 201 })
  } catch (err) {
    console.error('[payment-link] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/sambers/payment-link — list payment links (latest 50)
export async function GET(_req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
    }

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('payment_links')
      .select('id, external_id, nominal, deskripsi, no_wa, wa_sent_at, payment_url, status, created_by, paid_at, expired_at, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[payment-link] DB query failed:', error.message)
      return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[payment-link] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
