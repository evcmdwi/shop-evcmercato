import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
    }

    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit
    const status = searchParams.get('status') || ''
    const orderType = searchParams.get('order_type') || ''
    const search = searchParams.get('search') || ''

    let query = admin
      .from('orders')
      .select(`
        id, status, order_type, total_amount, created_at, paid_at, shipped_at,
        tracking_number, shipping_courier, user_id, shipping_method,
        shipping_recipient_name, shipping_phone,
        order_items (id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (orderType && orderType !== 'all') query = query.eq('order_type', orderType)
    if (search) query = query.ilike('shipping_recipient_name', `%${search}%`)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('[/api/sambers/orders] query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user info separately to avoid join issues
    const userIds = [...new Set((orders ?? []).map((o: any) => o.user_id).filter(Boolean))]
    let userMap: Record<string, { name: string | null; email: string | null; phone: string | null }> = {}
    if (userIds.length > 0) {
      const { data: users } = await admin
        .from('users')
        .select('id, name, email, phone')
        .in('id', userIds)
      if (users) {
        for (const u of users as any[]) {
          userMap[u.id] = { name: u.name, email: u.email, phone: u.phone }
        }
      }
    }

    const enriched = (orders ?? []).map((o: any) => {
      const user = userMap[o.user_id] ?? null
      return {
        ...o,
        short_id: o.id.slice(0, 8).toUpperCase(),
        customer_name: user?.name || o.shipping_recipient_name || '—',
        customer_email: user?.email || '—',
        user,
        items_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
      }
    })

    return NextResponse.json({
      data: enriched,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (err) {
    console.error('[/api/sambers/orders] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
