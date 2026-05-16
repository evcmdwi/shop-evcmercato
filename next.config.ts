import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
