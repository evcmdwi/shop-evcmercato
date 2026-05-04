import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import SearchBar from '@/components/SearchBar'
import CategoryFilter from '@/components/CategoryFilter'
import ProductGrid, { ProductGridSkeleton } from '@/components/ProductGrid'
import type { Category, ProductWithCategory } from '@/types/product'
import { slugify } from '@/lib/utils'

interface KatalogPageProps {
  searchParams: Promise<{ q?: string; category?: string }>
}

export const metadata = {
  title: 'Katalog Produk — EVC Mercato',
  description: 'Temukan produk KKI pilihan terbaik di EVC Mercato.',
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const { q, category } = await searchParams
  const supabase = await createClient()

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Build products query
  let query = supabase
    .from('products')
    .select('*, categories(*), product_variants(price, stock, is_active)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  if (category) {
    // Find category id from slug
    const cat = (categories ?? []).find((c: Category) => c.slug === category)
    if (cat) {
      query = query.eq('category_id', cat.id)
    }
  }

  const { data: products } = await query

  // Flatten total_sold from joined view
  const flatProducts = (products ?? []).map((p: Record<string, unknown>) => {
    const sold = p.product_sold_counts as { total_sold: number } | null
    const { product_sold_counts, ...rest } = p
    void product_sold_counts
    return { ...rest, total_sold: sold?.total_sold ?? rest.initial_sold_count ?? 0 }
  })

  const typedProducts = flatProducts as ProductWithCategory[]
  const typedCategories = (categories ?? []) as Category[]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Katalog Produk</h1>
          <p className="text-sm text-gray-500 mt-1">
            {typedProducts.length} produk ditemukan
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col gap-4 mb-8">
          <Suspense>
            <SearchBar />
          </Suspense>
          <Suspense>
            <CategoryFilter categories={typedCategories} />
          </Suspense>
        </div>

        {/* Products */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={typedProducts} />
        </Suspense>
      </main>
    </div>
  )
}
