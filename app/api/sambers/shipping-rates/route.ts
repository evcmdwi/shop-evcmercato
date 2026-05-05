import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getSupabaseAdmin()
  const url = req.nextUrl
  const search = url.searchParams.get('search') || ''
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = admin
    .from('shipping_rates')
    .select(
      `id, district_id, instan_rate, sameday_rate, notes, is_active, created_at, updated_at,
      districts!inner(name, regencies!inner(name, provinces!inner(name)))`,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`districts.name.ilike.%${search}%,districts.regencies.name.ilike.%${search}%`)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rates = (data ?? []).map((r: any) => ({
    id: r.id,
    district_id: r.district_id,
    district_name: r.districts?.name,
    regency_name: r.districts?.regencies?.name,
    province_name: r.districts?.regencies?.provinces?.name,
    instan_rate: r.instan_rate,
    sameday_rate: r.sameday_rate,
    notes: r.notes,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }))

  return NextResponse.json({ rates, total: count ?? 0, page, limit })
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getSupabaseAdmin()
  const { district_id, instan_rate = 0, sameday_rate = 0, notes } = await req.json()

  if (!district_id) return NextResponse.json({ error: 'district_id wajib diisi' }, { status: 400 })
  if (instan_rate === 0 && sameday_rate === 0)
    return NextResponse.json({ error: 'Setidaknya satu jenis tarif harus tersedia (> 0)' }, { status: 400 })

  const { data: existing } = await admin
    .from('shipping_rates')
    .select('id')
    .eq('district_id', district_id)
    .maybeSingle()
  if (existing)
    return NextResponse.json(
      { error: 'Tarif untuk kecamatan ini sudah ada. Silakan edit row yang sudah ada.' },
      { status: 409 }
    )

  const { data, error } = await admin
    .from('shipping_rates')
    .insert({ district_id, instan_rate, sameday_rate, notes: notes || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rate: data }, { status: 201 })
}
