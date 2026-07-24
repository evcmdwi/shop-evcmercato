import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { sendWhatsApp } from '@/lib/whatsapp'

// POST /api/sambers/broadcast/test-send
// Kirim 1 pesan test ke nomor tertentu dengan nama custom (untuk preview sebelum broadcast)
export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { phone, nama, kota, message } = body as {
    phone: string
    nama: string
    kota?: string
    message: string
  }

  if (!phone?.trim()) return NextResponse.json({ error: 'Nomor WA wajib diisi' }, { status: 400 })
  if (!nama?.trim()) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'Pesan wajib diisi' }, { status: 400 })

  // Render variabel personalisasi
  const rendered = message
    .replace(/\{Nama\}/g, nama.trim())
    .replace(/\{Kota\}/g, kota?.trim() || '')
    .replace(/\{Interest\}/g, '')

  const result = await sendWhatsApp({ to: phone.trim(), message: rendered })

  if (!result.success) {
    return NextResponse.json(
      { error: String(result.error) || 'Gagal kirim pesan test' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, rendered_message: rendered })
}
