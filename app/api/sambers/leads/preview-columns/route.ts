/**
 * POST /api/sambers/leads/preview-columns
 *
 * Receives a multipart XLSX file, parses headers + sample rows,
 * and returns column metadata for the mapping UI.
 *
 * NOTE: Full implementation by BENJI (backend).
 * This stub accepts the file and returns an error directing to BENJI's impl.
 * Once BENJI's implementation is in place, replace this file.
 *
 * Expected response shape:
 * {
 *   columns: Array<{
 *     name: string        // column header from XLSX row 1
 *     samples: string[]  // up to 3 sample values from data rows
 *   }>
 * }
 *
 * Error response:
 * { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate multipart/form-data
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Harus mengirim file dengan multipart/form-data' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Gagal membaca form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'File tidak ditemukan dalam request' }, { status: 400 })
  }

  // Type check
  if (!file.name.endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Hanya file .xlsx yang diizinkan' }, { status: 400 })
  }

  // Size check (5 MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5 MB' }, { status: 400 })
  }

  // TODO (BENJI): Parse XLSX using xlsx / exceljs library and return real columns
  // Implementation placeholder — replace with actual XLSX parsing
  return NextResponse.json(
    {
      error: 'Backend belum siap. BENJI perlu mengimplementasi parsing XLSX di endpoint ini.',
      hint: 'Install xlsx package: npm install xlsx, lalu gunakan XLSX.read(buffer) untuk parse file',
    },
    { status: 501 }
  )
}
