import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending'
  const search = searchParams.get('search') || ''
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

  const admin = getSupabaseAdmin()

  let query = admin
    .from('affiliates')
    .select(`
      id,
      user_id,
      full_name_kkd,
      kki_member_id,
      director_leader,
      whatsapp,
      email,
      applied_at,
      status,
      affiliate_channels ( platform, link_or_username )
    `, { count: 'exact' })
    .eq('status', status)
    .order('applied_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`full_name_kkd.ilike.%${search}%,kki_member_id.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: applications, error, count } = await query

  if (error) {
    console.error('[GET /api/sambers/affiliate/applications]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Normalize: rename affiliate_channels -> channels
  const normalized = (applications ?? []).map((a: Record<string, unknown>) => ({
    ...a,
    channels: a.affiliate_channels,
    affiliate_channels: undefined,
  }))

  return NextResponse.json({ applications: normalized, total: count ?? 0 })
}
