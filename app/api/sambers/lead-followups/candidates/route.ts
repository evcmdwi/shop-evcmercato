import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Leads yang bisa di-follow up (belum member, nomor HP valid, belum ditolak) + info kunci & percobaan.
export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const admin = getSupabaseAdmin()
  const leads: unknown[] = []
  // Ambil per 1000 baris (batas max-rows PostgREST).
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.rpc('admin_lead_candidates').order('id').range(from, from + 999)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    leads.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return NextResponse.json({ leads })
}
