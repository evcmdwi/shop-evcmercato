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
      text: 'Tanya Admin EVC',
      link: 'https://wa.me/6285820852908?text=Halo%20Admin%20EVC%2C%20saya%20ingin%20tanya%20tentang%20produk',
      type: 'whatsapp',
    },
  },
  trust_elements: [
    { icon: '🏆', title: 'Sejak 2003', description: 'Mitra resmi KKI Group' },
    { icon: '✅', title: 'Terdaftar KEMENKES', description: 'AKL 11104320676' },
    { icon: '🚚', title: 'Kirim Cepat', description: 'Sameday & Instan' },
    { icon: '💬', title: 'CS Responsif', description: 'Via WhatsApp' },
  ],
  faq: [
    { question: 'Apakah produk ini aman?', answer: 'Ya, semua produk KKI terdaftar di KEMENKES RI dan telah melalui uji kelayakan.' },
    { question: 'Bagaimana cara pesan?', answer: 'Klik "Belanja Sekarang", pilih produk, dan checkout langsung di shop.evcmercato.com.' },
    { question: 'Bisa tanya dulu sebelum beli?', answer: 'Bisa! Tanya admin EVC via WhatsApp sebelum belanja.' },
  ],
}

export default content
