'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Tag, Gift } from 'lucide-react'
import ProductImageCarousel from '@/components/ProductImageCarousel'
import VariantSelector, { ProductVariant } from '@/components/VariantSelector'
import AddToCartButton from './AddToCartButton'
import { formatRupiah } from '@/lib/utils'
import type { ProductWithCategory } from '@/types/product'

interface Props {
  product: ProductWithCategory
}

export default function ProductDetailClient({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [variantImage, setVariantImage] = useState<string | null>(null)

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image_url
    ? [product.image_url]
    : []

  const variants: ProductVariant[] = (product.product_variants ?? []).filter((v) => v.is_active)

  const displayStock = selectedVariant ? selectedVariant.stock : product.stock
  const addToCartDisabled = product.has_variants && !selectedVariant

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/katalog" className="flex items-center gap-1 hover:text-[#534AB7] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Katalog
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {/* Image carousel */}
        <ProductImageCarousel images={images} productName={product.name} variantImage={variantImage} />

        {/* Details */}
        <div className="flex flex-col gap-4">
          {/* Category */}
          {product.categories && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4" style={{ color: '#534AB7' }} />
              <span className="text-sm font-medium" style={{ color: '#534AB7' }}>
                {product.categories.name}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* Price — show if no variants */}
          {!product.has_variants && (
            <p className="text-3xl font-bold" style={{ color: '#534AB7' }}>
              {formatRupiah(product.price)}
            </p>
          )}

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Variant selector */}
          {product.has_variants && variants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Pilih Varian:</p>
              <VariantSelector
                variants={variants}
                selectedVariant={selectedVariant}
                onSelect={setSelectedVariant}
                onImageChange={setVariantImage}
              />
            </div>
          )}

          {/* Stock (only if no variants) */}
          {!product.has_variants && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Stok:</span>
              {displayStock > 5 ? (
                <span className="font-medium text-green-600">{displayStock} tersedia</span>
              ) : displayStock > 0 ? (
                <span className="font-medium text-orange-500">Tersisa {displayStock}</span>
              ) : (
                <span className="font-medium text-red-500">Habis</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-2">
            {addToCartDisabled ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#534AB7]/40 text-white cursor-not-allowed"
              >
                Pilih varian terlebih dahulu
              </button>
            ) : (
              <AddToCartButton product={product} />
            )}
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-colors cursor-not-allowed opacity-60"
              style={{ borderColor: '#1D9E75', color: '#1D9E75' }}
            >
              <Gift className="w-4 h-4" />
              Tukar dengan Points
            </button>
          </div>

          {/* EVC Points info */}
          <div className="mt-2 p-3 rounded-xl text-sm" style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
            💎 Kumpulkan{' '}
            <strong>
              {Math.floor((selectedVariant ? selectedVariant.price : product.price) / 1000)} EVC Points
            </strong>{' '}
            dari pembelian ini
          </div>
        </div>
      </div>
    </main>
  )
}
