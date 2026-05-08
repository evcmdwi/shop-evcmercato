import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateAffiliateCode } from '@/lib/affiliate/tracking'
import { notifyAffiliateApproved } from '@/lib/affiliate/notifications'

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
  const body = await req.json().catch(() => ({}))
  const notes = (body.notes_for_user as string | undefined) ?? null

  const admin = getSupabaseAdmin()

  // Fetch affiliate to get full_name_kkd
  const { data: affiliate, error: fetchErr } = await admin
    .from('affiliates')
    .select('id, full_name_kkd, status, user_id')
    .eq('id', id)
    .single()

  if (fetchErr || !affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  if (affiliate.status !== 'pending') {
    return NextResponse.json({ error: 'Application is not in pending status' }, { status: 400 })
  }

  // Generate affiliate code
  const affiliateCode = await generateAffiliateCode(affiliate.full_name_kkd, admin)

  // Update affiliate
  const { error: updateErr } = await admin
    .from('affiliates')
    .update({
      status: 'approved',
      affiliate_code: affiliateCode,
      approved_at: new Date().toISOString(),
      approved_by_user_id: auth.userId,
    })
    .eq('id', id)

  if (updateErr) {
    console.error('[approve affiliate]', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Send WA + email + in-app notification (non-critical)
  notifyAffiliateApproved(id, notes ?? undefined).catch(console.error)

  return NextResponse.json({ success: true, affiliate_code: affiliateCode })
}
