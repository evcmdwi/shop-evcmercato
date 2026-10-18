import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Hitung klik banner hero (dikirim via navigator.sendBeacon dari beranda). */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return new NextResponse(null, { status: 400 })
  await getSupabaseAdmin().rpc('increment_banner_click', { banner_id: id })
  return new NextResponse(null, { status: 204 })
}
