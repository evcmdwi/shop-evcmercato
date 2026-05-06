import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import ProductDetailClient from './ProductDetailClient'
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
      product_variants (*)
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

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: productImages,
    sku: product.sku || `EVC-${product.id.slice(0, 8).toUpperCase()}`,
    brand: {
      '@type': 'Brand',
      name: getBrandFromCategory(product.categories?.name ?? ''),
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      price: product.price,
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
      </div>
    </>
  )
}
