import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  const featuredOnly = searchParams.get('featured') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)

  const admin = getSupabaseAdmin()
  let query = admin
    .from('product_reviews')
    .select('id, customer_name, customer_location, rating, title, body, source, created_at, is_featured, product_id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (productId) query = query.eq('product_id', productId)
  if (featuredOnly) query = query.eq('is_featured', true)

  let data: Record<string, unknown>[] | null = null
  let queryError: { message: string; code?: string } | null = null
  try {
    const result = await query
    data = result.data as Record<string, unknown>[] | null
    queryError = result.error
  } catch (err) {
    // Table may not exist yet — return empty gracefully
    console.error('GET /api/reviews unexpected error:', err)
    return NextResponse.json({ reviews: [], aggregateRating: null })
  }

  if (queryError) {
    // 42P01 = undefined_table; return empty instead of 500 so pages don't break
    if ((queryError as { code?: string }).code === '42P01') {
      return NextResponse.json({ reviews: [], aggregateRating: null })
    }
    return NextResponse.json({ error: queryError.message }, { status: 500 })
  }

  // Aggregate rating per product
  let aggregateRating = null
  if (productId) {
    try {
      const { data: agg } = await admin
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved')
      if (agg && agg.length >= 3) {
        const avg = agg.reduce((sum, r) => sum + r.rating, 0) / agg.length
        aggregateRating = { average: Math.round(avg * 10) / 10, count: agg.length }
      }
    } catch {
      // non-fatal — aggregate is optional
    }
  }

  return NextResponse.json({ reviews: data ?? [], aggregateRating })
}
