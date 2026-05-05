import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
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
    return NextResponse.json({ data: null, error: 'Address not found', message: 'Address not found or access denied' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (body.recipient_name !== undefined) updates.recipient_name = body.recipient_name
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.province !== undefined) updates.province = body.province
  if (body.city !== undefined) updates.city = body.city
  if (body.district !== undefined) updates.district = body.district
  if (body.postal_code !== undefined) updates.postal_code = body.postal_code
  if (body.full_address !== undefined) updates.full_address = body.full_address
  if (body.district_id !== undefined) updates.district_id = body.district_id || null
  if (body.regency_id !== undefined) updates.regency_id = body.regency_id || null
  if (body.province_id !== undefined) updates.province_id = body.province_id || null
  if (body.district_name !== undefined) updates.district = body.district_name || null

  // Handle set default: unset other addresses first
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

  if (error) {
    return NextResponse.json({ data: null, error: error.message, message: 'Failed to update address' }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, message: 'Address updated successfully' })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
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
    return NextResponse.json({ data: null, error: 'Address not found', message: 'Address not found or access denied' }, { status: 404 })
  }

  const { error } = await admin.from('addresses').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ data: null, error: error.message, message: 'Failed to delete address' }, { status: 500 })
  }

  // If deleted address was default, assign default to next most recent
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

  return NextResponse.json({ data: null, error: null, message: 'Address deleted successfully' })
}
