import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const { id } = await params
  const admin = getSupabaseAdmin()

  // Validate: LP must exist and be ads_only
  const { data: lp, error: fetchErr } = await admin
    .from('landing_pages')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !lp) {
    return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
  }

  if (lp.status !== 'ads_only') {
    return NextResponse.json(
      { error: `Cannot approve: current status is '${lp.status}', expected 'ads_only'` },
      { status: 422 }
    )
  }

  const body = await req.json().catch(() => ({}))

  const updates: Record<string, unknown> = {
    status: 'affiliate_active',
    approved_for_affiliate_at: new Date().toISOString(),
    approved_by_admin_id: auth.userId,
    updated_at: new Date().toISOString(),
  }

  const optionalFields = [
    'title', 'description', 'preview_image_url',
    'target_audience', 'conversion_benchmark_pct',
  ] as const

  for (const field of optionalFields) {
    if (field in body && body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  const { data, error } = await admin
    .from('landing_pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
