import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { id } = await params
    const body = await req.json()

    const allowedFields = ['is_active', 'title', 'bonus_points', 'points_multiplier', 'active_until']
    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('point_promos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ promo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { id } = await params

    const { error } = await admin.from('point_promos').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
