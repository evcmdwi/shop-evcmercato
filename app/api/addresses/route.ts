import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message, message: 'Failed to fetch addresses' }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, message: 'Addresses fetched successfully' })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ data: null, error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json()
  const { recipient_name, phone, province, city, district, postal_code, full_address, is_default, district_id, regency_id, province_id } = body

  if (!recipient_name || !phone || !province || !city || !full_address) {
    return NextResponse.json(
      { data: null, error: 'Missing required fields', message: 'recipient_name, phone, province, city, full_address are required' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdmin()

  // Lookup district name if district_id provided but district name not
  let resolvedDistrict = district ?? null
  if (!resolvedDistrict && district_id) {
    const { data: districtData } = await admin
      .from('districts')
      .select('name')
      .eq('id', district_id)
      .single()
    resolvedDistrict = districtData?.name ?? null
  }

  // Check max 4 addresses
  const { count } = await admin
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 4) {
    return NextResponse.json(
      { data: null, error: 'Maximum 4 addresses allowed', message: 'Please delete an existing address before adding a new one' },
      { status: 400 }
    )
  }

  // If first address, set as default
  const isFirst = (count ?? 0) === 0
  const setDefault = isFirst || is_default === true

  // If setting as default and not first, unset others first
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
      district: resolvedDistrict,
      postal_code: postal_code ?? null,
      full_address,
      is_default: setDefault,
      district_id: district_id ?? null,
      regency_id: regency_id ?? null,
      province_id: province_id ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ data: null, error: error.message, message: 'Failed to create address' }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, message: 'Address created successfully' }, { status: 201 })
}
