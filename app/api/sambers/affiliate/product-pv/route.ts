import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const showMissingPv = searchParams.get('show_missing_pv') === 'true'

  const admin = getSupabaseAdmin()

  let query = admin
    .from('products')
    .select(`
      id,
      name,
      has_variants,
      sort_order,
      product_variants (
        id,
        name,
        price,
        affiliate_pv_value,
        is_default,
        sort_order
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: products, error } = await query

  if (error) {
    console.error('[/api/sambers/affiliate/product-pv] query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = (products ?? []).map(p => {
    const variants = ((p.product_variants as Array<{
      id: string
      name: string | null
      price: number
      affiliate_pv_value: number | null
      is_default: boolean | null
      sort_order: number | null
    }>) ?? [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(v => ({
        variant_id: v.id,
        variant_name: v.name ?? 'Default',
        price: v.price ?? 0,
        affiliate_pv_value: v.affiliate_pv_value ?? 0,
        is_default: v.is_default ?? false,
      }))

    return {
      product_id: p.id,
      product_name: p.name,
      has_variants: p.has_variants ?? false,
      variants,
    }
  })

  const filtered = showMissingPv
    ? mapped.filter(p => p.variants.some(v => v.affiliate_pv_value === 0))
    : mapped

  return NextResponse.json({ products: filtered })
}
