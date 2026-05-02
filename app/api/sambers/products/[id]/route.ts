import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  }

  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, initial_sold_count, categories(id, name), product_variants(*), product_sold_counts!inner(total_sold)')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 404 })
  }

  const { product_sold_counts, ...rest } = data as Record<string, unknown>
  const sold = product_sold_counts as { total_sold: number } | null
  return NextResponse.json({ ...rest, total_sold: sold?.total_sold ?? rest.initial_sold_count ?? 0 })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  }

  const { id } = await params
  const body = await req.json()
  const {
    name,
    description,
    category_id,
    is_active,
    images,
    has_variants,
    price,
    stock,
    variants,
  } = body

  const updates: Record<string, unknown> = {}
  const { initial_sold_count } = body
  if (initial_sold_count !== undefined) updates.initial_sold_count = Number(initial_sold_count)
  if (name !== undefined) updates.name = name.trim()
  if (description !== undefined) updates.description = description?.trim() || null
  if (category_id !== undefined) updates.category_id = category_id || null
  if (is_active !== undefined) updates.is_active = is_active
  if (images !== undefined) {
    updates.images = images
    updates.image_url = images.length > 0 ? images[0] : null
  }
  if (has_variants !== undefined) {
    updates.has_variants = has_variants
    updates.price = has_variants ? 0 : (Number(price) || 0)
    updates.stock = has_variants ? 0 : (Number(stock) || 0)
  } else {
    if (price !== undefined) updates.price = Number(price) || 0
    if (stock !== undefined) updates.stock = Number(stock) || 0
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ data: null, error: productError.message }, { status: 500 })
  }

  // Sync variants if provided
  if (has_variants !== undefined) {
    await supabaseAdmin.from('product_variants').delete().eq('product_id', id)

    if (has_variants && variants && variants.length > 0) {
      const variantRows = variants.map((v: { name: string; price: number; stock: number; image_url?: string | null }, i: number) => ({
        product_id: id,
        name: v.name,
        price: Number(v.price),
        stock: Number(v.stock),
        image_url: v.image_url ?? null,
        is_active: true,
        sort_order: i,
      }))

      const { error: variantError } = await supabaseAdmin
        .from('product_variants')
        .insert(variantRows)

      if (variantError) {
        console.error('[PATCH /api/sambers/products/:id] variant error:', variantError)
      }
    }
  }

  return NextResponse.json({ data: product, error: null })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  }

  const { id } = await params
  await supabaseAdmin.from('product_variants').delete().eq('product_id', id)

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: null, error: null })
}
