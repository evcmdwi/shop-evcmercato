import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, name } = body as { id?: string; email?: string; name?: string }

    if (!id || !email) {
      return NextResponse.json({ error: 'id and email are required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin.from('users').insert({
      id,
      email,
      name: name ?? null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
