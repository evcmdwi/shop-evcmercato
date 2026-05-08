import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }
  if (auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super_admin only' }, { status: 403 })
  }

  const { variantId } = await params

  let body: { pv_value?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const pvValue = Number(body.pv_value)
  if (!Number.isFinite(pvValue) || pvValue < 0) {
    return NextResponse.json({ error: 'pv_value must be a non-negative number' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('product_variants')
    .update({ affiliate_pv_value: pvValue })
    .eq('id', variantId)
    .select('id, affiliate_pv_value')
    .single()

  if (error) {
    console.error('[PATCH /api/sambers/affiliate/product-pv/[variantId]]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    variant_id: data.id,
    pv_value: data.affiliate_pv_value,
  })
}
