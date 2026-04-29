import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  // Auth check
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json(
      { data: null, error: auth.status === 401 ? 'Unauthorized' : 'Forbidden', message: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  // Query total users via service-role client
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('[GET /api/admin/users]', error)
    return NextResponse.json(
      { data: null, error: error.message, message: 'Internal Server Error' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: { total: count ?? 0 },
    error: null,
    message: 'OK',
  })
}
