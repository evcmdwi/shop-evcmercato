import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://shop.evcmercato.com'

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
  { url: `${BASE}/katalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/refund-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/shipping-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/privacy-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/affiliate`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fallback kalau env vars tidak ada (local dev)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return staticPages
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: products } = await admin
    .from('products')
    .select('name, created_at')
    .eq('is_active', true)

  const productPages: MetadataRoute.Sitemap = (products ?? []).map(p => ({
    url: `${BASE}/katalog/${slugify(p.name)}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
