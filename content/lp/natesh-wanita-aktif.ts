import type { LandingPageContent } from '@/lib/marketing/types'

const content: LandingPageContent = {
  slug: 'natesh-wanita-aktif',
  campaign_name: 'Natesh Wanita Aktif',
  meta: {
    title: 'Natesh untuk Wanita Aktif — Tetap Nyaman & Percaya Diri Seharian',
    description: 'Pilihan feminine care premium untuk wanita aktif. Nyaman dipakai saat aktivitas padat, beli cepat & discreet melalui EVC Mercato.',
    og_image: 'https://shop.evcmercato.com/assets/natesh-hero-wanita-aktif.jpg',
  },
  hero: {
    headline: 'Aktif Seharian? Tetap Nyaman & Percaya Diri',
    subheadline: 'Natesh untuk wanita aktif yang ingin bergerak lebih nyaman, tenang, dan praktis sepanjang hari.',
    cta_primary: {
      text: 'Beli Natesh Sekarang',
      link: 'https://shop.evcmercato.com/katalog?category=natesh',
      type: 'shop_category',
    },
    cta_secondary: {
      text: 'Tanya Admin',
      link: 'https://wa.me/6285820852908',
      type: 'evie',
    },
  },
  trust_elements: [],
  faq: [
    {
      question: 'Apakah Natesh cocok untuk wanita aktif?',
      answer:
        'Natesh diposisikan sebagai feminine care premium untuk mendukung kenyamanan wanita dalam aktivitas harian. Jika kamu punya kebutuhan khusus atau kondisi sensitif, sebaiknya konsultasikan dulu dengan tenaga profesional atau tanyakan admin untuk info produk yang tersedia.',
    },
    {
      question: 'Apakah paketnya discreet?',
      answer: 'Ya, EVC dapat mengirim dengan packaging yang rapi dan discreet agar produk personal care tetap nyaman diterima.',
    },
    {
      question: 'Bisa tanya dulu sebelum beli?',
      answer: 'Bisa. Admin EVC siap membantu menjawab pertanyaan seputar stok, cara order, pengiriman, dan info produk.',
    },
    {
      question: 'Pengiriman dari mana?',
      answer: 'Pengiriman diproses oleh tim EVC. Detail estimasi pengiriman mengikuti alamat customer dan layanan ekspedisi yang tersedia.',
    },
    {
      question: 'Apakah ini klaim medis?',
      answer: 'Tidak. Landing page ini fokus pada kenyamanan, kepercayaan diri, dan pengalaman belanja. Kami tidak membuat klaim medis.',
    },
  ],
}

export default content
