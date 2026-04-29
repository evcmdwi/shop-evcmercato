import { getSupabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'product-images'

export async function uploadProductImage(
  file: File | Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const supabase = getSupabaseAdmin()

  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${filename.split('.').pop()}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType,
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteProductImage(url: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Extract path dari URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/product-images/products/filename.jpg
  const urlObj = new URL(url)
  const pathParts = urlObj.pathname.split('/product-images/')
  if (pathParts.length < 2) return

  const filePath = pathParts[1]

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath])

  if (error) console.error('Delete image error:', error)
}
