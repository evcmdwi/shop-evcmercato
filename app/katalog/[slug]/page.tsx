import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import ProductDetailClient from './ProductDetailClient'
import ProductReviews from '@/components/ProductReviews'
import { slugify } from '@/lib/utils'
import type { ProductWithCategory } from '@/types/product'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamicParams = true

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const supabase = createClient(url, key)
  const { data: products } = await supabase
    .from('products')
    .select('name')
    .eq('is_active', true)

  return (products ?? []).map((p: { name: string }) => ({
    slug: slugify(p.name),
  }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: products } = await supabase
    .from('products')
    .select('name, description')
    .eq('is_active', true)

  const product = (products ?? []).find(
    (p: { name: string }) => slugify(p.name) === slug
  )
  if (!product) return { title: 'Produk tidak ditemukan' }

  return {
    title: `${product.name} — EVC Mercato`,
    description: product.description ?? `Beli ${product.name} di EVC Mercato.`,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      categories(*),
      product_variants (*),
      product_certifications (authority, cert_name, cert_code, expired_date)
    `)
    .eq('is_active', true)

  const product = (products ?? []).find(
    (p: ProductWithCategory) => slugify(p.name) === slug
  ) as ProductWithCategory | undefined

  if (!product) notFound()

  // Sort variants by sort_order, filter active only
  if (product.product_variants) {
    product.product_variants = product.product_variants
      .filter((v) => v.is_active)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }

  // --- JSON-LD structured data for Google Merchant Center ---
  function getBrandFromCategory(categoryName: string): string {
    const brands: Record<string, string> = {
      natesh: 'Natesh',
      fitsol: 'FITSOL',
      suplemen: 'Suplemen KKI',
      kecantikan: 'EVC Mercato',
      others: 'KKI Group',
    }
    return brands[categoryName?.toLowerCase()] ?? 'EVC Mercato'
  }

  const baseUrl = 'https://shop.evcmercato.com'
  const productUrl = `${baseUrl}/katalog/${slugify(product.name)}`
  const productImages = Array.isArray(product.images)
    ? (product.images as string[])
        .filter(Boolean)
        .map((img) => (img.startsWith('http') ? img : `${baseUrl}${img}`))
    : product.image_url
    ? [product.image_url]
    : []

  // Compute effective price: use min variant price if product has variants
  const effectivePrice = product.has_variants
    ? Math.min(...(product.product_variants?.map((v: any) => v.price) ?? [0]))
    : (product.price ?? 0)

  // Compute availability accounting for variants
  const isInStock =
    (product.stock ?? 0) > 0 ||
    (product.has_variants &&
      (product.product_variants?.some((v: any) => (v.stock ?? 0) > 0) ?? false))

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: productImages,
    sku: product.sku || `EVC-${product.id.slice(0, 8).toUpperCase()}`,
    ...((product as any).gtin ? { gtin: (product as any).gtin } : {}),
    brand: {
      '@type': 'Brand',
      name: getBrandFromCategory(product.categories?.name ?? ''),
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
      availability: isInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      price: effectivePrice,
      priceCurrency: 'IDR',
      seller: {
        '@type': 'Organization',
        name: 'EVC Mercato',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 10000,
          currency: 'IDR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'ID',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
  }
  // --- end JSON-LD ---

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        <ProductDetailClient product={product} />
        {/* Sertifikasi Produk — BPOM, Halal, dll */}
        {Array.isArray((product as any).product_certifications) && (product as any).product_certifications.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Sertifikasi Produk</h3>
              <div className="space-y-2">
                {(product as any).product_certifications.map((cert: { authority: string; cert_name: string; cert_code: string; expired_date: string | null }, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="inline-block bg-[#f8fce8] text-[#5a7a3a] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#7FB300]/20 min-w-max">
                      {cert.authority}
                    </span>
                    <span className="text-gray-600">{cert.cert_name}</span>
                    <span className="text-gray-400 font-mono text-xs">{cert.cert_code}</span>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <ProductReviews productId={product.id} productName={product.name} />
      </div>
    </>
  )
}
