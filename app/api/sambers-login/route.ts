import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Login Sambers: username → email akun auth (tidak pernah dikirim ke browser) → sesi
// Supabase biasa di cookie, jadi semua cek admin yang lama tetap berlaku.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = String(body.username ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const wrong = NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    if (!username || !password) return wrong

    const admin = getSupabaseAdmin()
    const { data: acc } = await admin
      .from('admin_accounts').select('user_id').eq('username', username).eq('is_active', true).maybeSingle()
    if (!acc) return wrong
    const { data: au } = await admin.auth.admin.getUserById(acc.user_id)
    if (!au.user?.email) return wrong

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: au.user.email, password })
    if (error) {
      if (error.status === 429) return NextResponse.json({ error: 'Terlalu banyak percobaan, coba lagi sebentar lagi' }, { status: 429 })
      return wrong
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[sambers-login]', e)
    return NextResponse.json({ error: 'Gagal masuk, coba lagi' }, { status: 500 })
  }
}
