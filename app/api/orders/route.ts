import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // List orders for auth user, sorted created_at DESC
    // Include order_items count via subquery
    const { data: orders, error } = await admin
      .from('orders')
      .select(`
        id,
        status,
        subtotal,
        shipping_cost,
        shipping_cost_discount,
        service_fee,
        service_fee_discount,
        total_amount,
        points_earned,
        shipping_method,
        shipping_recipient_name,
        shipping_city,
        shipping_province,
        xendit_invoice_url,
        created_at,
        order_items(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/orders error:', error)
      return NextResponse.json({ error: 'Gagal mengambil pesanan' }, { status: 500 })
    }

    // Normalize order_items count
    const normalized = (orders ?? []).map(o => ({
      ...o,
      items_count: Array.isArray(o.order_items)
        ? (o.order_items[0] as { count: number } | undefined)?.count ?? 0
        : 0,
      order_items: undefined,
    }))

    return NextResponse.json({ data: normalized })

  } catch (err) {
    console.error('GET /api/orders error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
