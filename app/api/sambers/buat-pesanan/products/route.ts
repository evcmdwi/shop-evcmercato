import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET — produk aktif + varian aktif (harga & stok) untuk pilihan paket di Buat Pesanan.
export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const { data, error } = await getSupabaseAdmin()
    .from('products')
    .select('id, name, price, stock, has_variants, image_url, images, sort_order, product_variants(id, name, price, stock, is_active, sort_order)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const products = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    image: (p.images as string[] | null)?.[0] || p.image_url || null,
    variants: p.has_variants
      ? (p.product_variants ?? [])
          .filter((v) => v.is_active !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((v) => ({ id: v.id, name: v.name, price: v.price, stock: v.stock }))
      : [],
  }))
  return NextResponse.json({ products })
}
