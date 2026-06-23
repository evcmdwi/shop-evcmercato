import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Re-use the same session store exported from preview-columns.
// We inline it here to avoid cross-module import issues in Next.js edge/serverless.
// Both files must use the SAME module instance, which is guaranteed in Node.js
// dev/standalone servers (single process). For Vercel serverless both are co-located
// in the same function bundle because they share the same route group.
//
// Workaround if they end up in separate bundles: migrate to Redis/Supabase temp table.
// For now, in-process store is sufficient for the single-VPS deployment.
import type { } from 'next/server'

// ─── Shared in-memory session store ──────────────────────────────────────────
// Declare global to survive Next.js hot-reload in dev
declare global {
  // eslint-disable-next-line no-var
  var __xlsxSessionStore: Map<string, { rows: string[][]; expiresAt: number }> | undefined
}

if (!global.__xlsxSessionStore) {
  global.__xlsxSessionStore = new Map()
}
const xlsxSessionStore = global.__xlsxSessionStore!
// ─────────────────────────────────────────────────────────────────────────────

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

  const session = xlsxSessionStore.get(sessionKey)
  if (!session || session.expiresAt < Date.now()) {
    xlsxSessionStore.delete(sessionKey)
    return NextResponse.json(
      { error: 'Sesi upload telah expired. Silakan upload file lagi.' },
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
  const { rows } = session
  const dataRows = rows.slice(1)  // skip header

  const toProcess: { name: string; phone: string; city?: string }[] = []
  const parseErrors: string[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const record: Record<string, string> = {}

    for (const [colIdxStr, fieldName] of Object.entries(mapping)) {
      const colIdx = parseInt(colIdxStr, 10)
      record[fieldName] = String(row[colIdx] ?? '').trim()
    }

    const rawPhone = record['phone'] ?? ''
    if (!rawPhone) {
      parseErrors.push(`Baris ${i + 2}: no HP kosong — dilewati`)
      continue
    }

    const phone = normalizePhone(rawPhone)
    if (!phone || phone.length < 8) {
      parseErrors.push(`Baris ${i + 2}: no HP tidak valid "${rawPhone}" — dilewati`)
      continue
    }

    toProcess.push({
      name: record['name'] ?? '',
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

  // Dedup in-batch (keep first occurrence)
  const seenPhones = new Set<string>()
  const uniqueRows: typeof toProcess = []
  for (const row of toProcess) {
    if (!seenPhones.has(row.phone)) {
      seenPhones.add(row.phone)
      uniqueRows.push(row)
    }
  }

  const admin = getSupabaseAdmin()

  // Check existing phones in DB
  const { data: existingRows, error: fetchError } = await admin
    .from('leads')
    .select('phone')
    .in('phone', uniqueRows.map(r => r.phone))

  if (fetchError) {
    console.error('[sambers/leads/import-xlsx] DB fetch error:', fetchError)
    return NextResponse.json({ error: 'Gagal cek data existing: ' + fetchError.message }, { status: 500 })
  }

  const existingPhones = new Set((existingRows ?? []).map((r: { phone: string }) => r.phone))

  const toInsert = uniqueRows.filter(r => !existingPhones.has(r.phone))
  const skippedLeads: SkippedLead[] = uniqueRows
    .filter(r => existingPhones.has(r.phone))
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
  xlsxSessionStore.delete(sessionKey)

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
