import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
    }

    const admin = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    let query = admin
      .from('products')
      .select(`
        id, name, description, price, stock, is_active, images, image_url,
        has_variants, initial_sold_count, category_id, created_at,
        categories (id, name, slug),
        product_variants (id, name, price, stock, is_active, sort_order)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) query = query.ilike('name', `%${search}%`)
    if (category) query = query.eq('category_id', category)
    if (status === 'active') query = query.eq('is_active', true)
    if (status === 'inactive') query = query.eq('is_active', false)

    const { data: products, error, count } = await query

    if (error) {
      console.error('[/api/sambers/products] query error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: products ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      meta: { page, limit, total: count ?? 0 }
    })
  } catch (err) {
    console.error('[/api/sambers/products] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
    }

    const admin = getSupabaseAdmin()
    const body = await req.json()
    const { variants, images, ...productData } = body

    if (images && Array.isArray(images) && images.length > 0) {
      productData.images = images
      productData.image_url = images[0] || null
    }

    if (variants && Array.isArray(variants) && variants.length > 0) {
      productData.has_variants = true
      productData.price = 0
      productData.stock = 0
    }

    const { data: product, error } = await admin
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) {
      console.error('[/api/sambers/products POST] error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantData = variants.map((v: Record<string, unknown>, i: number) => ({
        product_id: product.id,
        name: v.name,
        price: Number(v.price),
        stock: Number(v.stock),
        sku: v.sku || null,
        image_url: v.image_url || null,
        sort_order: i,
      }))
      await admin.from('product_variants').insert(variantData)
    }

    return NextResponse.json({ data: product, message: 'Produk berhasil ditambahkan' })
  } catch (err) {
    console.error('[/api/sambers/products POST] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
