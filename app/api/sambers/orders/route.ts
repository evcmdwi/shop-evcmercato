import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/orders — list all orders with pagination + filter
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json(
      { data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  let query = supabaseAdmin
    .from('orders')
    .select(
      `
      id,
      status,
      total_amount,
      created_at,
      paid_at,
      shipped_at,
      tracking_number,
      profiles!orders_user_id_fkey (
        full_name,
        email,
        phone
      ),
      order_items (id)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    // Search by short order ID (first 8 chars of UUID) or match full UUID
    const isUuid = /^[0-9a-f-]{8,}$/i.test(search)
    if (isUuid) {
      query = query.ilike('id', `${search}%`)
    }
  }

  const { data: orders, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Post-filter by customer name if search doesn't look like an order ID
  let filteredOrders = orders ?? []
  if (search && !/^[0-9a-f-]{8,}$/i.test(search)) {
    const lowerSearch = search.toLowerCase()
    filteredOrders = filteredOrders.filter((o) => {
      const profile = o.profiles as { full_name?: string; email?: string } | null
      return (
        profile?.full_name?.toLowerCase().includes(lowerSearch) ||
        profile?.email?.toLowerCase().includes(lowerSearch)
      )
    })
  }

  const formattedOrders = filteredOrders.map((o) => {
    const profile = o.profiles as { full_name?: string; email?: string; phone?: string } | null
    const items = o.order_items as { id: string }[] | null
    return {
      id: o.id,
      short_id: (o.id as string).slice(0, 8).toUpperCase(),
      status: o.status,
      total_amount: o.total_amount,
      created_at: o.created_at,
      paid_at: o.paid_at,
      shipped_at: o.shipped_at,
      tracking_number: o.tracking_number,
      customer_name: profile?.full_name ?? '—',
      customer_email: profile?.email ?? '—',
      customer_phone: profile?.phone ?? '—',
      items_count: items?.length ?? 0,
    }
  })

  return NextResponse.json({
    data: {
      orders: formattedOrders,
      total: count ?? 0,
      page,
      limit,
    },
  })
}
