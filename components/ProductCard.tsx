'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'
import { useCartContext } from '@/components/CartContext'
import { toast } from '@/components/Toast'
import { redirectToLoginWithItem } from '@/lib/pending-cart'
import { formatRupiah, formatSoldCount, getTotalStock } from '@/lib/utils'
import {
  cardPrice,
  packDetail,
  pointsForAmount,
  productChip,
  productSlug,
  quickAddVariant,
  soldCount,
} from '@/lib/catalog'
import type { ProductWithCategory } from '@/types/product'

interface ProductCardProps {
  product: ProductWithCategory
  /** Pass true for the first ~4 cards (above fold) to eagerly load images */
  priority?: boolean
  /** Ganti chip kiri atas (mis. "Terlaris" di beranda). */
  chip?: string | null
}

export default function ProductCard({ product, priority, chip }: ProductCardProps) {
  const { user } = useAuth()
  const { addItem } = useCartContext()
  const [adding, setAdding] = useState(false)

  const detailUrl = `/katalog/${productSlug(product)}`
  const { price, from } = cardPrice(product)
  const detail = from ? 'Mulai' : packDetail(product)
  const sold = soldCount(product)
  const chipLabel = chip === undefined ? productChip(product) : chip
  const imageSrc = product.images?.[0] || product.image_url || null

  const stock = product.has_variants && product.product_variants?.length
    ? getTotalStock(product.product_variants)
    : product.stock
  const isOutOfStock = stock === 0

  // undefined = produk multi-varian → pilih varian di halaman produk
  const variantId = quickAddVariant(product)

  const handleAdd = async () => {
    if (variantId === undefined) return
    if (!user) {
      redirectToLoginWithItem({ product_id: product.id, variant_id: variantId, quantity: 1 })
      return
    }
    setAdding(true)
    try {
      await addItem(product.id, variantId, 1)
      toast.show({
        type: 'success',
        message: 'Ditambahkan ke keranjang ✓',
        action: { label: 'Lihat Keranjang →', href: '/keranjang' },
        duration: 4000,
      })
    } catch (err: unknown) {
      toast.show({ type: 'error', message: err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang' })
    } finally {
      setAdding(false)
    }
  }

  const buttonCls =
    'mt-2 flex w-full min-h-[44px] items-center justify-center rounded-[10px] border border-evc-green text-sm font-semibold text-evc-green transition-colors hover:bg-evc-green-tint disabled:opacity-50'

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-evc-border bg-evc-surface font-jakarta">
      <Link href={detailUrl} prefetch={false} className="relative block aspect-square bg-evc-ground">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
            priority={priority ?? false}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : null}
        {chipLabel && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-evc-ink shadow-sm">
            {chipLabel}
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">Stok Habis</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={detailUrl} prefetch={false} className="line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-tight text-evc-ink">
          {product.name}
        </Link>
        <p className="mt-1 min-h-[1.25em] text-xs text-evc-muted">{detail ?? ''}</p>
        <p className="text-base font-bold text-evc-ink">{formatRupiah(price)}</p>
        <div className="mt-0.5 flex items-center justify-between gap-1 text-xs">
          <span className="font-semibold text-evc-green">+{pointsForAmount(price).toLocaleString('id-ID')} poin</span>
          {sold > 0 && <span className="text-evc-muted">{formatSoldCount(sold)}</span>}
        </div>

        <div className="mt-auto">
          {variantId === undefined ? (
            <Link href={detailUrl} prefetch={false} className={buttonCls}>
              + Keranjang
            </Link>
          ) : (
            <button type="button" onClick={handleAdd} disabled={adding || isOutOfStock} className={buttonCls}>
              {adding ? 'Menambahkan…' : '+ Keranjang'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
