import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Delete from auth.users — cascade will remove from users table if FK is set
  const { error: authError } = await admin.auth.admin.deleteUser(id)

  if (authError) {
    console.error('[DELETE /api/sambers/members/[id]] auth delete error', authError)
    // Fallback: try deleting from users table directly
    const { error: dbError } = await admin.from('users').delete().eq('id', id)
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
