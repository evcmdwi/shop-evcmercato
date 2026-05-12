import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify approved affiliate
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('status')
    .eq('user_id', user.id)
    .single()
  if (affiliate?.status !== 'approved')
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const admin = getSupabaseAdmin()
  const { data: products } = await admin
    .from('products')
    .select(
      'id, name, has_variants, product_variants(id, variant_name, price, affiliate_pv_value, is_default)',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ products: products ?? [] })
}
