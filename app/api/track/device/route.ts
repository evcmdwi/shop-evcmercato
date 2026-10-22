import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { recordMemberDevice } from '@/lib/member-devices'

// POST — dipanggil halaman login setelah berhasil masuk: catat jejak perangkat member.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await recordMemberDevice(getSupabaseAdmin(), user.id, 'login', req)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Gagal mencatat' }, { status: 500 })
  }
}
