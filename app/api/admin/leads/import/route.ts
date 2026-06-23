import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type ColumnMapping = Record<string, 'name' | 'phone' | 'city'>

interface LeadRow {
  name: string
  phone: string
  city?: string
}

interface SkippedEntry {
  name: string
  phone: string
  reason: string
}

interface ErrorEntry {
  row: number
  reason: string
}

/**
 * Normalize phone number to 08xxx format.
 * Strips spaces/dashes, converts +62 → 08 and 62 prefix → 08.
 */
function normalizePhone(raw: string): string {
  let phone = String(raw).replace(/[\s\-().]/g, '')
  if (phone.startsWith('+62')) phone = '0' + phone.slice(3)
  else if (phone.startsWith('62') && phone.length > 10) phone = '0' + phone.slice(2)
  return phone
}

export async function POST(request: NextRequest) {
  // Admin auth check
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mappingRaw = formData.get('column_mapping') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!mappingRaw) {
      return NextResponse.json({ error: 'column_mapping is required' }, { status: 400 })
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: 'File must be .xlsx or .xls' }, { status: 400 })
    }

    // Parse column mapping
    let columnMapping: ColumnMapping
    try {
      columnMapping = JSON.parse(mappingRaw)
    } catch {
      return NextResponse.json({ error: 'Invalid column_mapping JSON' }, { status: 400 })
    }

    // Validate that phone mapping exists
    const hasPhone = Object.values(columnMapping).includes('phone')
    if (!hasPhone) {
      return NextResponse.json(
        { error: 'column_mapping must include a mapping for "phone"' },
        { status: 400 }
      )
    }

    // Parse XLSX
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1')

    // Extract data rows (skip header row at range.s.r)
    const rows: LeadRow[] = []
    const errors: ErrorEntry[] = []

    for (let rowIdx = range.s.r + 1; rowIdx <= range.e.r; rowIdx++) {
      const rowData: Record<string, string> = {}

      for (const [colIdxStr, fieldName] of Object.entries(columnMapping)) {
        const colIdx = parseInt(colIdxStr, 10)
        const cellAddr = XLSX.utils.encode_cell({ r: rowIdx, c: range.s.c + colIdx })
        const cell = worksheet[cellAddr]
        rowData[fieldName] = cell ? String(cell.v).trim() : ''
      }

      const rawPhone = rowData['phone'] ?? ''
      if (!rawPhone) {
        // Skip rows with empty phone
        errors.push({ row: rowIdx + 1, reason: 'Phone is empty — row skipped' })
        continue
      }

      const phone = normalizePhone(rawPhone)
      if (!phone || phone.length < 8) {
        errors.push({ row: rowIdx + 1, reason: `Invalid phone "${rawPhone}" — row skipped` })
        continue
      }

      rows.push({
        name: rowData['name'] ?? '',
        phone,
        city: rowData['city'] || undefined,
      })
    }

    // Dedup in-batch: keep first occurrence per phone
    const seenPhones = new Set<string>()
    const uniqueRows: LeadRow[] = []
    for (const row of rows) {
      if (seenPhones.has(row.phone)) {
        errors.push({
          row: -1,
          reason: `Duplicate in file: phone ${row.phone} appears multiple times — later rows skipped`,
        })
        continue
      }
      seenPhones.add(row.phone)
      uniqueRows.push(row)
    }

    if (uniqueRows.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: 0,
        skipped_details: [],
        errors,
      })
    }

    const admin = getSupabaseAdmin()

    // Fetch existing phones from DB for the candidate set (batch check)
    const candidatePhones = uniqueRows.map((r) => r.phone)
    const { data: existingRows, error: fetchError } = await admin
      .from('leads')
      .select('phone')
      .in('phone', candidatePhones)

    if (fetchError) {
      throw new Error(`DB query failed: ${fetchError.message}`)
    }

    const existingPhones = new Set((existingRows ?? []).map((r: { phone: string }) => r.phone))

    const toInsert: LeadRow[] = []
    const skipped_details: SkippedEntry[] = []

    for (const row of uniqueRows) {
      if (existingPhones.has(row.phone)) {
        skipped_details.push({
          name: row.name,
          phone: row.phone,
          reason: 'phone already exists',
        })
      } else {
        toInsert.push(row)
      }
    }

    // Batch insert
    let imported = 0
    if (toInsert.length > 0) {
      const records = toInsert.map((row) => ({
        nama: row.name,
        phone: row.phone,
        kota: row.city ?? null,
        source: 'import',
      }))

      const { error: insertError } = await admin.from('leads').insert(records)
      if (insertError) {
        // On conflict (race condition), fall back to upsert-skip approach
        if (insertError.code === '23505') {
          // Unique violation — try one by one
          for (const record of records) {
            const { error: singleErr } = await admin.from('leads').insert(record)
            if (singleErr?.code === '23505') {
              skipped_details.push({
                name: record.nama,
                phone: record.phone,
                reason: 'phone already exists (race)',
              })
            } else if (singleErr) {
              errors.push({ row: -1, reason: `Insert error for ${record.phone}: ${singleErr.message}` })
            } else {
              imported++
            }
          }
        } else {
          throw new Error(`Insert failed: ${insertError.message}`)
        }
      } else {
        imported = toInsert.length
      }
    }

    return NextResponse.json({
      imported,
      skipped: skipped_details.length,
      skipped_details,
      errors,
    })
  } catch (err) {
    console.error('[leads/import] Error:', err)
    return NextResponse.json(
      { error: 'Import failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
