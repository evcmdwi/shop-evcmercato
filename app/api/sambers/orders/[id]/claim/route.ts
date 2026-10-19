import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const PAID = ['paid', 'processed', 'shipped', 'delivered']
const CLAIM_WINDOW_DAYS = 3

// Klaim closing manual: pesanan lunas tanpa kode admin, maks 3 hari setelah bayar.
// admin_code null → batalkan klaim (hanya untuk pesanan bersumber 'klaim').
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const adminCode = body.admin_code ? String(body.admin_code).trim().toUpperCase() : null

  const admin = getSupabaseAdmin()
  const { data: order } = await admin
    .from('orders')
    .select('id, status, order_type, paid_at, admin_code, admin_source')
    .eq('id', id)
    .single()
  if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })

  if (!adminCode) {
    if (order.admin_source !== 'klaim') return NextResponse.json({ error: 'Hanya klaim manual yang bisa dibatalkan' }, { status: 400 })
    const { error } = await admin
      .from('orders')
      .update({ admin_code: null, admin_source: null, admin_claimed_at: null })
      .eq('id', id)
      .eq('admin_source', 'klaim')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ order: { admin_code: null, admin_source: null, admin_claimed_at: null } })
  }

  if (order.order_type !== 'purchase' || !PAID.includes(order.status)) {
    return NextResponse.json({ error: 'Hanya pesanan yang sudah lunas yang bisa diklaim' }, { status: 400 })
  }
  if (order.admin_code) return NextResponse.json({ error: `Sudah tercatat closing ${order.admin_code}` }, { status: 409 })
  if (!order.paid_at || Date.now() - new Date(order.paid_at).getTime() > CLAIM_WINDOW_DAYS * 86400000) {
    return NextResponse.json({ error: `Klaim maksimal ${CLAIM_WINDOW_DAYS} hari setelah pesanan dibayar` }, { status: 400 })
  }

  const { data: code } = await admin.from('admin_codes').select('is_active').eq('code', adminCode).maybeSingle()
  if (!code?.is_active) return NextResponse.json({ error: 'Kode admin tidak aktif' }, { status: 400 })

  const claimedAt = new Date().toISOString()
  const { data: updated, error } = await admin
    .from('orders')
    .update({ admin_code: adminCode, admin_source: 'klaim', admin_claimed_at: claimedAt })
    .eq('id', id)
    .is('admin_code', null)
    .select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!updated?.length) return NextResponse.json({ error: 'Pesanan baru saja diklaim admin lain' }, { status: 409 })
  return NextResponse.json({ order: { admin_code: adminCode, admin_source: 'klaim', admin_claimed_at: claimedAt } })
}
