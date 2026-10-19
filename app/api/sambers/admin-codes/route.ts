import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Kode admin EVC pembuat pesanan (NN = Neny, dst.) — untuk tracking komisi admin.

export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const { data, error } = await getSupabaseAdmin()
    .from('admin_codes')
    .select('code, name, is_active, created_at')
    .order('is_active', { ascending: false })
    .order('code')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ codes: data ?? [] })
}

// Tambah kode baru, atau ubah nama / aktif-nonaktif kode yang sudah ada.
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const code = String(body.code ?? '').trim().toUpperCase()
  const name = typeof body.name === 'string' ? body.name.trim() : undefined
  const isActive = typeof body.is_active === 'boolean' ? body.is_active : undefined

  if (!/^[A-Z0-9]{2,6}$/.test(code)) {
    return NextResponse.json({ error: 'Kode 2–6 huruf/angka, contoh: NN' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: existing } = await admin.from('admin_codes').select('code').eq('code', code).maybeSingle()

  if (!existing) {
    if (!name) return NextResponse.json({ error: 'Nama admin wajib diisi' }, { status: 400 })
    const { error } = await admin.from('admin_codes').insert({ code, name })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const update: Record<string, unknown> = {}
    if (name) update.name = name
    if (isActive !== undefined) update.is_active = isActive
    if (!Object.keys(update).length) return NextResponse.json({ error: `Kode ${code} sudah dipakai` }, { status: 409 })
    const { error } = await admin.from('admin_codes').update(update).eq('code', code)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
