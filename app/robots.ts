import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/sambers/', '/api/', '/checkout', '/dashboard', '/orders/', '/profile/', '/keranjang'],
    },
    sitemap: 'https://shop.evcmercato.com/sitemap.xml',
  }
}
