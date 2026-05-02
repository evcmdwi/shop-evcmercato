import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email } = body as { id?: string; email?: string }

    if (!id || !email) {
      return NextResponse.json({ error: 'id and email are required' }, { status: 400 })
    }

    // NOTE: public.users is populated automatically by the Supabase trigger
    // `handle_new_user` on auth.users INSERT, which reads name and phone from
    // raw_user_meta_data. Manual INSERT here caused a primary-key conflict
    // (duplicate key error) because the trigger already ran synchronously.
    // The trigger uses ON CONFLICT (id) DO NOTHING, so no data is lost.
    // This route is kept for backward-compat with the register page flow.

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
