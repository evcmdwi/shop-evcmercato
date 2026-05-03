import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const admin = getSupabaseAdmin()

  // Search districts joined with regencies and provinces
  const { data, error } = await admin
    .from('districts')
    .select(`
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
    `)
    .ilike('name', `%${q}%`)
    .limit(10)

  if (error) {
    console.error('[wilayah search]', error)
    return NextResponse.json({ results: [] })
  }

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
