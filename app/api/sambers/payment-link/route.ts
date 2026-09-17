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
    const { nominal, deskripsi } = body as { nominal: number; deskripsi: string }

    if (!nominal || !deskripsi) {
      return NextResponse.json({ error: 'nominal and deskripsi are required' }, { status: 400 })
    }

    if (typeof nominal !== 'number' || nominal <= 0) {
      return NextResponse.json({ error: 'nominal must be a positive number' }, { status: 400 })
    }

    const external_id = `PAYLINK-${Date.now()}`

    // Call Xendit Create Invoice API
    const xenditKey = process.env.XENDIT_SECRET_KEY ?? ''
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
      return NextResponse.json({ error: 'Failed to create Xendit invoice', detail: errBody }, { status: 502 })
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
        xendit_invoice_id: invoice.id,
        payment_url: invoice.invoice_url,
        status: 'pending',
        expired_at: invoice.expiry_date ?? null,
      })
      .select('id, external_id, payment_url, nominal, deskripsi, status, created_at')
      .single()

    if (error) {
      console.error('[payment-link] DB insert failed:', error.message)
      return NextResponse.json({ error: 'DB insert failed', detail: error.message }, { status: 500 })
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
      .select('id, external_id, nominal, deskripsi, payment_url, status, created_by, paid_at, expired_at, created_at, updated_at')
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
