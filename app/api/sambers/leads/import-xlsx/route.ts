import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const VALID_FIELDS = new Set(['name', 'phone', 'city', 'ignore'])

function normalizePhone(raw: string): string {
  let phone = String(raw).replace(/[\s\-().]/g, '')
  if (phone.startsWith('+62')) phone = '0' + phone.slice(3)
  else if (phone.startsWith('62') && phone.length > 10) phone = '0' + phone.slice(2)
  return phone
}

interface SkippedLead {
  name: string
  phone: string
  reason: string
}

export async function POST(req: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 403 ? 'Forbidden' : 'Unauthorized' },
      { status: auth.status ?? 401 }
    )
  }

  // Read session key from cookie
  const sessionKey = req.cookies.get('xlsx_session')?.value
  if (!sessionKey) {
    return NextResponse.json(
      { error: 'Sesi upload tidak ditemukan. Silakan upload file lagi.' },
      { status: 400 }
    )
  }

  // Read session from Supabase temp table (cross-Lambda safe)
  const admin = getSupabaseAdmin()

  const { data: session, error: sessionError } = await admin
    .from('xlsx_sessions')
    .select('rows, expires_at')
    .eq('id', sessionKey)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Sesi upload tidak ditemukan atau sudah expired. Silakan upload file lagi.' },
      { status: 400 }
    )
  }

  // Parse request body
  let body: { mapping?: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Request body tidak valid (JSON required)' }, { status: 400 })
  }

  const { mapping } = body
  if (!mapping || typeof mapping !== 'object') {
    return NextResponse.json({ error: 'Mapping kolom tidak ditemukan' }, { status: 400 })
  }

  // Validate mapping values
  for (const [col, field] of Object.entries(mapping)) {
    if (!VALID_FIELDS.has(field)) {
      return NextResponse.json(
        { error: `Nilai mapping tidak valid untuk kolom "${col}": "${field}"` },
        { status: 400 }
      )
    }
  }

  if (!Object.values(mapping).includes('phone')) {
    return NextResponse.json(
      { error: 'Kolom No HP/WA wajib di-mapping sebelum import' },
      { status: 400 }
    )
  }

  // Process rows
  const rows = session.rows as string[][]
  const headerRow = (rows[0] as unknown[]).map((h, i) => String(h ?? `Kolom ${i + 1}`).trim())
  const dataRows = rows.slice(1)  // skip header

  // Resolve mapping keys: frontend sends column name as key (e.g. "Nama", "No HP")
  // but earlier versions sent numeric index strings. Support both for backward compat.
  const resolvedMapping: Record<number, string> = {}
  for (const [key, fieldName] of Object.entries(mapping)) {
    const colIdx = parseInt(key, 10)
    if (!isNaN(colIdx)) {
      resolvedMapping[colIdx] = fieldName
    } else {
      // Resolve by column name from header row
      const idx = headerRow.findIndex(h => h === key)
      if (idx !== -1) resolvedMapping[idx] = fieldName
      // If not found, skip (unmapped/unknown column)
    }
  }

  const toProcess: { name: string; phone: string; city?: string }[] = []
  const parseErrors: string[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const record: Record<string, string> = {}

    for (const [colIdxNum, fieldName] of Object.entries(resolvedMapping)) {
      const colIdx = Number(colIdxNum)
      record[fieldName] = String((row as unknown[])[colIdx] ?? '').trim()
    }

    const rawPhone = record['phone'] ?? ''
    const rawName = record['name'] ?? ''

    // Skip only if BOTH name AND phone are empty (truly blank row)
    if (!rawPhone && !rawName) {
      parseErrors.push(`Baris ${i + 2}: nama dan no HP kosong — dilewati`)
      continue
    }

    let phone = ''
    if (rawPhone) {
      phone = normalizePhone(rawPhone)
      if (phone.length > 0 && phone.length < 8) {
        // Phone present but too short — log warning but still import with raw value
        parseErrors.push(`Baris ${i + 2}: no HP "${rawPhone}" terlihat tidak valid (${phone.length} digit) — tetap diimport`)
        phone = rawPhone // keep raw so row isn't lost
      }
    } else {
      parseErrors.push(`Baris ${i + 2}: no HP kosong (nama: "${rawName}") — diimport tanpa nomor`)
    }

    toProcess.push({
      name: rawName,
      phone,
      city: record['city'] || undefined,
    })
  }

  if (toProcess.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: 0,
      skippedLeads: [],
      errors: parseErrors,
    })
  }

  // Dedup in-batch (keep first occurrence); rows with empty phone are never deduped
  const seenPhones = new Set<string>()
  const uniqueRows: typeof toProcess = []
  for (const row of toProcess) {
    if (!row.phone || !seenPhones.has(row.phone)) {
      if (row.phone) seenPhones.add(row.phone)
      uniqueRows.push(row)
    }
  }

  // Check existing phones in DB (only for rows that have a phone)
  const phonesToCheck = uniqueRows.map(r => r.phone).filter(Boolean)
  const existingPhones = new Set<string>()
  if (phonesToCheck.length > 0) {
    const { data: existingRows, error: fetchError } = await admin
      .from('leads')
      .select('phone')
      .in('phone', phonesToCheck)

    if (fetchError) {
      console.error('[sambers/leads/import-xlsx] DB fetch error:', fetchError)
      return NextResponse.json({ error: 'Gagal cek data existing: ' + fetchError.message }, { status: 500 })
    }
    ;(existingRows ?? []).forEach((r: { phone: string }) => existingPhones.add(r.phone))
  }

  const toInsert = uniqueRows.filter(r => !r.phone || !existingPhones.has(r.phone))
  const skippedLeads: SkippedLead[] = uniqueRows
    .filter(r => r.phone && existingPhones.has(r.phone))
    .map(r => ({ name: r.name, phone: r.phone, reason: 'phone already exists' }))

  let imported = 0

  if (toInsert.length > 0) {
    const records = toInsert.map(r => ({
      nama: r.name,
      phone: r.phone,
      kota: r.city ?? null,
      source: 'import',
    }))

    const { error: insertError } = await admin.from('leads').insert(records)

    if (insertError) {
      if (insertError.code === '23505') {
        // Race condition — fall back to row-by-row
        for (const record of records) {
          const { error: singleErr } = await admin.from('leads').insert(record)
          if (singleErr?.code === '23505') {
            skippedLeads.push({ name: record.nama, phone: record.phone, reason: 'phone already exists (race)' })
          } else if (singleErr) {
            parseErrors.push(`Insert error for ${record.phone}: ${singleErr.message}`)
          } else {
            imported++
          }
        }
      } else {
        console.error('[sambers/leads/import-xlsx] Insert error:', insertError)
        return NextResponse.json({ error: 'Import gagal: ' + insertError.message }, { status: 500 })
      }
    } else {
      imported = toInsert.length
    }
  }

  // Clear session after successful import
  await admin.from('xlsx_sessions').delete().eq('id', sessionKey)

  const response = NextResponse.json({
    imported,
    skipped: skippedLeads.length,
    skippedLeads,
    errors: parseErrors,
  })

  // Clear cookie
  response.cookies.set('xlsx_session', '', { maxAge: 0, path: '/' })

  return response
}
