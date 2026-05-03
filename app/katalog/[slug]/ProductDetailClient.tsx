'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Tag, Gift, Minus, Plus } from 'lucide-react'
import ProductImageCarousel from '@/components/ProductImageCarousel'
import VariantSelector, { ProductVariant } from '@/components/VariantSelector'
import { useCart } from '@/hooks/useCart'
import { useCartContext } from '@/components/CartContext'
import { toast } from '@/components/Toast'
import { formatRupiah, formatPriceRange, getTotalStock, formatSoldCount } from '@/lib/utils'
import type { ProductWithCategory } from '@/types/product'

interface Props {
  product: ProductWithCategory
}

export default function ProductDetailClient({ product }: Props) {
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [variantImage, setVariantImage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  // Auto-select first variant on load
  useEffect(() => {
    if (product.has_variants && variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { addItem } = useCart()
  const { refreshCart } = useCartContext()

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image_url
    ? [product.image_url]
    : []

  const variants: ProductVariant[] = (product.product_variants ?? []).filter((v) => v.is_active)

  const displayPrice = product.has_variants && variants.length
    ? (selectedVariant ? formatRupiah(selectedVariant.price) : formatPriceRange(variants))
    : formatRupiah(product.price)

  const totalStock = product.has_variants && variants.length
    ? getTotalStock(variants)
    : product.stock

  const displayStock = selectedVariant ? selectedVariant.stock : totalStock
  const maxStock = selectedVariant?.stock ?? product.stock

  const isOutOfStock = product.has_variants
    ? (selectedVariant ? selectedVariant.stock === 0 : false)
    : product.stock === 0

  const addToCartDisabled = (product.has_variants && !selectedVariant) || isOutOfStock
  const soldCount = product.total_sold ?? product.initial_sold_count ?? 0

  const handleAddToCart = async () => {
    // Check auth — attempt to fetch cart; 401 means not logged in
    const authCheck = await fetch('/api/cart')
    if (authCheck.status === 401) {
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setAddingToCart(true)
    try {
      await addItem(product.id, selectedVariant?.id ?? null, quantity)
      await refreshCart()
      toast.show({
        type: 'success',
        message: 'Ditambahkan ke keranjang ✓',
        action: { label: 'Lihat Keranjang →', href: '/keranjang' },
        duration: 4000,
      })
    } catch (err: unknown) {
      toast.show({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang',
      })
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    const authCheck = await fetch('/api/cart')
    if (authCheck.status === 401) {
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setAddingToCart(true)
    try {
      await addItem(product.id, selectedVariant?.id ?? null, quantity)
      await refreshCart()
      router.push('/keranjang')
    } catch (err: unknown) {
      toast.show({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang',
      })
      setAddingToCart(false)
    }
  }

  const showQuantityStepper = !product.has_variants || selectedVariant !== null

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/katalog" className="flex items-center gap-1 hover:text-[#7FB300] transition-colors">
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
              <Tag className="w-4 h-4" style={{ color: '#7FB300' }} />
              <span className="text-sm font-medium" style={{ color: '#7FB300' }}>
                {product.categories.name}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {soldCount > 0 && (
            <span className="text-sm text-gray-500">{formatSoldCount(soldCount)}</span>
          )}

          {/* Price */}
          <p className="text-3xl font-bold" style={{ color: '#7FB300' }}>
            {displayPrice}
          </p>

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
                onSelect={(v) => {
                  setSelectedVariant(v)
                  setQuantity(1)
                }}
                onImageChange={setVariantImage}
              />
            </div>
          )}

          {/* Stock */}
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

          {/* Quantity stepper */}
          {showQuantityStepper && !isOutOfStock && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Kurangi"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 text-center font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={quantity >= maxStock}
                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Tambah"
              >
                <Plus className="w-3 h-3" />
              </button>

            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-2">
            {product.has_variants && !selectedVariant ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#7FB300]/40 text-white cursor-not-allowed"
              >
                Pilih varian terlebih dahulu
              </button>
            ) : isOutOfStock ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
              >
                Stok Habis
              </button>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || addToCartDisabled}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#7FB300' }}
                >
                  {addingToCart ? 'Menambahkan...' : '🛒 Tambah ke Keranjang'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={addingToCart || addToCartDisabled}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all hover:bg-[#E8F4D1] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: '#7FB300', color: '#7FB300' }}
                >
                  Beli Sekarang
                </button>
              </>
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
          <div className="mt-2 p-3 rounded-xl text-sm" style={{ backgroundColor: '#E8F4D1', color: '#7FB300' }}>
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
