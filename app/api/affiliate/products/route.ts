import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Must be logged in (affiliate)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 20)

  let query = supabase
    .from('products')
    .select('id, name, category_id')
    .eq('is_active', true)
    .limit(limit)

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: products, error } = await query.order('name')

  if (error) {
    return NextResponse.json({ error: 'Gagal cari produk' }, { status: 500 })
  }

  return NextResponse.json({ products: products ?? [] })
}
