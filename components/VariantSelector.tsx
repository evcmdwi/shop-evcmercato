'use client'

import { formatRupiah } from '@/lib/utils'

export interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
}

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
}

export default function VariantSelector({ variants, selectedVariant, onSelect }: VariantSelectorProps) {
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
              onClick={() => !isOutOfStock && onSelect(variant)}
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

      {selectedVariant && (
        <div className="text-sm text-slate-500">
          Stok:{' '}
          {selectedVariant.stock > 5 ? (
            <span className="font-medium text-green-600">{selectedVariant.stock} tersedia</span>
          ) : selectedVariant.stock > 0 ? (
            <span className="font-medium text-orange-500">Tersisa {selectedVariant.stock}</span>
          ) : (
            <span className="font-medium text-red-500">Habis</span>
          )}
        </div>
      )}

      {!selectedVariant && (
        <p className="text-sm text-slate-400 italic">Pilih varian untuk melihat harga</p>
      )}

      {selectedVariant && (
        <p className="text-3xl font-bold" style={{ color: '#534AB7' }}>
          {formatRupiah(selectedVariant.price)}
        </p>
      )}
    </div>
  )
}
