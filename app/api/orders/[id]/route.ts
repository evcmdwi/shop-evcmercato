import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const admin = getSupabaseAdmin()

    // Get order detail with items
    const { data: order, error } = await admin
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
        shipping_phone,
        shipping_full_address,
        shipping_city,
        shipping_province,
        shipping_postal_code,
        shipping_district_name,
        shipping_regency_name,
        xendit_invoice_id,
        xendit_invoice_url,
        delivery_note,
        created_at,
        order_items(
          id,
          product_id,
          variant_id,
          product_name,
          variant_name,
          price,
          quantity,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: order })

  } catch (err) {
    console.error('GET /api/orders/[id] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
