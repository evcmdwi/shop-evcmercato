import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  const { id } = await params
  const admin = getSupabaseAdmin()

  const { data: lp, error: fetchErr } = await admin
    .from('landing_pages')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !lp) {
    return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
  }

  if (lp.status === 'archived') {
    return NextResponse.json({ error: 'Landing page is already archived' }, { status: 422 })
  }

  const { data, error } = await admin
    .from('landing_pages')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
