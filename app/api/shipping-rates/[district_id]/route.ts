import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { REGULER_RATE, getShippingRates } from '@/lib/shipping'

type RouteContext = { params: Promise<{ district_id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { district_id } = await params
  const admin = getSupabaseAdmin()

  const rate = await getShippingRates(admin, district_id)

  const methods = [
    {
      method: 'reguler',
      label: 'Reguler (JNT) — 1-3 hari',
      base_rate: REGULER_RATE,
      available: true,
    },
    {
      method: 'instan',
      label: 'Instan ⚡ — Sen–Jum 09.00–16.00 · Sab 09.00–14.00',
      base_rate: rate.instan,
      available: rate.instan !== null,
      reason: rate.instan === null ? 'Belum tersedia di kota Anda' : undefined,
    },
    {
      method: 'sameday',
      label: 'Sameday 🚚 — Sen–Jum 09.00–15.00 · Sab 09.00–12.00',
      base_rate: rate.sameday,
      available: rate.sameday !== null,
      reason: !rate.hasRate
        ? 'Belum tersedia di kota Anda'
        : rate.sameday === null
        ? 'Sameday belum tersedia di kota Anda'
        : undefined,
    },
  ]

  return NextResponse.json({ district_id, available_methods: methods }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}
