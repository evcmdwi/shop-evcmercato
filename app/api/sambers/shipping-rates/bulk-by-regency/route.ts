import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getSupabaseAdmin()
  const {
    regency_id,
    instan_rate = 0,
    sameday_rate = 0,
    notes,
    skip_existing = true,
  } = await req.json()

  if (!regency_id) return NextResponse.json({ error: 'regency_id wajib' }, { status: 400 })
  if (instan_rate === 0 && sameday_rate === 0)
    return NextResponse.json({ error: 'Setidaknya satu jenis tarif harus > 0' }, { status: 400 })

  const { data: districts } = await admin
    .from('districts')
    .select('id, name')
    .eq('regency_id', regency_id)
  if (!districts?.length)
    return NextResponse.json({ error: 'Tidak ada kecamatan di kota ini' }, { status: 404 })

  const districtIds = districts.map(d => d.id)
  const { data: existing } = await admin
    .from('shipping_rates')
    .select('district_id')
    .in('district_id', districtIds)
  const existingIds = new Set((existing ?? []).map(e => e.district_id))

  const toCreate = districts.filter(d => !existingIds.has(d.id))

  if (!skip_existing && existingIds.size > 0) {
    return NextResponse.json(
      { error: 'Beberapa kecamatan sudah punya tarif. Pilih skip_existing=true.' },
      { status: 400 }
    )
  }

  if (toCreate.length === 0) {
    return NextResponse.json({
      created: 0,
      skipped: districts.length,
      message: 'Semua kecamatan sudah punya tarif',
    })
  }

  const { error } = await admin.from('shipping_rates').insert(
    toCreate.map(d => ({
      district_id: d.id,
      instan_rate,
      sameday_rate,
      notes: notes || null,
    }))
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    created: toCreate.length,
    skipped: existingIds.size,
    skipped_districts: [...existingIds],
  })
}
