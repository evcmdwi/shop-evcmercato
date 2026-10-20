import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { normalizePhone } from '@/lib/admin-orders'

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

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

// Password awal member yang ditambah admin (keputusan Dwi); member bisa menggantinya
// sendiri atau tetap memakainya.
const DEFAULT_MEMBER_PASSWORD = '123456'

// POST — admin menambah member baru: login = email ini + DEFAULT_MEMBER_PASSWORD.
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return bad('Unauthorized', auth.status)

  const body = (await req.json().catch(() => ({}))) as { name?: string; phone?: string; email?: string }
  const name = (body.name ?? '').trim()
  const phone = normalizePhone(body.phone ?? '')
  const email = (body.email ?? '').trim().toLowerCase()
  if (!name) return bad('Nama wajib diisi')
  if (!/^08\d{7,12}$/.test(phone)) return bad('No. WA tidak valid (contoh: 081234567890)')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Email tidak valid')

  const admin = getSupabaseAdmin()
  const { data: sameEmail } = await admin
    .from('users').select('id').ilike('email', email.replace(/[\\%_]/g, '\\$&')).limit(1).maybeSingle()
  if (sameEmail) return bad('Email ini sudah terdaftar sebagai member', 409)
  const { data: samePhone } = await admin
    .from('users').select('id, name').in('phone', [phone, '62' + phone.slice(1), '+62' + phone.slice(1)]).limit(1).maybeSingle()
  if (samePhone) return bad(`No. WA ini sudah dipakai member ${samePhone.name || 'lain'}`, 409)

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_MEMBER_PASSWORD,
    email_confirm: true,
    user_metadata: { name, phone },
  })
  if (createErr || !created.user) {
    console.error('[POST /api/sambers/members] create user:', createErr?.message)
    return bad('Gagal membuat member: ' + (createErr?.message ?? 'unknown'), 500)
  }
  // Trigger handle_new_user membuat baris users; pastikan nama & WA terisi.
  const { error: upErr } = await admin
    .from('users').upsert({ id: created.user.id, email, name, phone }, { onConflict: 'id' })
  if (upErr) console.error('[POST /api/sambers/members] upsert users:', upErr.message)

  return NextResponse.json({ id: created.user.id, password: DEFAULT_MEMBER_PASSWORD })
}
