import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { validateBannerInput } from '../validate'

/** PATCH — `{ is_active }` saja (toggle dari daftar) atau seluruh isi form. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })
  const { id } = await params
  const body = await req.json().catch(() => null)

  let update: Record<string, unknown>
  if (body && typeof body === 'object' && Object.keys(body).length === 1 && typeof body.is_active === 'boolean') {
    update = { is_active: body.is_active }
  } else {
    const parsed = validateBannerInput(body)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    update = { ...parsed.data }
  }

  const { data, error } = await getSupabaseAdmin()
    .from('hero_banners')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('hero-banners', { expire: 0 })
  return NextResponse.json({ banner: data })
}

/** DELETE — hapus baris banner. File gambar di storage sengaja dibiarkan. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })
  const { id } = await params
  const { error } = await getSupabaseAdmin().from('hero_banners').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('hero-banners', { expire: 0 })
  return NextResponse.json({ ok: true })
}
