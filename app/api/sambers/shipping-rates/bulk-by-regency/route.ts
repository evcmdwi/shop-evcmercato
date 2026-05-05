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
  // Hanya anggap AKTIF sebagai existing — soft-deleted bisa di-reactivate
  const { data: existing } = await admin
    .from('shipping_rates')
    .select('district_id, id, is_active')
    .in('district_id', districtIds)
  const activeIds = new Set((existing ?? []).filter(e => e.is_active).map(e => e.district_id))
  const softDeletedMap = new Map((existing ?? []).filter(e => !e.is_active).map(e => [e.district_id, e.id]))

  const toCreate = districts.filter(d => !activeIds.has(d.id) && !softDeletedMap.has(d.id))
  const toReactivate = districts.filter(d => softDeletedMap.has(d.id))

  if (!skip_existing && existingIds.size > 0) {
    return NextResponse.json(
      { error: 'Beberapa kecamatan sudah punya tarif. Pilih skip_existing=true.' },
      { status: 400 }
    )
  }

  // Reactivate soft-deleted records
  let reactivated = 0
  for (const d of toReactivate) {
    const id = softDeletedMap.get(d.id)
    await admin.from('shipping_rates').update({ instan_rate, sameday_rate, notes: notes || null, is_active: true }).eq('id', id)
    reactivated++
  }

  if (toCreate.length === 0 && reactivated === 0) {
    return NextResponse.json({
      created: 0,
      skipped: districts.length,
      message: 'Semua kecamatan sudah punya tarif aktif',
    })
  }

  if (toCreate.length > 0) {
    const { error } = await admin.from('shipping_rates').insert(
      toCreate.map(d => ({
        district_id: d.id,
        instan_rate,
        sameday_rate,
        notes: notes || null,
      }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    created: toCreate.length + reactivated,
    skipped: activeIds.size,
    skipped_districts: [...activeIds],
  })
}
