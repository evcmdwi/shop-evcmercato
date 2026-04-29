export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  price: number
  stock: number
  is_active: boolean
  sort_order: number
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string | null
  image_url: string | null
  images: string[] | null
  has_variants: boolean
  stock: number
  is_active: boolean
  initial_sold_count: number
  total_sold?: number
  created_at: string
  initial_sold_count?: number
  total_sold?: number
  categories?: Category | null
  product_variants?: ProductVariant[]
}

export interface ProductWithCategory extends Product {
  categories: Category | null
}
