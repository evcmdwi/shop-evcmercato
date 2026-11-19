import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isKkiPhone, loadKkiPhones, loadKkiSuspects } from '@/lib/kki'
import { normalizePhone } from '@/lib/admin-orders'

// GET /api/sambers/member/[id]
// Returns full member detail including special discount fields and order stats.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Missing member id' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Fetch user with order stats via join
  const { data: user, error: userError } = await admin
    .from('users')
    .select(`
      id, name, email, phone, created_at,
      total_points,
      special_discount_pct, special_discount_note, special_discount_set_at,
      kki_distributor, kki_note, kki_marked_at,
      orders!left (
        id, status, total_amount, created_at
      )
    `)
    .eq('id', id)
    .single()

  if (userError || !user) {
    console.error('[GET /api/sambers/member/[id]]', userError)
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const orders = (user.orders as any[]) ?? []
  const kkiDirect = (user as any).kki_distributor === true
  const [kkiPhones, suspects, { data: devices }] = await Promise.all([
    loadKkiPhones(admin),
    loadKkiSuspects(admin, id),
    admin.from('member_devices').select('event, device_id, ip, user_agent, created_at')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(15),
  ])
  const kkiViaLead = !kkiDirect && isKkiPhone(kkiPhones, user.phone)
  const ACTIVE_STATUSES = ['paid', 'processed', 'shipped', 'delivered']
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))

  const orders_count = activeOrders.length
  const orders_total = activeOrders.reduce((sum: number, o: any) => sum + (o.total_amount ?? 0), 0)
  const last_order_at =
    orders.length > 0
      ? orders.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0].created_at
      : null

  return NextResponse.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      evc_points: (user as any).total_points ?? 0,
      special_discount_pct: (user as any).special_discount_pct ?? null,
      special_discount_note: (user as any).special_discount_note ?? null,
      special_discount_set_at: (user as any).special_discount_set_at ?? null,
      kki_distributor: kkiDirect,
      kki_via_lead: kkiViaLead,
      kki_note: (user as any).kki_note ?? null,
      kki_marked_at: (user as any).kki_marked_at ?? null,
      kki_suspect: suspects.get(id) ?? null,
      devices: devices ?? [],
      orders_count,
      orders_total,
      last_order_at,
    },
  })
}

// PATCH /api/sambers/member/[id]
// Body (semua opsional, hanya field yang dikirim yang diubah):
//   { special_discount_pct: number | null, special_discount_note: string | null } — diskon VIP
//   { kki_distributor: boolean, kki_note: string | null } — tanda distributor KKI
//   { name, email, phone } — ubah data member (email = login; ikut diubah di Supabase Auth)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Missing member id' }, { status: 400 })
  }

  const body = await req.json()
  const { special_discount_pct, special_discount_note } = body as {
    special_discount_pct: number | null
    special_discount_note: string | null
  }
  const hasDiscount = 'special_discount_pct' in body
  const hasKki = 'kki_distributor' in body
  const hasProfile = 'name' in body || 'email' in body || 'phone' in body

  // Validate percentage range
  if (
    special_discount_pct !== null &&
    special_discount_pct !== undefined &&
    (special_discount_pct < 0 || special_discount_pct > 100)
  ) {
    return NextResponse.json(
      { error: 'special_discount_pct must be between 0 and 100' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdmin()

  const updatePayload: Record<string, unknown> = {}
  if (hasDiscount) {
    Object.assign(updatePayload, {
      special_discount_pct: special_discount_pct ?? null,
      special_discount_note: special_discount_note ?? null,
      // Set timestamp when discount is being assigned; clear when removed
      special_discount_set_at:
        special_discount_pct != null ? new Date().toISOString() : null,
    })
  }
  if (hasKki) {
    const marked = body.kki_distributor === true
    Object.assign(updatePayload, {
      kki_distributor: marked,
      kki_note: marked ? String(body.kki_note ?? '').trim() || null : null,
      kki_marked_at: marked ? new Date().toISOString() : null,
    })
  }
  if (hasProfile) {
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = body.phone ? normalizePhone(String(body.phone)) : ''
    if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
    if (phone && !/^08\d{7,12}$/.test(phone)) {
      return NextResponse.json({ error: 'No. WA tidak valid (contoh: 081234567890)' }, { status: 400 })
    }

    const { data: current } = await admin.from('users').select('email').eq('id', id).maybeSingle()
    if (!current) return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 })

    const { data: sameEmail } = await admin
      .from('users').select('id').ilike('email', email.replace(/[\\%_]/g, '\\$&')).neq('id', id).limit(1).maybeSingle()
    if (sameEmail) return NextResponse.json({ error: 'Email ini sudah dipakai member lain' }, { status: 409 })
    if (phone) {
      const { data: samePhone } = await admin
        .from('users').select('id, name').in('phone', [phone, '62' + phone.slice(1), '+62' + phone.slice(1)])
        .neq('id', id).limit(1).maybeSingle()
      if (samePhone) return NextResponse.json({ error: `No. WA ini sudah dipakai member ${samePhone.name || 'lain'}` }, { status: 409 })
    }

    // Email = username login member → ubah dulu di Auth (password tetap); gagal = batal semua.
    if ((current.email ?? '').toLowerCase() !== email) {
      const { error: authErr } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true })
      if (authErr) {
        console.error('[PATCH member] update auth email', authErr.message)
        return NextResponse.json({ error: 'Gagal mengubah email login: ' + authErr.message }, { status: 500 })
      }
    }
    Object.assign(updatePayload, { name, email, phone: phone || null })
  }
  if (!hasDiscount && !hasKki && !hasProfile) {
    return NextResponse.json({ error: 'Tidak ada data yang diubah' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await admin
    .from('users')
    .update(updatePayload)
    .eq('id', id)
    .select(
      'id, name, email, phone, special_discount_pct, special_discount_note, special_discount_set_at, kki_distributor, kki_note, kki_marked_at'
    )
    .single()

  if (updateError || !updated) {
    console.error('[PATCH /api/sambers/member/[id]]', updateError)
    return NextResponse.json({ error: 'Gagal menyimpan perubahan member' }, { status: 500 })
  }

  return NextResponse.json({ data: updated })
}
