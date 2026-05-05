import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/sambers/extra-point-promos
// List all extra point promos with pagination + search by email
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    let query = admin
      .from('user_extra_point_promos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ promos: [], total: 0 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ promos: data ?? [], total: count ?? 0 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/sambers/extra-point-promos
// Create a new extra point promo for a user
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const body = await req.json()
    const { email, multiplier, starts_at, ends_at, note } = body

    if (!email) return NextResponse.json({ error: 'email wajib diisi' }, { status: 400 })
    if (!multiplier || multiplier <= 1) {
      return NextResponse.json({ error: 'multiplier harus lebih dari 1' }, { status: 400 })
    }
    if (!starts_at || !ends_at) {
      return NextResponse.json({ error: 'starts_at dan ends_at wajib diisi' }, { status: 400 })
    }
    if (new Date(ends_at) <= new Date(starts_at)) {
      return NextResponse.json({ error: 'ends_at harus setelah starts_at' }, { status: 400 })
    }

    // Lookup user by email from auth.users via admin
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers()
    if (authError) {
      return NextResponse.json({ error: 'Gagal lookup user: ' + authError.message }, { status: 500 })
    }

    const targetUser = authUsers.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )
    if (!targetUser) {
      return NextResponse.json({ error: `User dengan email ${email} tidak ditemukan` }, { status: 404 })
    }

    const { data: promo, error } = await admin
      .from('user_extra_point_promos')
      .insert({
        user_id: targetUser.id,
        email: email.toLowerCase(),
        multiplier: parseFloat(multiplier),
        starts_at,
        ends_at,
        is_active: true,
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ promo }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
