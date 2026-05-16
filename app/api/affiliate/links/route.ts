import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify affiliate is approved
  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (affiliateError || !affiliate) {
    return NextResponse.json({ error: 'Affiliate tidak ditemukan' }, { status: 404 })
  }

  if (affiliate.status !== 'approved') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  const { data: links, error: linksError } = await supabase
    .from('short_links')
    .select('id, short_code, link_type, target_url, click_count, status, created_at')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (linksError) {
    console.error('[affiliate/links] query error:', linksError)
    return NextResponse.json({ error: 'Gagal mengambil daftar link' }, { status: 500 })
  }

  const result = (links ?? []).map((link) => ({
    ...link,
    short_url: `https://evcmercato.com/s/${link.short_code}`,
  }))

  return NextResponse.json({ links: result })
}
