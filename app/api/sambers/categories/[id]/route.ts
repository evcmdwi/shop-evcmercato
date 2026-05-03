import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  }

  const { id } = await params
  const { data, error } = await getSupabaseAdmin()
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data, error: null })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  }

  const { id } = await params
  const body = await req.json()
  const { name, slug, description } = body

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim()
  if (slug !== undefined) updates.slug = slug.trim()
  if (description !== undefined) updates.description = description?.trim() || null

  const { data, error } = await getSupabaseAdmin()
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  }

  const { id } = await params
  const { error } = await getSupabaseAdmin().from('categories').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: null, error: null })
}
