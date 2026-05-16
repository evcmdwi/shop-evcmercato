import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const admin = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') || 'all'

  // Query landing_pages WITHOUT join (LEFT JOIN not supported in TS types)
  let query = admin
    .from('landing_pages')
    .select(`
      id, slug, title, description, status,
      preview_image_url, target_audience, conversion_benchmark_pct,
      approved_for_affiliate_at, approved_by_admin_id,
      archived_at, created_at
    `)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []

  // Get active short_link counts per LP (separate query to avoid INNER JOIN issue)
  const lpIds = rows.map((lp) => lp.id)
  let shortLinkCounts: Record<string, number> = {}

  if (lpIds.length > 0) {
    const { data: slData } = await admin
      .from('short_links')
      .select('landing_page_id, status')
      .in('landing_page_id', lpIds)
      .eq('link_type', 'landing_page')

    for (const sl of slData ?? []) {
      if (sl.status === 'active' && sl.landing_page_id) {
        shortLinkCounts[sl.landing_page_id] = (shortLinkCounts[sl.landing_page_id] ?? 0) + 1
      }
    }
  }

  const result = rows.map((lp) => ({
    ...lp,
    active_short_link_count: shortLinkCounts[lp.id] ?? 0,
  }))

  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.slug || !body?.title) {
    return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
  }

  const { slug, title, description, status } = body

  const admin = getSupabaseAdmin()

  // Check slug uniqueness
  const { data: existing } = await admin
    .from('landing_pages')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'slug already exists' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('landing_pages')
    .insert({
      slug,
      title,
      description: description ?? null,
      status: status ?? 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
