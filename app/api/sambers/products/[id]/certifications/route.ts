// GET: list certifications for a product
// POST: add certification
// DELETE: remove certification (by cert_id query param)

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('product_certifications')
    .select('*')
    .eq('product_id', id)
    .order('created_at')
  return NextResponse.json({ certifications: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('product_certifications')
    .insert({
      product_id: id,
      authority: body.authority,
      cert_name: body.cert_name,
      cert_code: body.cert_code,
      expired_date: body.expired_date || null,
      document_url: body.document_url || null,
      is_verified: body.is_verified || false,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ certification: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // params is required to scope to product, but delete is by cert_id
  await params
  const { searchParams } = new URL(req.url)
  const certId = searchParams.get('cert_id')
  if (!certId) return NextResponse.json({ error: 'cert_id required' }, { status: 400 })
  const admin = getSupabaseAdmin()
  await admin.from('product_certifications').delete().eq('id', certId)
  return NextResponse.json({ success: true })
}
