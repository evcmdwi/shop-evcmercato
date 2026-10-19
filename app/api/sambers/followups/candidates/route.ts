import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Daftar customer untuk di-follow up admin (segmen: unpaid, repeat, dormant, new).
export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })

  const { data, error } = await getSupabaseAdmin().rpc('admin_followup_candidates')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidates: data ?? [] })
}
