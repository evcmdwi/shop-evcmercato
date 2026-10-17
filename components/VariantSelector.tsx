'use client'

import { useState } from 'react'
import Image from 'next/image'

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
  image_url?: string | null
}

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
}

/** Pilihan varian ala marketplace: tombol dengan foto kecil varian (bila ada). */
export default function VariantSelector({ variants, selectedVariant, onSelect }: VariantSelectorProps) {
  const [broken, setBroken] = useState<Set<string>>(new Set())
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id
          const isOutOfStock = variant.stock === 0
          const thumb = variant.image_url && !broken.has(variant.image_url) ? variant.image_url : null
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => {
                if (!isOutOfStock) onSelect(variant)
              }}
              disabled={isOutOfStock}
              aria-pressed={isSelected}
              className={`flex min-h-[44px] items-center gap-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                thumb ? 'py-1 pl-1 pr-3' : 'px-4 py-2'
              } ${
                isSelected
                  ? 'border-[#7FB300] bg-[#E8F4D1] text-[#7FB300]'
                  : isOutOfStock
                  ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed line-through'
                  : 'border-slate-200 text-slate-700 hover:border-[#7FB300]/50 hover:bg-[#E8F4D1]/50'
              }`}
            >
              {thumb && (
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                    onError={() => setBroken((b) => new Set(b).add(thumb))}
                  />
                </span>
              )}
              <span>
                {variant.name}
                {isOutOfStock && <span className="ml-1 text-xs">(habis)</span>}
              </span>
            </button>
          )
        })}
      </div>

      {!selectedVariant && (
        <p className="text-sm text-slate-400 italic">Pilih varian untuk melihat harga</p>
      )}
    </div>
  )
}
