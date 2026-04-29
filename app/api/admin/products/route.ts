import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/products — list all products with their variants
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.message }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const { data: products, error, count } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      categories (id, name, slug),
      product_variants (
        id, name, price, stock, sku, is_active, sort_order, created_at
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: products,
    meta: { page, limit, total: count }
  })
}

// POST /api/admin/products — create product, optionally with variants
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth(req)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.message }, { status: auth.status })
  }

  const body = await req.json()
  const { variants, images, ...productData } = body

  // Sync image_url from images array
  if (images && Array.isArray(images) && images.length > 0) {
    productData.images = images
    productData.image_url = images[0] || null
  }

  // If variants provided, mark has_variants and zero out price/stock
  if (variants && Array.isArray(variants) && variants.length > 0) {
    productData.has_variants = true
    productData.price = 0
    productData.stock = 0
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .insert(productData)
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  // Insert variants if provided
  if (variants && Array.isArray(variants) && variants.length > 0) {
    const variantRows = variants.map((v: Record<string, unknown>, i: number) => ({
      product_id: product.id,
      name: v.name,
      price: v.price,
      stock: v.stock ?? 0,
      sku: v.sku ?? null,
      image_url: v.image_url ?? null,
      is_active: v.is_active ?? true,
      sort_order: v.sort_order ?? i,
    }))

    const { error: variantError } = await supabaseAdmin
      .from('product_variants')
      .insert(variantRows)

    if (variantError) {
      return NextResponse.json(
        { data: product, warning: `Product created but variants failed: ${variantError.message}` },
        { status: 207 }
      )
    }
  }

  // Re-fetch product with variants
  const { data: result } = await supabaseAdmin
    .from('products')
    .select(`*, product_variants (*)`)
    .eq('id', product.id)
    .single()

  return NextResponse.json({ data: result }, { status: 201 })
}
