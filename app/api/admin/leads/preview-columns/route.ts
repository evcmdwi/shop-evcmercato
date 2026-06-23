import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  // Admin auth check
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'File must be .xlsx or .xls' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Get sheet range
    const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1')

    // Extract header row (row 0)
    const columns: string[] = []
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: range.s.r, c: col })
      const cell = worksheet[cellAddr]
      columns.push(cell ? String(cell.v).trim() : `Column ${col + 1}`)
    }

    // Extract first data row (row 1) as sample
    const sample_row: string[] = []
    const dataRowIdx = range.s.r + 1
    if (dataRowIdx <= range.e.r) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: dataRowIdx, c: col })
        const cell = worksheet[cellAddr]
        sample_row.push(cell ? String(cell.v).trim() : '')
      }
    }

    return NextResponse.json({ columns, sample_row })
  } catch (err) {
    console.error('[leads/preview-columns] Error:', err)
    return NextResponse.json(
      { error: 'Failed to parse file', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
