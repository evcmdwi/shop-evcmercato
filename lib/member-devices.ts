import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEVICE_COOKIE } from '@/lib/device-id'

// Jejak perangkat member untuk mengenali distributor KKI yang mendaftar ulang dengan email lain
// (dicocokkan di SQL kki_suspects). Diumumkan di Kebijakan Privasi; disimpan maks 12 bulan.

type DeviceEvent = 'login' | 'visit' | 'checkout'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Kunjungan dari perangkat + IP yang sama cukup dicatat sekali per periode ini.
const VISIT_DEDUPE_MS = 12 * 3600_000
export const DEVICE_RETENTION_DAYS = 365

export function deviceSignals(req: NextRequest) {
  const raw = req.cookies.get(DEVICE_COOKIE)?.value ?? ''
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? '').trim()
  return {
    device_id: UUID_RE.test(raw) ? raw.toLowerCase() : null,
    ip: ip || null,
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  }
}

/** Catat jejak perangkat. Tidak pernah melempar error — pencatatan tidak boleh mengganggu login/checkout. */
export async function recordMemberDevice(admin: SupabaseClient, userId: string, event: DeviceEvent, req: NextRequest) {
  try {
    const s = deviceSignals(req)
    if (!s.device_id && !s.ip) return
    if (event === 'visit') {
      let q = admin
        .from('member_devices')
        .select('id')
        .eq('user_id', userId)
        .gt('created_at', new Date(Date.now() - VISIT_DEDUPE_MS).toISOString())
        .limit(1)
      q = s.device_id ? q.eq('device_id', s.device_id) : q.is('device_id', null)
      q = s.ip ? q.eq('ip', s.ip) : q.is('ip', null)
      const { data } = await q
      if (data?.length) return
    }
    const { error } = await admin.from('member_devices').insert({ user_id: userId, event, ...s })
    if (error) console.error('[member-devices] insert:', error.message)
  } catch (err) {
    console.error('[member-devices]', err)
  }
}
