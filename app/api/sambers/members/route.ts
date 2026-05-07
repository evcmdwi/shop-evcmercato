import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const offset = (page - 1) * limit

  const admin = getSupabaseAdmin()

  let query = admin
    .from('users')
    .select(
      `id, name, email, phone, created_at, total_points, tier,
       orders!left ( id, status )`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[GET /api/sambers/members]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ACTIVE_STATUSES = ['paid', 'processed', 'shipped', 'delivered']

  const members = (data ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    created_at: u.created_at,
    total_points: u.total_points ?? 0,
    tier: u.tier ?? 'silver',
    has_order: Array.isArray(u.orders)
      ? u.orders.some((o: any) => ACTIVE_STATUSES.includes(o.status))
      : false,
  }))

  return NextResponse.json({ members, total: count ?? 0 })
}
