import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const admin = getSupabaseAdmin()

  const selectQuery = `
    id,
    name,
    regencies!inner (
      id,
      name,
      provinces!inner (
        id,
        name
      )
    )
  `

  // Search by district name
  const { data: byDistrict, error: e1 } = await admin
    .from('districts')
    .select(selectQuery)
    .ilike('name', `%${q}%`)
    .limit(10)

  // Search by regency/city name (e.g. "jakarta barat")
  const { data: byRegency, error: e2 } = await admin
    .from('districts')
    .select(selectQuery)
    .ilike('regencies.name', `%${q}%`)
    .limit(10)

  if (e1 || e2) {
    console.error('[wilayah search]', e1 || e2)
    return NextResponse.json({ results: [] })
  }

  // Merge and deduplicate
  const seen = new Set<string>()
  const data = [...(byDistrict ?? []), ...(byRegency ?? [])].filter(d => {
    if (seen.has(d.id)) return false
    seen.add(d.id)
    return true
  }).slice(0, 15)

  const results = (data ?? []).map((d: any) => ({
    district_id: d.id,
    district_name: d.name,
    regency_id: d.regencies.id,
    regency_name: d.regencies.name,
    province_id: d.regencies.provinces.id,
    province_name: d.regencies.provinces.name,
    display: `${d.name}, ${d.regencies.name}, ${d.regencies.provinces.name}`,
  }))

  return NextResponse.json({ results }, {
    headers: { 'Cache-Control': 'public, max-age=86400' }
  })
}
