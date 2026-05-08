import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Must be logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20)

  // Admin client untuk bypass RLS — products adalah katalog publik
  const admin = getSupabaseAdmin()
  let query = admin
    .from('products')
    .select('id, name, category_id')
    .eq('is_active', true)
    .limit(limit)

  if (q) query = query.ilike('name', `%${q}%`)

  const { data: products, error } = await query.order('name')

  if (error) {
    console.error('[affiliate/products]', error)
    return NextResponse.json({ error: 'Gagal cari produk' }, { status: 500 })
  }

  return NextResponse.json({ products: products ?? [] })
}
