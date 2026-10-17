import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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

    const xenditKey = process.env.XENDIT_SECRET_KEY
    if (!xenditKey) {
      return NextResponse.json({ error: 'XENDIT_SECRET_KEY belum di-set di server' }, { status: 500 })
    }

    const external_id = `PAYLINK-${Date.now()}`

    // Call Xendit Create Invoice API
    const xenditAuth = Buffer.from(`${xenditKey}:`).toString('base64')

    const xenditRes = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${xenditAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id,
        amount: nominal,
        description: deskripsi,
        currency: 'IDR',
        invoice_duration: 86400, // 24 jam
      }),
    })

    if (!xenditRes.ok) {
      const errBody = await xenditRes.text()
      console.error('[payment-link] Xendit error:', xenditRes.status, errBody)
      return NextResponse.json({ error: 'Gagal membuat invoice di Xendit', detail: errBody }, { status: 502 })
    }

    const invoice = await xenditRes.json() as {
      id: string
      invoice_url: string
      expiry_date?: string
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
        payment_url: invoice.invoice_url,
        status: 'pending',
        created_by: auth.userId ?? null,
        expired_at: invoice.expiry_date ?? null,
      })
      .select('id, external_id, payment_url, nominal, deskripsi, no_wa, status, created_at')
      .single()

    if (error) {
      console.error('[payment-link] DB insert failed:', error.message)
      // Invoice Xendit sudah terbuat — kembalikan URL-nya agar tetap bisa dipakai.
      return NextResponse.json(
        { error: 'Invoice dibuat tapi gagal disimpan ke history', detail: error.message, payment_url: invoice.invoice_url },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
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
