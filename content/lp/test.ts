import type { LandingPageContent } from '@/lib/marketing/types'

const content: LandingPageContent = {
  slug: 'test',
  campaign_name: 'Test Landing Page',
  meta: {
    title: 'EVC Mercato — Produk Kesehatan & Kecantikan KKI',
    description: 'Temukan produk terbaik KKI Group. Terpercaya sejak 2003.',
  },
  hero: {
    headline: 'Hidup Sehat, Tampil Cantik',
    subheadline: 'Produk unggulan KKI Group — terpercaya lebih dari 20 tahun.',
    cta_primary: {
      text: 'Belanja Sekarang',
      link: 'https://shop.evcmercato.com',
      type: 'shop_home',
    },
    cta_secondary: {
      text: 'Konsultasi Gratis dengan Evie',
      link: 'https://t.me/evie_evc_bot?start=6285820852908',
      type: 'evie',
    },
  },
  trust_elements: [
    { icon: '🏆', title: 'Sejak 2003', description: 'Mitra resmi KKI Group' },
    { icon: '✅', title: 'Terdaftar KEMENKES', description: 'AKL 11104320676' },
    { icon: '🚚', title: 'Kirim Cepat', description: 'Sameday & Instan' },
    { icon: '💬', title: 'CS Responsif', description: 'Via WhatsApp & Evie' },
  ],
  faq: [
    { question: 'Apakah produk ini aman?', answer: 'Ya, semua produk KKI terdaftar di KEMENKES RI dan telah melalui uji kelayakan.' },
    { question: 'Bagaimana cara pesan?', answer: 'Klik "Belanja Sekarang", pilih produk, dan checkout langsung di shop.evcmercato.com.' },
    { question: 'Ada konsultasi gratis?', answer: 'Ya! Konsultasi kesehatan gratis 24 jam via Evie Health Bot di Telegram.' },
  ],
}

export default content
