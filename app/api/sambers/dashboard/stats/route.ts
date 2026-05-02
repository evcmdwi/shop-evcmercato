import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const { ok, status } = await checkAdminAuth()
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })

    const admin = getSupabaseAdmin()

    // Order counts per status
    const [pendingRes, paidRes, processedRes, shippedRes, deliveredRes, productsRes, categoriesRes, usersRes] = await Promise.all([
      admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
      admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'processed'),
      admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'shipped'),
      admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
      admin.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('categories').select('id', { count: 'exact', head: true }),
      admin.from('users').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      data: {
        orders: {
          pending: pendingRes.count ?? 0,
          paid: paidRes.count ?? 0,
          processed: processedRes.count ?? 0,
          shipped: shippedRes.count ?? 0,
          delivered: deliveredRes.count ?? 0,
        },
        inventory: {
          products: productsRes.count ?? 0,
          categories: categoriesRes.count ?? 0,
          users: usersRes.count ?? 0,
        },
      }
    })
  } catch (err) {
    console.error('[/api/sambers/dashboard/stats]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
