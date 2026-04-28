import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; message: string }

/**
 * Validates that the incoming request belongs to an authenticated admin user.
 * Reads the Supabase session cookie and checks the `profiles.role` column.
 */
export async function checkAdminAuth(req: NextRequest): Promise<AdminAuthResult> {
  const cookieStore = req.cookies

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // API routes — cannot set cookies on response here
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false, status: 401, message: 'Unauthorized' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false, status: 403, message: 'Forbidden' }
  }

  if (profile.role !== 'admin') {
    return { ok: false, status: 403, message: 'Forbidden: admin only' }
  }

  return { ok: true, userId: user.id }
}
