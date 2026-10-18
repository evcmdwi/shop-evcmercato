import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { checkAdminAuthWithRole } from '@/lib/admin-auth-role'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { FAQ_SETTING_KEY, faqQuestions } from '@/content/lp/supergreen-food'

// LP yang FAQ-nya bisa diisi dari Sambers › Landing Pages.
const LP_FAQS: Record<string, { key: string; tag: string; questions: typeof faqQuestions }> = {
  'supergreen-food': { key: FAQ_SETTING_KEY, tag: 'lp-supergreen', questions: faqQuestions },
}

const MAX_ANSWER = 2000

/** GET ?slug=… — pertanyaan + jawaban tersimpan (atau bawaan bila belum pernah disimpan). */
export async function GET(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  const lp = LP_FAQS[req.nextUrl.searchParams.get('slug') ?? '']
  if (!lp) return NextResponse.json({ error: 'LP ini tidak punya FAQ yang bisa diedit' }, { status: 404 })

  const { data, error } = await getSupabaseAdmin().from('site_settings').select('value').eq('key', lp.key).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const saved = (data?.value ?? {}) as Record<string, unknown>
  return NextResponse.json({
    items: lp.questions.map((q) => ({
      id: q.id,
      q: q.q,
      a: typeof saved[q.id] === 'string' ? (saved[q.id] as string) : q.defaultAnswer,
    })),
  })
}

/** PUT `{ slug, answers: { [id]: string } }` — jawaban kosong = pertanyaan disembunyikan. */
export async function PUT(req: NextRequest) {
  const auth = await checkAdminAuthWithRole()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status ?? 401 })
  const body = await req.json().catch(() => null)
  const lp = LP_FAQS[body?.slug ?? '']
  if (!lp) return NextResponse.json({ error: 'LP ini tidak punya FAQ yang bisa diedit' }, { status: 404 })
  const answers = body?.answers
  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Data jawaban tidak valid' }, { status: 400 })
  }

  const value: Record<string, string> = {}
  for (const q of lp.questions) {
    const a = answers[q.id]
    if (typeof a !== 'string') continue
    if (a.length > MAX_ANSWER) {
      return NextResponse.json({ error: `Jawaban "${q.q}" terlalu panjang (maks ${MAX_ANSWER} karakter)` }, { status: 400 })
    }
    value[q.id] = a.trim()
  }

  const { error } = await getSupabaseAdmin()
    .from('site_settings')
    .upsert({ key: lp.key, value, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag(lp.tag, { expire: 0 })
  return NextResponse.json({ ok: true })
}
