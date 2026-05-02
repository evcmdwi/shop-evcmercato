import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'product-images'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const { ok, status } = await checkAdminAuth()
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })

    // 2. Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

    // 3. Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar. Maksimal 5 MB' }, { status: 400 })
    }

    // 4. Validate mime type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WebP' }, { status: 400 })
    }

    // 5. Generate path
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // 6. Upload ke Supabase Storage
    const supabase = getSupabaseAdmin()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Upload gagal: ' + error.message }, { status: 500 })
    }

    // 7. Return public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
