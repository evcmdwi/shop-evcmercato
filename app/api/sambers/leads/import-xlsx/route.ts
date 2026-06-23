/**
 * POST /api/sambers/leads/import-xlsx
 *
 * Receives column mapping + previously uploaded file session,
 * processes rows, deduplicates by phone, and bulk-inserts leads.
 *
 * NOTE: Full implementation by BENJI (backend).
 * This stub validates input and returns a not-implemented response.
 *
 * Request body:
 * {
 *   mapping: Record<string, 'name' | 'phone' | 'city' | 'ignore'>
 *   // fileKey?: string  // if BENJI uses server-side session for the parsed file
 * }
 *
 * Expected response shape:
 * {
 *   imported: number
 *   skipped: number
 *   skippedLeads: Array<{ name: string; phone: string; reason: string }>
 * }
 *
 * Error response:
 * { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_FIELDS = new Set(['name', 'phone', 'city', 'ignore'])

export async function POST(req: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  // Ensure phone is mapped
  const hasPhone = Object.values(mapping).includes('phone')
  if (!hasPhone) {
    return NextResponse.json(
      { error: 'Kolom No HP/WA wajib di-mapping sebelum import' },
      { status: 400 }
    )
  }

  // TODO (BENJI): 
  // 1. Retrieve parsed XLSX data from session/cache (or re-parse from stored temp file)
  // 2. Map each row using the mapping config
  // 3. Normalize phone numbers (strip spaces, handle +62, 62, 08)
  // 4. Deduplicate against existing leads.phone in Supabase
  // 5. Bulk insert new leads with status='new'
  // 6. Return { imported, skipped, skippedLeads }
  return NextResponse.json(
    {
      error: 'Backend belum siap. BENJI perlu mengimplementasi import logic di endpoint ini.',
      hint: 'Query existing phones with: supabase.from("leads").select("phone"), then filter and batch upsert',
    },
    { status: 501 }
  )
}
