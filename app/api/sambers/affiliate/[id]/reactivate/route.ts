import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }
  if (auth.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super_admin only' }, { status: 403 })
  }

  const { id } = await params
  const admin = getSupabaseAdmin()

  const { data: affiliate, error: fetchErr } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  if (affiliate.status !== 'suspended') {
    return NextResponse.json({ error: 'Affiliate is not suspended' }, { status: 400 })
  }

  const { error: updateErr } = await admin
    .from('affiliates')
    .update({
      status: 'approved',
      suspended_reason: null,
      suspended_at: null,
    })
    .eq('id', id)

  if (updateErr) {
    console.error('[reactivate affiliate]', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Re-enable short links
  await admin
    .from('short_links')
    .update({ status: 'active' })
    .eq('affiliate_id', id)

  return NextResponse.json({ success: true })
}
