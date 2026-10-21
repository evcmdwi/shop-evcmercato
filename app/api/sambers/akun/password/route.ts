import { NextRequest, NextResponse } from 'next/server'
import { createClient as createPlainClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Admin mengganti password akun Sambers-nya sendiri (wajib isi password lama).
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.ok || !auth.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })

    const body = await req.json().catch(() => ({}))
    const current = String(body.current ?? '')
    const next = String(body.next ?? '')
    if (next.length < 6) return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })

    const admin = getSupabaseAdmin()
    const { data: au } = await admin.auth.admin.getUserById(auth.userId)
    if (!au.user?.email) return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })

    // Cek password lama lewat klien terpisah supaya sesi cookie tidak tersentuh.
    const probe = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: wrong } = await probe.auth.signInWithPassword({ email: au.user.email, password: current })
    if (wrong) return NextResponse.json({ error: 'Password lama salah' }, { status: 400 })

    const { error } = await admin.auth.admin.updateUserById(auth.userId, { password: next })
    if (error) return NextResponse.json({ error: 'Gagal mengganti password: ' + error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[akun/password]', e)
    return NextResponse.json({ error: 'Gagal mengganti password' }, { status: 500 })
  }
}
