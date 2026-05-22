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

  // If search term provided: first find matching district_ids via 2-step lookup
  // (PostgREST does not support OR filter across related tables in .or())
  let districtIdFilter: string[] | null = null
  if (search) {
    // Step 1: find regency IDs matching the search
    const { data: matchingRegencies } = await admin
      .from('regencies')
      .select('id')
      .ilike('name', `%${search}%`)
    const regencyIds = (matchingRegencies ?? []).map((r: any) => r.id)

    // Step 2: find district IDs from matching regencies OR matching district names
    const districtQueries = [
      admin.from('districts').select('id').ilike('name', `%${search}%`),
    ]
    if (regencyIds.length > 0) {
      districtQueries.push(admin.from('districts').select('id').in('regency_id', regencyIds))
    }
    const results = await Promise.all(districtQueries)
    const allIds = new Set<string>()
    results.forEach(r => (r.data ?? []).forEach((d: any) => allIds.add(d.id)))
    districtIdFilter = allIds.size > 0 ? Array.from(allIds) : ['__no_match__']
  }

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

  if (districtIdFilter) {
    query = query.in('district_id', districtIdFilter)
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

  // Cek apakah sudah ada (aktif maupun soft-deleted)
  const { data: existing } = await admin
    .from('shipping_rates')
    .select('id, is_active')
    .eq('district_id', district_id)
    .maybeSingle()

  if (existing) {
    if (existing.is_active) {
      return NextResponse.json(
        { error: 'Tarif untuk kecamatan ini sudah ada. Silakan edit row yang sudah ada.' },
        { status: 409 }
      )
    }
    // Soft-deleted — reactivate dengan tarif baru
    const { data, error } = await admin
      .from('shipping_rates')
      .update({ instan_rate, sameday_rate, notes: notes || null, is_active: true })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rate: data }, { status: 200 })
  }

  const { data, error } = await admin
    .from('shipping_rates')
    .insert({ district_id, instan_rate, sameday_rate, notes: notes || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rate: data }, { status: 201 })
}
