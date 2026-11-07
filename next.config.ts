import type { NextConfig } from 'next'

// Header keamanan dasar (2026-11-07): cegah situs dibingkai situs lain
// (clickjacking), cegah tebak tipe file, batasi info referrer. Sengaja TANPA CSP
// penuh — skrip pihak ketiga (Xendit, pixel) gampang patah; frame-ancestors saja.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    return [
      // Fix trailing-dash slug bug — redirect old Google-indexed URL ke slug benar
      {
        source: '/katalog/kopi-tongkat-ali-',
        destination: '/katalog/kopi-tongkat-ali',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
