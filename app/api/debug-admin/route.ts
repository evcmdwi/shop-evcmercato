import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set(name, '', options)
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userEmail = user?.email ?? null
  const adminEmail = process.env.ADMIN_EMAIL ?? null
  const adminEmailsArray = adminEmail
    ? adminEmail.split(',').map((e) => e.trim().toLowerCase())
    : []
  const hasUser = !!user
  const isAdmin = hasUser && userEmail
    ? adminEmailsArray.includes(userEmail.toLowerCase())
    : false
  const envKeys = Object.keys(process.env).filter((k) => k.includes('ADMIN'))

  return NextResponse.json({
    userEmail,
    adminEmail,
    adminEmailsArray,
    isAdmin,
    hasUser,
    envKeys,
  })
}
