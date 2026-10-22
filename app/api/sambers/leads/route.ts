import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isKkiPhone, loadKkiPhones } from '@/lib/kki'

// GET — list leads with optional search
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl
  const search = url.searchParams.get('search') || ''
  const page = parseInt(url.searchParams.get('page') || '1')
  const limitParam = parseInt(url.searchParams.get('limit') || '50')
  const limit = Math.min(Math.max(limitParam, 1), 200) // clamp 1–200
  const offset = (page - 1) * limit

  const admin = getSupabaseAdmin()
  let query = admin
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`nama.ilike.%${search}%,phone.ilike.%${search}%,kota.ilike.%${search}%,interest.ilike.%${search}%`)
  }

  const [{ data: rows, count, error }, kkiPhones] = await Promise.all([query, loadKkiPhones(admin)])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // kki_match: ditandai di lead ini, atau nomornya ditandai KKI di Member.
  const data = (rows ?? []).map((l) => ({ ...l, kki_match: l.kki_distributor || isKkiPhone(kkiPhones, l.phone) }))

  return NextResponse.json({ data, count, page, totalPages: Math.ceil((count ?? 0) / limit) })
}

// POST — add new lead
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { nama, phone, kota, alamat, interest, notes } = body

  if (!nama?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Nama dan No HP wajib diisi' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('leads')
    .insert({ nama: nama.trim(), phone: phone.trim(), kota, alamat, interest, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
