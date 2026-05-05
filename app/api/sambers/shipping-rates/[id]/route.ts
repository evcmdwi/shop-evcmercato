import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const admin = getSupabaseAdmin()
  const body = await req.json()

  // Validate at least one rate > 0 after update
  if (body.instan_rate !== undefined || body.sameday_rate !== undefined) {
    const { data: current } = await admin
      .from('shipping_rates')
      .select('instan_rate, sameday_rate')
      .eq('id', id)
      .single()
    const newInstan = body.instan_rate ?? current?.instan_rate ?? 0
    const newSameday = body.sameday_rate ?? current?.sameday_rate ?? 0
    if (newInstan === 0 && newSameday === 0) {
      return NextResponse.json(
        { error: 'Setidaknya 1 tarif harus > 0. Untuk hapus tarif sepenuhnya, gunakan tombol Hapus.' },
        { status: 400 }
      )
    }
  }

  const { data, error } = await admin
    .from('shipping_rates')
    .update(body)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rate: data })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const admin = getSupabaseAdmin()
  await admin.from('shipping_rates').update({ is_active: false }).eq('id', id)
  return NextResponse.json({ success: true })
}
