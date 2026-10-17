'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'

interface ProductImageCarouselProps {
  images: string[]
  productName: string
  variantImage?: string | null
}

export default function ProductImageCarousel({ images, productName, variantImage }: ProductImageCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  // Foto varian tampil sampai pembeli mengklik thumbnail; ganti varian → tampil lagi.
  const [showVariant, setShowVariant] = useState(true)
  const [prevVariantImage, setPrevVariantImage] = useState(variantImage)
  // Foto varian yang gagal dimuat (file hilang) → kembali ke foto produk.
  const [brokenVariant, setBrokenVariant] = useState<string | null>(null)
  if (variantImage !== prevVariantImage) {
    setPrevVariantImage(variantImage)
    setShowVariant(true)
  }

  const validImages = (images ?? []).filter(Boolean)
  const variantActive = !!variantImage && showVariant && brokenVariant !== variantImage
  const displayMainImage = variantActive ? variantImage : validImages[selectedIndex]

  if (validImages.length === 0 && !variantImage) {
    return (
      <div
        className="relative aspect-square rounded-xl overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: '#E8F4D1' }}
      >
        <Package className="w-20 h-20 opacity-30" style={{ color: '#7FB300' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
        <Image
          src={displayMainImage!}
          alt={`${productName} - gambar ${selectedIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIndex === 0}
          onError={() => {
            if (variantActive) setBrokenVariant(variantImage ?? null)
          }}
        />
      </div>

      {/* Thumbnails */}
      {(validImages.length > 1 || (variantActive && validImages.length > 0)) && (
        <div className="flex gap-2 flex-wrap">
          {validImages.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedIndex(idx)
                setShowVariant(false)
              }}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                !variantActive && idx === selectedIndex
                  ? 'border-[#7FB300]'
                  : 'border-transparent hover:border-[#7FB300]/40'
              }`}
            >
              <Image
                src={src}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
