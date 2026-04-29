import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const admin = getSupabaseAdmin()

  // Verify ownership
  const { data: existing } = await admin
    .from('addresses')
    .select('id, user_id, is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (body.recipient_name !== undefined) updates.recipient_name = body.recipient_name
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.province !== undefined) updates.province = body.province
  if (body.city !== undefined) updates.city = body.city
  if (body.district !== undefined) updates.district = body.district
  if (body.postal_code !== undefined) updates.postal_code = body.postal_code
  if (body.full_address !== undefined) updates.full_address = body.full_address

  // Handle set default
  if (body.is_default === true && !existing.is_default) {
    await admin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
    updates.is_default = true
  }

  const { data, error } = await admin
    .from('addresses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  // Verify ownership & get current state
  const { data: existing } = await admin
    .from('addresses')
    .select('id, user_id, is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  const { error } = await admin.from('addresses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If deleted address was default, set another as default
  if (existing.is_default) {
    const { data: remaining } = await admin
      .from('addresses')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (remaining && remaining.length > 0) {
      await admin
        .from('addresses')
        .update({ is_default: true })
        .eq('id', remaining[0].id)
    }
  }

  return NextResponse.json({ success: true })
}
