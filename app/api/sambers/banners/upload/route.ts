import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { HERO_BANNER_MAX_BYTES } from '@/lib/hero-banners'

const BUCKET = 'banners'
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp' }

/** Upload gambar banner apa adanya (tanpa kompres ulang): JPG/WebP, maks 500 KB. */
export async function POST(req: NextRequest) {
  const { ok, status } = await checkAdminAuth()
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Format harus JPG atau WebP' }, { status: 400 })
  if (file.size > HERO_BANNER_MAX_BYTES) {
    return NextResponse.json({ error: `File ${Math.round(file.size / 1024)} KB — maksimal 500 KB` }, { status: 400 })
  }

  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const admin = getSupabaseAdmin()
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false, cacheControl: '31536000' })
  if (error) return NextResponse.json({ error: 'Upload gagal: ' + error.message }, { status: 500 })
  return NextResponse.json({ url: admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl })
}
