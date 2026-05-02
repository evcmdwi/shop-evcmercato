'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Category } from '@/types/product'

interface CategoryFilterProps {
  categories: Category[]
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get('category') ?? ''

  const setCategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (slug) {
        params.set('category', slug)
      } else {
        params.delete('category')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory('')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          !activeSlug
            ? 'text-white shadow-sm'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        style={!activeSlug ? { backgroundColor: '#534AB7' } : {}}
      >
        Semua
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeSlug === cat.slug
              ? 'text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={activeSlug === cat.slug ? { backgroundColor: '#534AB7' } : {}}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
