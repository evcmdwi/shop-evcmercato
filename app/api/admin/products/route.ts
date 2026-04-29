import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/products — list all products with their variants
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const { data: products, error, count } = await supabase
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
  const body = await req.json()
  const { variants, ...productData } = body

  // If variants provided, mark has_variants
  if (variants && Array.isArray(variants) && variants.length > 0) {
    productData.has_variants = true
  }

  const { data: product, error: productError } = await supabase
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
      is_active: v.is_active ?? true,
      sort_order: v.sort_order ?? i,
    }))

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variantRows)

    if (variantError) {
      // Product created but variants failed — return partial success with warning
      return NextResponse.json(
        { data: product, warning: `Product created but variants failed: ${variantError.message}` },
        { status: 207 }
      )
    }
  }

  // Re-fetch product with variants
  const { data: result } = await supabase
    .from('products')
    .select(`*, product_variants (*)`)
    .eq('id', product.id)
    .single()

  return NextResponse.json({ data: result }, { status: 201 })
}
