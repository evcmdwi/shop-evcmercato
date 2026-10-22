import type { LandingPageContent } from '@/lib/marketing/types'

const content: LandingPageContent = {
  slug: 'evc-resmi-v1',
  campaign_name: 'EVC Resmi — Meta Ads',
  meta: {
    title: 'EVC Mercato — Website Resmi Produk Kesehatan & Wellness Pilihan',
    description:
      'Temukan produk pilihan untuk kebutuhan harian, kesehatan, wellness, beauty, dan feminine care dalam satu tempat yang praktis, jelas, dan mudah diakses dari HP.',
  },
  hero: {
    headline: 'Produk KKI Original, Langsung dari Mitra Resmi',
    subheadline:
      'Jangan terkecoh produk palsu. EVC Mercato adalah mitra resmi KKI Group — terdaftar KEMENKES RI, sudah dipercaya ribuan pelanggan di seluruh Indonesia.',
    background_color: '#f0f7e6',
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
    {
      icon: '🏅',
      title: 'Mitra Resmi KKI',
      description: 'Produk 100% original, bukan KW atau refill',
    },
    {
      icon: '✅',
      title: 'Terdaftar KEMENKES',
      description: 'AKL 11104320676 — aman & teruji klinis',
    },
    {
      icon: '🚚',
      title: 'Kirim Cepat',
      description: 'Sameday & instan tersedia di Balikpapan',
    },
    {
      icon: '💬',
      title: 'CS Responsif',
      description: 'Siap bantu via WhatsApp',
    },
  ],
  testimonials: [
    {
      name: 'Siti Rahayu',
      role: 'Pelanggan dari Balikpapan',
      quote:
        'Sudah 6 bulan pakai produk KKI dari EVC Mercato. Asli, cepat sampai, dan CS-nya ramah banget. Nggak perlu khawatir soal keaslian produknya.',
      rating: 5,
    },
    {
      name: 'Budi Santoso',
      role: 'Pelanggan dari Samarinda',
      quote:
        'Awalnya ragu beli online, tapi ternyata gampang banget. Pesan pagi, sore udah sampai. Harga juga transparan, nggak ada biaya tersembunyi.',
      rating: 5,
    },
    {
      name: 'Dewi Kusuma',
      role: 'Pelanggan dari Jakarta',
      quote:
        'Suka banget bisa tanya admin dulu sebelum beli. Dibantu pilih produk yang cocok buat kondisi saya. Recommended!',
      rating: 5,
    },
  ],
  faq: [
    {
      question: 'Apakah produk di EVC Mercato aman dan original?',
      answer:
        'Ya, semua produk yang kami jual adalah produk KKI Group original dan terdaftar resmi di KEMENKES RI dengan nomor AKL 11104320676. Kamu tidak perlu khawatir soal keaslian atau keamanannya.',
    },
    {
      question: 'Bagaimana cara memesan?',
      answer:
        'Klik tombol "Belanja Sekarang", pilih produk yang kamu inginkan, masukkan ke keranjang, lalu checkout. Pembayaran bisa via transfer bank, QRIS, atau kartu kredit — semua aman dan terjamin.',
    },
    {
      question: 'Berapa ongkos kirimnya?',
      answer:
        'Ongkir dihitung otomatis berdasarkan lokasi kamu saat checkout. Untuk area Balikpapan, tersedia opsi sameday dan pengiriman instan. Kamu bisa cek estimasi langsung di halaman checkout.',
    },
    {
      question: 'Ada garansi keaslian produk?',
      answer:
        'Tentu! Sebagai mitra resmi KKI Group, kami menjamin semua produk 100% original. Kalau ada keraguan, hubungi CS kami via WhatsApp — kami siap bantu verifikasi.',
    },
    {
      question: 'Bisa konsultasi sebelum beli?',
      answer:
        'Bisa banget! Admin EVC siap bantu via WhatsApp untuk memilih produk yang paling sesuai dengan kebutuhanmu — gratis, tanpa perlu daftar dulu.',
    },
  ],
}

export default content
