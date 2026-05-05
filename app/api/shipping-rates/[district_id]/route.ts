import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type RouteContext = { params: Promise<{ district_id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { district_id } = await params
  const admin = getSupabaseAdmin()

  const { data: rate } = await admin
    .from('shipping_rates')
    .select('instan_rate, sameday_rate')
    .eq('district_id', district_id)
    .eq('is_active', true)
    .maybeSingle()

  const methods = [
    {
      method: 'reguler',
      label: 'Reguler (JNT) — 1-3 hari',
      base_rate: 10000,
      available: true,
    },
    {
      method: 'instan',
      label: 'Instan ⚡ (30 menit - 2 jam)',
      base_rate: rate && rate.instan_rate > 0 ? rate.instan_rate : null,
      available: !!(rate && rate.instan_rate > 0),
      reason: !rate || rate.instan_rate === 0 ? 'Belum tersedia di kota Anda' : undefined,
    },
    {
      method: 'sameday',
      label: 'Sameday 🚚 (2-8 jam)',
      base_rate: rate && rate.sameday_rate > 0 ? rate.sameday_rate : null,
      available: !!(rate && rate.sameday_rate > 0),
      reason: !rate
        ? 'Belum tersedia di kota Anda'
        : rate.sameday_rate === 0
        ? 'Sameday belum tersedia di kota Anda'
        : undefined,
    },
  ]

  return NextResponse.json({ district_id, available_methods: methods }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}
