import { NextRequest, NextResponse } from 'next/server'
import { createClient as createPlainClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Pelanggan login mengganti password-nya sendiri (wajib isi password lama).
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const current = String(body.current ?? '')
    const next = String(body.next ?? '')
    if (next.length < 6) return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
    if (next === current) return NextResponse.json({ error: 'Password baru harus berbeda dari password lama' }, { status: 400 })

    // Cek password lama lewat klien terpisah supaya sesi cookie tidak tersentuh.
    const probe = createPlainClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: wrong } = await probe.auth.signInWithPassword({ email: user.email, password: current })
    if (wrong) return NextResponse.json({ error: 'Password lama salah' }, { status: 400 })

    const { error } = await getSupabaseAdmin().auth.admin.updateUserById(user.id, { password: next })
    if (error) return NextResponse.json({ error: 'Gagal mengganti password: ' + error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[user/password]', e)
    return NextResponse.json({ error: 'Gagal mengganti password' }, { status: 500 })
  }
}
