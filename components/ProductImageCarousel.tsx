'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'

interface ProductImageCarouselProps {
  images: string[]
  productName: string
}

export default function ProductImageCarousel({ images, productName }: ProductImageCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const validImages = (images ?? []).filter(Boolean)

  if (validImages.length === 0) {
    return (
      <div
        className="relative aspect-square rounded-xl overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: '#EEEDFE' }}
      >
        <Package className="w-20 h-20 opacity-30" style={{ color: '#534AB7' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
        <Image
          src={validImages[selectedIndex]}
          alt={`${productName} - gambar ${selectedIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIndex === 0}
        />
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {validImages.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                idx === selectedIndex
                  ? 'border-[#534AB7]'
                  : 'border-transparent hover:border-[#534AB7]/40'
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
