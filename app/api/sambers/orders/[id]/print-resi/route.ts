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
    const jntResiNumber = formData.get('jnt_resi_number') as string | null
    const deliveryNote = formData.get('delivery_note') as string | null

    if (!courierType || !['jnt', 'grab'].includes(courierType)) {
      return NextResponse.json({ error: 'courier_type harus jnt atau grab' }, { status: 400 })
    }

    if (courierType === 'jnt' && !jntResiNumber?.trim()) {
      return NextResponse.json({ error: 'Nomor resi JNT wajib diisi' }, { status: 400 })
    }

    // Update order — simpan nomor resi sebagai teks, tidak upload ke storage
    const now = new Date().toISOString()
    const { error: updateError } = await admin
      .from('orders')
      .update({
        courier_type: courierType,
        resi_barcode_url: null,
        resi_number: courierType === 'jnt' ? jntResiNumber!.trim() : null,
        delivery_note: deliveryNote || null,
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
