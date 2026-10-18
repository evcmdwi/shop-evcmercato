import type { SupabaseClient } from '@supabase/supabase-js'
import { WA_ADMIN_URL } from '@/content/homepage'

export type BannerLinkType = 'product' | 'category' | 'internal' | 'whatsapp'

export interface HeroBanner {
  id: string
  title: string
  image_mobile_url: string
  image_desktop_url: string | null
  bg_color: string | null
  alt_text: string
  link_type: BannerLinkType
  link_value: string
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  sort_order: number
  click_count: number
}

/** Data banner yang dikirim ke carousel publik (tanpa info admin). */
export interface HeroSlide {
  id: string
  image_mobile_url: string
  image_desktop_url: string | null
  bg_color: string | null
  alt_text: string
  href: string
}

export interface HeroSettings {
  intervalSeconds: number
}

export const HERO_DEFAULT_SETTINGS: HeroSettings = { intervalSeconds: 5 }
/** Maksimal banner yang tampil di carousel. */
export const HERO_MAX_SLIDES = 5
export const HERO_BANNER_MAX_BYTES = 500 * 1024
export const HERO_BANNER_SIZES = {
  mobile: { width: 1080, height: 720 },
  desktop: { width: 1920, height: 640 },
} as const

export const LINK_TYPES: BannerLinkType[] = ['product', 'category', 'internal', 'whatsapp']

/** Tautan slide. Eksternal hanya wa.me admin; internal harus path di toko ini. */
export function bannerHref(b: Pick<HeroBanner, 'link_type' | 'link_value'>): string {
  const v = (b.link_value ?? '').trim()
  switch (b.link_type) {
    case 'product':
      return v ? `/katalog/${encodeURIComponent(v)}` : '/katalog'
    case 'category':
      return v ? `/katalog?category=${encodeURIComponent(v)}` : '/katalog'
    case 'internal':
      return isSafeInternalPath(v) ? v : '/'
    case 'whatsapp':
      return v ? `${WA_ADMIN_URL}?text=${encodeURIComponent(v)}` : WA_ADMIN_URL
  }
}

export function isSafeInternalPath(v: string): boolean {
  return v.startsWith('/') && !v.startsWith('//') && !v.includes('\\')
}

export type BannerStatus = 'Aktif' | 'Terjadwal' | 'Berakhir' | 'Nonaktif'

export function bannerStatus(b: Pick<HeroBanner, 'is_active' | 'starts_at' | 'ends_at'>, now = Date.now()): BannerStatus {
  if (!b.is_active) return 'Nonaktif'
  if (b.ends_at && new Date(b.ends_at).getTime() <= now) return 'Berakhir'
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return 'Terjadwal'
  return 'Aktif'
}

export function toSlide(b: HeroBanner): HeroSlide {
  return {
    id: b.id,
    image_mobile_url: b.image_mobile_url,
    image_desktop_url: b.image_desktop_url,
    bg_color: b.bg_color,
    alt_text: b.alt_text,
    href: bannerHref(b),
  }
}

export function parseHeroSettings(rows: { key: string; value: unknown }[] | null | undefined): HeroSettings {
  const s = { ...HERO_DEFAULT_SETTINGS }
  for (const r of rows ?? []) {
    if (r.key === 'hero_interval_seconds') {
      const n = Number(r.value)
      if (Number.isFinite(n)) s.intervalSeconds = Math.min(10, Math.max(3, Math.round(n)))
    }
  }
  return s
}

/** Banner yang sedang tayang + pengaturan carousel (dipanggil server, service role). */
export async function getHeroData(admin: SupabaseClient): Promise<{ slides: HeroSlide[]; settings: HeroSettings }> {
  // Tabel belum ada / error → tanpa banner (beranda tampil seperti biasa).
  const [{ data: banners }, { data: settingRows }] = await Promise.all([
    admin
      .from('hero_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    admin.from('site_settings').select('key, value').like('key', 'hero_%'),
  ])
  const settings = parseHeroSettings(settingRows)
  const live = ((banners ?? []) as HeroBanner[]).filter((b) => bannerStatus(b) === 'Aktif')
  return { slides: live.slice(0, HERO_MAX_SLIDES).map(toSlide), settings }
}

// ── Zona waktu WITA (UTC+8, tanpa DST) untuk form admin ──────────────────
const WITA_OFFSET_MS = 8 * 60 * 60 * 1000

/** ISO → nilai input datetime-local dalam WITA ("2026-10-20T08:00"). */
export function isoToWitaInput(iso: string | null): string {
  if (!iso) return ''
  return new Date(new Date(iso).getTime() + WITA_OFFSET_MS).toISOString().slice(0, 16)
}

/** Nilai input datetime-local (dibaca sebagai WITA) → ISO UTC, atau null bila kosong. */
export function witaInputToIso(v: string): string | null {
  if (!v) return null
  const d = new Date(`${v}:00+08:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** "20 Okt 2026 17.34" (WITA). */
export function formatWita(iso: string | null): string {
  if (!iso) return ''
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('year')} ${get('hour')}.${get('minute')}`
}
