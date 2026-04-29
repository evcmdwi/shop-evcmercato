import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.message }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? '50')

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, description')
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  // Attach product count
  const ids = (data ?? []).map((c: { id: string }) => c.id)
  let counts: Record<string, number> = {}
  if (ids.length > 0) {
    const { data: countData } = await supabaseAdmin
      .from('products')
      .select('category_id')
      .in('category_id', ids)
    if (countData) {
      for (const row of countData as { category_id: string }[]) {
        counts[row.category_id] = (counts[row.category_id] ?? 0) + 1
      }
    }
  }

  const result = (data ?? []).map((c: { id: string; name: string; slug: string; description: string | null }) => ({
    ...c,
    product_count: counts[c.id] ?? 0,
  }))

  return NextResponse.json({ data: result, error: null })
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.message }, { status: auth.status })
  }

  const body = await req.json()
  const { name, slug, description } = body

  if (!name?.trim()) {
    return NextResponse.json({ data: null, error: 'Nama kategori wajib diisi' }, { status: 400 })
  }
  if (!slug?.trim()) {
    return NextResponse.json({ data: null, error: 'Slug wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name: name.trim(), slug: slug.trim(), description: description?.trim() || null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ data: null, error: 'Slug sudah digunakan' }, { status: 409 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
