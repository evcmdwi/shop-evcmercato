import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// PATCH /api/sambers/extra-point-promos/[id]
// Toggle is_active or update multiplier/period
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const { id } = await params
    const admin = getSupabaseAdmin()
    const body = await req.json()

    const allowedFields: Record<string, unknown> = {}
    if (typeof body.is_active === 'boolean') allowedFields.is_active = body.is_active
    if (body.multiplier !== undefined) {
      if (parseFloat(body.multiplier) <= 1) {
        return NextResponse.json({ error: 'multiplier harus lebih dari 1' }, { status: 400 })
      }
      allowedFields.multiplier = parseFloat(body.multiplier)
    }
    if (body.starts_at) allowedFields.starts_at = body.starts_at
    if (body.ends_at) allowedFields.ends_at = body.ends_at
    if (body.note !== undefined) allowedFields.note = body.note

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
    }

    const { data: promo, error } = await admin
      .from('user_extra_point_promos')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ promo })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/sambers/extra-point-promos/[id]
// Soft delete: set is_active = false
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const { id } = await params
    const admin = getSupabaseAdmin()

    const { data: promo, error } = await admin
      .from('user_extra_point_promos')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Promo tidak ditemukan' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ promo, message: 'Promo dinonaktifkan' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
