import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const { id } = await params

    const formData = await req.formData()
    const courierType = formData.get('courier_type') as string
    const barcodeFile = formData.get('barcode') as File | null

    if (!courierType || !['jnt', 'grab'].includes(courierType)) {
      return NextResponse.json({ error: 'courier_type harus jnt atau grab' }, { status: 400 })
    }

    if (courierType === 'jnt' && !barcodeFile) {
      return NextResponse.json({ error: 'Barcode wajib untuk JNT' }, { status: 400 })
    }

    let barcodeUrl: string | null = null

    // Upload barcode ke Supabase Storage (JNT only)
    if (courierType === 'jnt' && barcodeFile) {
      if (!['image/jpeg', 'image/png'].includes(barcodeFile.type)) {
        return NextResponse.json({ error: 'File harus JPEG atau PNG' }, { status: 400 })
      }
      if (barcodeFile.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'File maksimal 2MB' }, { status: 400 })
      }

      const ext = barcodeFile.type === 'image/png' ? 'png' : 'jpg'
      const path = `${id}/${Date.now()}-barcode.${ext}`
      const arrayBuffer = await barcodeFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await admin.storage
        .from('resi-barcodes')
        .upload(path, buffer, { contentType: barcodeFile.type, upsert: true })

      if (uploadError) {
        console.error('[print-resi] upload error:', uploadError)
        return NextResponse.json({ error: 'Gagal upload barcode' }, { status: 500 })
      }

      // Get signed URL (1 jam TTL)
      const { data: signedData } = await admin.storage
        .from('resi-barcodes')
        .createSignedUrl(path, 3600)

      barcodeUrl = signedData?.signedUrl ?? null
    }

    // Update order
    const now = new Date().toISOString()
    const { error: updateError } = await admin
      .from('orders')
      .update({
        courier_type: courierType,
        resi_barcode_url: barcodeUrl,
        resi_generated_at: now,
      })
      .eq('id', id)

    if (updateError) {
      console.error('[print-resi] update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: { resi_url: `/sambers/pesanan/${id}/resi`, resi_generated_at: now }
    })
  } catch (err) {
    console.error('[print-resi] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
