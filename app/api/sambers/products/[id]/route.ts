import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { slugify } from '@/lib/utils'

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
        has_variants, initial_sold_count, search_keywords, category_id, created_at,
        gtin, mpn, google_product_category_id, google_product_category_path, product_type, material,
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

    // If product has_variants, do NOT overwrite products.price with 0.
    // Price lives in product_variants. If there's a single "Default" variant,
    // sync products.price from that variant price after variant upsert.
    const isVariantProduct = productData.has_variants === true
    if (isVariantProduct) {
      delete productData.price
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
      // Varian diperbarui DI TEMPAT (cocok lewat id, lalu nama) — JANGAN hapus+buat
      // ulang: order_items/point_promos/point_redemptions kehilangan variant_id
      // (FK SET NULL) dan commission_line_items menolak penghapusan (FK) → simpan gagal.
      // Varian yang dibuang dari form hanya dinonaktifkan agar riwayat tetap utuh.
      const { data: existingVariants, error: exError } = await admin
        .from('product_variants')
        .select('id, name, image_url')
        .eq('product_id', id)
      if (exError) {
        return NextResponse.json({ error: exError.message }, { status: 500 })
      }
      const existing = existingVariants ?? []
      const byId = new Map(existing.map((v) => [v.id as string, v]))
      const byName = new Map(existing.map((v) => [String(v.name).trim().toLowerCase(), v]))
      const kept = new Set<string>()

      for (const [i, v] of (variants as Record<string, unknown>[]).entries()) {
        const fields: Record<string, unknown> = {
          name: String(v.name ?? '').trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          image_url: v.image_url || null,
          sort_order: i,
          is_active: true,
        }
        if ('sku' in v) fields.sku = v.sku || null
        // Cocokkan: id → nama → foto yang sama (nama diganti dari form tanpa id,
        // mis. tab Sambers versi lama) — agar tak membuat varian dobel tanpa PV/riwayat.
        const match =
          (typeof v.id === 'string' && byId.get(v.id)) ||
          byName.get(String(fields.name).toLowerCase()) ||
          (fields.image_url ? existing.find((e) => !kept.has(e.id) && e.image_url === fields.image_url) : undefined)

        if (match && !kept.has(match.id)) {
          kept.add(match.id)
          const { error: upError } = await admin.from('product_variants').update(fields).eq('id', match.id)
          if (upError) {
            console.error('[products PATCH] update variant error:', upError.message)
            return NextResponse.json({ error: upError.message }, { status: 500 })
          }
        } else {
          const { error: insError } = await admin
            .from('product_variants')
            .insert({ ...fields, product_id: id, affiliate_pv_value: Number(v.affiliate_pv_value ?? 0) })
          if (insError) {
            console.error('[products PATCH] insert variant error:', insError.message)
            return NextResponse.json({ error: insError.message }, { status: 500 })
          }
        }
      }

      const removedIds = existing.map((v) => v.id as string).filter((vid) => !kept.has(vid))
      if (removedIds.length > 0) {
        // Varian nonaktif tidak bisa dibeli → keluarkan dari keranjang.
        await admin.from('cart_items').delete().in('variant_id', removedIds)
        const { error: offError } = await admin
          .from('product_variants')
          .update({ is_active: false })
          .in('id', removedIds)
        if (offError) {
          console.error('[products PATCH] deactivate variants error:', offError.message)
          return NextResponse.json({ error: offError.message }, { status: 500 })
        }
      }
    }

    // If single "Default" variant, sync products.price from that variant so
    // the admin list shows the correct price.
    if (variants && Array.isArray(variants)) {
      const defaultVariants = variants.filter(
        (v: any) => v.name?.toLowerCase() === 'default'
      )
      if (defaultVariants.length === 1 && variants.length === 1) {
        const syncPrice = Number(defaultVariants[0].price)
        if (!isNaN(syncPrice) && syncPrice > 0) {
          await admin
            .from('products')
            .update({ price: syncPrice })
            .eq('id', id)
        }
      }
    }

    // Invalidate product page and catalog cache
    const productSlug = slugify(product.name)
    revalidatePath(`/katalog/${productSlug}`)
    revalidatePath('/katalog')
    revalidatePath('/sambers/produk')
    revalidateTag('home-data', { expire: 0 }) // daftar produk beranda (app/page.tsx)
    revalidateTag('lp-supergreen', { expire: 0 }) // harga paket di /lp/supergreen-food

    return NextResponse.json({ ...product, message: 'Produk berhasil diperbarui' })
  } catch (err) {
    console.error('[/api/sambers/products/[id] PATCH] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
