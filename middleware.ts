import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Domain-based routing: apex domain → landing pages / redirect to shop
  const hostname = request.headers.get('host') ?? ''
  const isApex = hostname === 'evcmercato.com' || hostname === 'www.evcmercato.com'

  if (isApex) {
    if (request.nextUrl.pathname.startsWith('/lp/')) return NextResponse.next()
    return NextResponse.redirect(new URL('https://shop.evcmercato.com' + request.nextUrl.pathname), 301)
  }

  // shop.evcmercato.com/lp/* → 301 redirect ke apex evcmercato.com/lp/*
  const isShop = hostname === 'shop.evcmercato.com'
  if (isShop && request.nextUrl.pathname.startsWith('/lp/')) {
    const redirectUrl = new URL(request.url)
    redirectUrl.host = 'evcmercato.com'
    redirectUrl.protocol = 'https:'
    return NextResponse.redirect(redirectUrl, 301)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes — /admin is intentionally excluded here.
  // Admin auth is handled by app/admin/layout.tsx
  const protectedRoutes = ['/dashboard', '/account', '/profile', '/orders', '/keranjang', '/checkout']
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect_to', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Affiliate ref cookie — set from ?ref=CODE URL param
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode && !request.cookies.get('evc_ref')) {
    supabaseResponse.cookies.set('evc_ref', refCode, {
      maxAge: 2592000, // 30 days
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/'
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/profile/:path*', '/orders/:path*', '/keranjang/:path*', '/checkout/:path*', '/katalog/:path*', '/'],
}
