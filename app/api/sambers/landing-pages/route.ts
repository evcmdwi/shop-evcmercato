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

  let query = admin
    .from('landing_pages')
    .select(`
      id, slug, title, description, status,
      preview_image_url, target_audience, conversion_benchmark_pct,
      approved_for_affiliate_at, approved_by_admin_id,
      archived_at, created_at, updated_at,
      short_links!landing_page_id(id, status)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map to include active_short_link_count
  const rows = (data ?? []).map((lp) => {
    const links = Array.isArray(lp.short_links) ? lp.short_links : []
    const activeCount = links.filter((l: { status: string }) => l.status === 'active').length
    const { short_links: _sl, ...rest } = lp
    return { ...rest, active_short_link_count: activeCount }
  })

  return NextResponse.json({ data: rows })
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
