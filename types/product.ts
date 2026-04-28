export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string | null
  image_url: string | null
  stock: number
  is_active: boolean
  created_at: string
  categories?: Category | null
}

export interface ProductWithCategory extends Product {
  categories: Category | null
}
