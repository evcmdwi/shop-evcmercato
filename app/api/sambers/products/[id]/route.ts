import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
    }

    const admin = getSupabaseAdmin()
    const { id } = await params

    const { data: product, error } = await admin
      .from('products')
      .select(`
        id, name, description, price, stock, is_active, images, image_url,
        has_variants, initial_sold_count, category_id, created_at,
        categories (id, name, slug),
        product_variants (id, name, price, stock, sku, is_active, image_url, sort_order)
      `)
      .eq('id', id)
      .single()

    if (error || !product) {
      console.error('[/api/sambers/products/[id] GET]', error?.message)
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    // Spread product fields directly (consistent with list endpoint pattern)
    return NextResponse.json({ ...product })
  } catch (err) {
    console.error('[/api/sambers/products/[id] GET] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
    }

    const admin = getSupabaseAdmin()
    const { id } = await params
    const body = await req.json()
    const { variants, images, ...productData } = body

    if (images && Array.isArray(images)) {
      productData.images = images
      productData.image_url = images[0] || null
    }

    const { data: product, error } = await admin
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[/api/sambers/products/[id] PATCH]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (variants && Array.isArray(variants)) {
      await admin.from('product_variants').delete().eq('product_id', id)
      if (variants.length > 0) {
        const variantData = variants.map((v: any, i: number) => ({
          product_id: id,
          name: v.name,
          price: Number(v.price),
          stock: Number(v.stock),
          sku: v.sku || null,
          image_url: v.image_url || null,
          sort_order: i,
          is_active: true,
        }))
        await admin.from('product_variants').insert(variantData)
      }
    }

    return NextResponse.json({ ...product, message: 'Produk berhasil diperbarui' })
  } catch (err) {
    console.error('[/api/sambers/products/[id] PATCH] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
