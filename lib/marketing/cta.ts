import { appendUTM } from './utm'

const SHOP_BASE = 'https://shop.evcmercato.com'
const EVIE_BASE = 'https://t.me/evie_evc_bot?start=6285820852908'

export function generateCTALink(
  type: 'shop_home' | 'shop_category' | 'shop_product' | 'evie',
  slug: string | undefined,
  utm: Record<string, string>
): string {
  let base: string
  switch (type) {
    case 'shop_category':
      base = `${SHOP_BASE}/katalog?kategori=${slug ?? ''}`
      break
    case 'shop_product':
      base = `${SHOP_BASE}/katalog/${slug ?? ''}`
      break
    case 'evie':
      return EVIE_BASE
    default:
      base = SHOP_BASE
  }
  return appendUTM(base, utm)
}
