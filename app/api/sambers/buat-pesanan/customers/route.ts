import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET ?q= — cari member (nama / email / no WA) untuk autocomplete form Buat Pesanan,
// lengkap dengan alamat terakhirnya.
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  // Karakter pemisah filter PostgREST dibuang supaya input tidak merusak query.
  const q = (req.nextUrl.searchParams.get('q') ?? '').replace(/[,()*%\\]/g, ' ').trim()
  if (q.length < 2) return NextResponse.json({ customers: [] })

  const digits = q.replace(/\D/g, '')
  // 0812… dan 62812… dianggap sama.
  const phoneKey = digits.length >= 4 ? digits.replace(/^(62|0)/, '') : ''
  const filters = [`name.ilike.%${q}%`, `email.ilike.%${q}%`]
  if (phoneKey) filters.push(`phone.ilike.%${phoneKey}%`)

  const admin = getSupabaseAdmin()
  const { data: users, error } = await admin
    .from('users')
    .select('id, name, email, phone, tier, total_points, special_discount_pct')
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (users ?? []).map((u) => u.id)
  const { data: addresses } = ids.length
    ? await admin
        .from('addresses')
        .select('user_id, recipient_name, phone, full_address, district_id, district, regency_id, city, province_id, province, is_default, created_at')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
    : { data: [] }

  const customers = (users ?? []).map((u) => {
    const own = (addresses ?? []).filter((a) => a.user_id === u.id)
    const addr = own.find((a) => a.is_default) ?? own[0] ?? null
    return { ...u, address: addr }
  })
  return NextResponse.json({ customers })
}
