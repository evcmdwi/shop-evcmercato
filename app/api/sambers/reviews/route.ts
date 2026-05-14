import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'pending', 'approved', 'rejected', or null for all
  const productId = searchParams.get('product_id')

  const admin = getSupabaseAdmin()
  let query = admin
    .from('product_reviews')
    .select('*, products(name, sku)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)
  if (productId) query = query.eq('product_id', productId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('product_reviews')
    .insert({
      product_id: body.product_id,
      customer_name: body.customer_name,
      customer_location: body.customer_location || null,
      rating: body.rating,
      title: body.title || null,
      body: body.body,
      source: body.source || 'curated_with_consent',
      customer_consent_date: body.customer_consent_date || new Date().toISOString(),
      consent_proof: body.consent_proof || null,
      original_marketplace: body.original_marketplace || null,
      is_featured: body.is_featured || false,
      status: body.status || 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ review: data })
}
