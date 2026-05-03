'use client'

import { formatRupiah } from '@/lib/utils'

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
  onImageChange?: (imageUrl: string | null) => void
}

export default function VariantSelector({ variants, selectedVariant, onSelect, onImageChange }: VariantSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id
          const isOutOfStock = variant.stock === 0
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => {
                if (!isOutOfStock) {
                  onSelect(variant)
                  if (onImageChange) onImageChange(variant.image_url ?? null)
                }
              }}
              disabled={isOutOfStock}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                isSelected
                  ? 'border-[#534AB7] bg-[#EEEDFE] text-[#534AB7]'
                  : isOutOfStock
                  ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed line-through'
                  : 'border-slate-200 text-slate-700 hover:border-[#534AB7]/50 hover:bg-[#EEEDFE]/50'
              }`}
            >
              {variant.name}
              {isOutOfStock && <span className="ml-1 text-xs">(habis)</span>}
            </button>
          )
        })}
      </div>

      {/* Stock shown in ProductDetailClient — removed from here to avoid duplicate */}

      {!selectedVariant && (
        <p className="text-sm text-slate-400 italic">Pilih varian untuk melihat harga</p>
      )}

      {selectedVariant && (
        <p className="text-3xl font-bold" style={{ color: '#534AB7' }}>
          {/* price shown above in ProductDetailClient */}
        </p>
      )}
    </div>
  )
}
