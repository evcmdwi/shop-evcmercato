import type { LandingPageContent } from '@/lib/marketing/types'

const content: LandingPageContent = {
  slug: 'pearl-nourish-cream',
  campaign_name: 'Pearl Nourish Cream',
  meta: {
    title: 'Pearl Nourish Cream — Krim Legendaris untuk Cantik Alami Sejak 1999',
    description:
      'Pearl Nourish Cream Kristine Ko-Kool dengan Pearl Powder, Olive Oil, Bees Wax, Rice Starch, dan SPF15 membantu menjaga kelembapan, tampilan kulit lebih halus, dan perlindungan UV harian. Beli di EVC Mercato.',
    og_image: 'https://shop.evcmercato.com/assets/pearl-hero-bg.png',
  },
  hero: {
    headline: 'Pearl Nourish Cream, Krim Legendaris untuk Cantik Alami Sejak 1999',
    subheadline:
      'Dengan Pearl Powder, Olive Oil, Bees Wax, Rice Starch, dan SPF15 untuk membantu menjaga kelembapan, memberi tampilan kulit lebih halus, serta melindungi dari paparan sinar UV harian.',
    cta_primary: {
      text: 'Beli Sekarang',
      link: 'https://shop.evcmercato.com/katalog/pearl-cream-kristine-ko-kool-made-in-taiwan',
      type: 'shop_category',
    },
    cta_secondary: {
      text: 'Bantuan Admin EVC',
      link: 'https://wa.me/6285820852908?text=Halo%20Admin%20EVC%2C%20saya%20ingin%20bertanya%20tentang%20Pearl%20Nourish%20Cream',
      type: 'evie',
    },
  },
  trust_elements: [],
  faq: [
    {
      question: 'Apakah sudah BPOM?',
      answer: 'Ya, Pearl Nourish Cream telah terdaftar di BPOM dengan nomor NA47130300750.',
    },
    {
      question: 'Bisa dipakai pagi hari?',
      answer:
        'Bisa. Pearl Nourish Cream mengandung SPF15 yang membantu perlindungan dari paparan sinar UV harian, sehingga cocok digunakan pagi hari sebelum aktivitas.',
    },
    {
      question: 'Apakah hasilnya langsung putih?',
      answer:
        'Produk ini membantu tampilan kulit terlihat lebih cerah natural, terasa lembap, dan halus — bukan klaim memutihkan instan.',
    },
    {
      question: 'Cocok untuk kulit apa?',
      answer:
        'Untuk informasi lebih detail tentang kesesuaian dengan kondisi kulit kamu, konsultasi dengan Admin EVC via WhatsApp.',
    },
    {
      question: 'Bisa beli di EVC Mercato?',
      answer:
        'Ya! Klik tombol "Beli Sekarang" untuk langsung menuju halaman produk Pearl Nourish Cream di EVC Mercato.',
    },
  ],
}

export default content
