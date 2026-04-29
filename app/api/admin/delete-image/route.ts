import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { deleteProductImage } from '@/lib/storage'

// DELETE: hapus satu gambar dari bucket
// Body: { url: string }
// Auth: admin only
export async function DELETE(req: NextRequest) {
  try {
    // 1. Auth check
    const { ok, status } = await checkAdminAuth()
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status })

    // 2. Parse body
    const body = await req.json()
    const { url } = body as { url?: string }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL gambar diperlukan' }, { status: 400 })
    }

    // 3. Validate that URL belongs to our Supabase bucket
    if (!url.includes('supabase.co') || !url.includes('product-images')) {
      return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 })
    }

    // 4. Delete image
    await deleteProductImage(url)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete image route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
