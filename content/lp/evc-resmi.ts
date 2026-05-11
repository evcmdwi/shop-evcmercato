import type { LandingPageContent } from '@/lib/marketing/types'

const content: LandingPageContent = {
  slug: 'evc-resmi',
  campaign_name: 'EVC Trust — Website Official Landing Page',
  meta: {
    title: 'Belanja Produk Kesehatan & Wellness Pilihan di Website Resmi EVC Mercato',
    description: 'Cek produk resmi, tanya admin, dan belanja lebih nyaman langsung dari website EVC — praktis, aman, dan dibantu tim yang siap melayani.',
    og_image: 'https://shop.evcmercato.com/logo-evcmercato.jpg',
  },
  hero: {
    headline: 'Belanja Produk Kesehatan & Wellness Pilihan di Website Resmi EVC Mercato',
    subheadline: 'Cek produk resmi, tanya admin, dan belanja lebih nyaman langsung dari website EVC — praktis, aman, dan dibantu tim yang siap melayani.',
    background_color: '#f8fce8',
    cta_primary: {
      text: 'Mulai Belanja Sekarang',
      link: 'https://shop.evcmercato.com',
      type: 'shop_home',
    },
    cta_secondary: {
      text: 'Lihat Produk Resmi',
      link: 'https://shop.evcmercato.com/katalog',
      type: 'shop_category',
    },
  },
  trust_elements: [],
  faq: [],
}

export default content
