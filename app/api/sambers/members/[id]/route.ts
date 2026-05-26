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

  // Check if member has orders — cannot hard-delete if orders exist
  const { count: orderCount } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', id)

  if (orderCount && orderCount > 0) {
    // Soft-delete: anonymize the account instead of hard-delete
    // This preserves order history integrity
    const { error: anonError } = await admin
      .from('users')
      .update({
        name: '[Akun Dihapus]',
        phone: null,
      })
      .eq('id', id)

    if (anonError) {
      return NextResponse.json({ error: anonError.message }, { status: 500 })
    }

    // Disable auth login — user can no longer login
    const { error: disableError } = await admin.auth.admin.updateUserById(id, {
      ban_duration: '87600h', // 10 years = effectively permanent ban
    })
    if (disableError) {
      console.warn('[DELETE member] could not disable auth user', disableError.message)
    }

    return NextResponse.json({
      success: true,
      anonymized: true,
      message: `Member memiliki ${orderCount} pesanan — akun dianonimkan dan dinonaktifkan (data pesanan tetap terjaga).`,
    })
  }

  // No orders — safe to hard-delete
  const { error: authError } = await admin.auth.admin.deleteUser(id)
  if (authError) {
    console.error('[DELETE /api/sambers/members/[id]] auth delete error', authError)
    const { error: dbError } = await admin.from('users').delete().eq('id', id)
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, anonymized: false })
}
