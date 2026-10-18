import { LINK_TYPES, isSafeInternalPath, type BannerLinkType } from '@/lib/hero-banners'

export interface BannerInput {
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
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const optDate = (v: unknown): string | null | false => {
  if (v === null || v === undefined || v === '') return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? false : d.toISOString()
}
/** Gambar harus dari Supabase Storage proyek ini (bucket banners). */
const isStorageUrl = (v: string) => /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//.test(v)

export function validateBannerInput(body: unknown): { data: BannerInput } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Data tidak valid' }
  const b = body as Record<string, unknown>

  const title = str(b.title)
  const image_mobile_url = str(b.image_mobile_url)
  const image_desktop_url = str(b.image_desktop_url) || null
  const alt_text = str(b.alt_text)
  const link_type = str(b.link_type) as BannerLinkType
  let link_value = str(b.link_value)
  const bg = str(b.bg_color)

  if (!title) return { error: 'Judul internal wajib diisi' }
  if (!image_mobile_url || !isStorageUrl(image_mobile_url)) return { error: 'Gambar mobile wajib diupload' }
  if (image_desktop_url && !isStorageUrl(image_desktop_url)) return { error: 'Gambar desktop tidak valid' }
  if (!alt_text) return { error: 'Teks alternatif (alt) wajib diisi' }
  if (!LINK_TYPES.includes(link_type)) return { error: 'Jenis link tidak valid' }
  if (link_type === 'category' && !link_value) return { error: 'Pilih kategori tujuan' }
  if (link_type === 'internal' && !isSafeInternalPath(link_value)) {
    return { error: 'URL internal harus diawali "/" (mis. /katalog?q=natesh)' }
  }
  if (link_type === 'whatsapp') link_value = link_value.slice(0, 300)
  if (bg && !/^#[0-9a-fA-F]{6}$/.test(bg)) return { error: 'Warna latar harus format #RRGGBB' }

  const starts_at = optDate(b.starts_at)
  const ends_at = optDate(b.ends_at)
  if (starts_at === false || ends_at === false) return { error: 'Tanggal tidak valid' }
  if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
    return { error: 'Waktu selesai harus setelah waktu mulai' }
  }

  return {
    data: {
      title: title.slice(0, 120),
      image_mobile_url,
      image_desktop_url,
      bg_color: bg || null,
      alt_text: alt_text.slice(0, 200),
      link_type,
      link_value,
      starts_at,
      ends_at,
      is_active: b.is_active !== false,
    },
  }
}
