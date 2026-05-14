// Admin-only endpoint: bandingkan data products di DB vs apa yang akan dioutput di feed
// Return: list produk dengan potential inconsistency (price 0, no image, no sku, dll)

import { NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_req: Request) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: products } = await admin
    .from('products')
    .select('id, name, sku, price, image_url, images, gtin, is_active, has_variants, product_variants(price, stock)')
    .eq('is_active', true)

  const issues = (products ?? []).map(p => {
    const warnings: string[] = []
    if (!p.sku) warnings.push('Missing SKU')
    if (!p.image_url && (!p.images || (p.images as string[]).length === 0)) warnings.push('No image')
    if (!p.gtin) warnings.push('Missing GTIN')
    const price = p.has_variants
      ? Math.min(...((p.product_variants as { price: number }[])?.map((v) => v.price) ?? [0]))
      : p.price ?? 0
    if (price === 0) warnings.push('Price is 0')
    return { id: p.id, name: p.name, sku: p.sku, warnings }
  }).filter(p => p.warnings.length > 0)

  return NextResponse.json({
    total_products: products?.length ?? 0,
    issues_count: issues.length,
    issues,
  })
}
