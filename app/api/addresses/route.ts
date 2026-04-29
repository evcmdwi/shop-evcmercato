import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { recipient_name, phone, province, city, district, postal_code, full_address, is_default } = body

  if (!recipient_name || !phone || !province || !city || !full_address) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Check max 4 addresses
  const { count } = await admin
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 4) {
    return NextResponse.json({ error: 'Maximum 4 addresses allowed' }, { status: 400 })
  }

  // If first address, set as default
  const isFirst = (count ?? 0) === 0
  const setDefault = isFirst || is_default === true

  // If setting as default, unset others first
  if (setDefault && !isFirst) {
    await admin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { data, error } = await admin
    .from('addresses')
    .insert({
      user_id: user.id,
      recipient_name,
      phone,
      province,
      city,
      district: district ?? null,
      postal_code: postal_code ?? null,
      full_address,
      is_default: setDefault,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
