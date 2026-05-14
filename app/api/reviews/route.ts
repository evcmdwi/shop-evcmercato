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

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate rating per product
  let aggregateRating = null
  if (productId) {
    const { data: agg } = await admin
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved')
    if (agg && agg.length >= 3) {
      const avg = agg.reduce((sum, r) => sum + r.rating, 0) / agg.length
      aggregateRating = { average: Math.round(avg * 10) / 10, count: agg.length }
    }
  }

  return NextResponse.json({ reviews: data ?? [], aggregateRating })
}
