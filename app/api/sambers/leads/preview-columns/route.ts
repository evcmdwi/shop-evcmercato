import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { checkAdminAuth } from '@/lib/admin-auth'
import { randomUUID } from 'crypto'

// Shared in-memory session store — use global to survive Next.js hot-reload
// and be accessible from import-xlsx route in the same process.
declare global {
  // eslint-disable-next-line no-var
  var __xlsxSessionStore: Map<string, { rows: string[][]; expiresAt: number }> | undefined
}

if (!global.__xlsxSessionStore) {
  global.__xlsxSessionStore = new Map()
}
const xlsxSessionStore = global.__xlsxSessionStore!

const SESSION_TTL_MS = 30 * 60 * 1000  // 30 minutes

function cleanExpiredSessions() {
  const now = Date.now()
  for (const [key, session] of xlsxSessionStore.entries()) {
    if (session.expiresAt < now) xlsxSessionStore.delete(key)
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 403 ? 'Forbidden' : 'Unauthorized' },
      { status: auth.status ?? 401 }
    )
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

  if (!file.name.endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Hanya file .xlsx yang diizinkan' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5 MB' }, { status: 400 })
  }

  let rows: string[][]
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
  } catch (err) {
    console.error('[sambers/leads/preview-columns] XLSX parse error:', err)
    return NextResponse.json({ error: 'Gagal membaca file Excel' }, { status: 500 })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'File Excel kosong' }, { status: 400 })
  }

  // Store parsed rows in session
  cleanExpiredSessions()
  const sessionKey = randomUUID()
  xlsxSessionStore.set(sessionKey, {
    rows,
    expiresAt: Date.now() + SESSION_TTL_MS,
  })

  // Build columns with samples (up to 3 data rows)
  const headerRow = rows[0]
  const dataRows = rows.slice(1, 4)  // up to 3 sample rows

  const columns = headerRow.map((header, colIdx) => ({
    name: String(header ?? '').trim() || `Kolom ${colIdx + 1}`,
    samples: dataRows
      .map(row => String(row[colIdx] ?? '').trim())
      .filter(Boolean),
  }))

  const response = NextResponse.json({
    columns,
    total_rows: rows.length - 1,
  })

  // Set session key as cookie (httpOnly, 30 min)
  response.cookies.set('xlsx_session', sessionKey, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 60,
    path: '/',
  })

  return response
}
