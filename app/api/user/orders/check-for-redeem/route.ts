import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/user/orders/check-for-redeem?order_code=ABC12345
// Auth: user session required
// Returns { valid: true, order_id, order_code, status } or { valid: false, reason }

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ valid: false, reason: 'unauthorized' }, { status: 401 })
    }

    const orderCode = req.nextUrl.searchParams.get('order_code')?.trim().toUpperCase()
    if (!orderCode || orderCode.length < 4) {
      return NextResponse.json({ valid: false, reason: 'kode_terlalu_pendek' })
    }

    const admin = getSupabaseAdmin()

    // Search order by external_id or id containing the order_code
    const { data: orders } = await admin
      .from('orders')
      .select('id, status, user_id, external_id')
      .or(`external_id.ilike.%${orderCode}%,id.ilike.%${orderCode}%`)
      .limit(5)

    if (!orders || orders.length === 0) {
      return NextResponse.json({ valid: false, reason: 'tidak_ditemukan' })
    }

    // Find order belonging to this user
    const order = orders.find((o) => o.user_id === user.id)
    if (!order) {
      return NextResponse.json({ valid: false, reason: 'bukan_milik_kamu' })
    }

    // Status checks
    if (['shipped', 'delivered'].includes(order.status)) {
      return NextResponse.json({ valid: false, reason: 'sudah_dikirim' })
    }

    if (order.status === 'pending') {
      return NextResponse.json({ valid: false, reason: 'belum_dibayar' })
    }

    if (['cancelled', 'expired'].includes(order.status)) {
      return NextResponse.json({ valid: false, reason: 'order_tidak_aktif' })
    }

    // paid or processed = valid for combining
    if (['paid', 'processed'].includes(order.status)) {
      return NextResponse.json({
        valid: true,
        order_id: order.id,
        order_code: orderCode,
        status: order.status,
      })
    }

    // Unknown status
    return NextResponse.json({ valid: false, reason: 'status_tidak_dikenal' })
  } catch (err) {
    console.error('[check-for-redeem]', err)
    return NextResponse.json({ valid: false, reason: 'server_error' }, { status: 500 })
  }
}
