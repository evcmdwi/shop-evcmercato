/**
 * Supergreen Food — Landing Page v2 (/lp/supergreen-food). Brief: BRIEF_LP_SUPERGREEN_V2 (18 Okt 2026).
 * Versi lama: content/lp/supergreen-food-v1.ts (/lp/supergreen-food-v1, Archived).
 *
 * TIDAK ADA HARGA DI SINI — harga, harga/hari, EVC Points & angka terjual diambil dari
 * database (lib/lp/supergreen.ts). Jawaban FAQ diisi dari Sambers › Landing Pages › Edit FAQ.
 *
 * BPOM: Obat Tradisional Impor — TI044511731. Klaim manfaat & testimoni sama dengan v1
 * (keputusan Dwi). Jangan dipertegas.
 */

export const meta = {
  title: 'Supergreen Food — Nutrisi Hijau Harian dari Spirulina & Chlorella | EVC Mercato',
  description:
    'Makan telat, kopi jalan terus, sayur jarang? Supergreen Food (BPOM TI044511731): nutrisi hijau harian dari spirulina & chlorella. Resmi dari EVC Mercato, Mitra Resmi KKI sejak 2003.',
  ogImage: 'https://evcmercato.com/assets/supergreen-packshot-2.png',
  url: 'https://evcmercato.com/lp/supergreen-food',
}

export const WA_NUMBER = '6285820852908'

/** Konteks tombol WA umum → kode ref `sgf-{konteks}`. */
export type WaContext = 'header' | 'hero' | 'konsultasi' | 'penutup' | 'sticky'

export function waGeneralText(context: WaContext): string {
  return `Halo Admin EVC, saya lihat iklan Supergreen Food dan ingin konsultasi dulu. [ref: sgf-${context}]`
}

export function waPackageText(name: string, price: string, ref: string): string {
  return `Halo Admin EVC, saya tertarik Supergreen Food ${name} (${price}). Boleh dibantu? [ref: sgf-paket-${ref}]`
}

export const hero = {
  chip: 'BPOM TI044511731 · Mitra Resmi KKI sejak 2003',
  headline: 'Makan telat, kopi jalan terus, sayur? Jarang.',
  sub: 'Supergreen Food: nutrisi hijau harian dari spirulina & chlorella, untuk kamu yang pola makannya belum ideal.',
  compare: 'Lebih hemat dari segelas kopi kekinian.',
  ctaPrimary: 'Lihat paket & harga',
  ctaWa: 'Tanya admin dulu, gratis',
  note: '*Paket Family, dosis dewasa 5 tablet/hari.',
}

export const pattern = {
  headline: 'Kenal pola ini?',
  cards: [
    { time: 'Pagi', text: 'Buru-buru. Perut belum siap, kopi sudah masuk duluan.' },
    { time: 'Siang', text: 'Makan ditunda. Begitu sempat, yang penting cepat & kenyang.' },
    { time: 'Sore', text: 'Badan drop. Kopi lagi, tambah snack manis.' },
    { time: 'Malam', text: 'Makan besar, pedas, gorengan. Tidur larut.' },
  ],
  // **…** ditebalkan.
  closing:
    'Besok paginya, kopi lagi. Begitu terus. **Kamu tidak harus langsung hidup sempurna**, tapi tubuhmu bukan mesin. Mulai dari yang paling dasar: dukungan nutrisi harian.',
}

export const step = {
  headline: 'Langkah kecil yang masuk akal',
  body: 'Spirulina & chlorella dalam tablet praktis. Bukan alasan makan sembarangan, tapi satu kebiasaan baik yang tetap jalan saat hari sedang padat.',
  // Sama dengan v1 (judul kartu manfaat).
  benefits: [
    'Membantu melengkapi nutrisi hijau harian',
    'Membantu mendukung kesehatan pencernaan',
    'Membantu menjaga energi & fokus',
    'Membantu mendukung daya tahan tubuh',
    'Membantu mendukung keseimbangan tubuh',
    'Membantu menjaga kesehatan kulit & rambut',
  ],
}

export const dosage = {
  headline: 'Cara minum',
  cards: [
    { who: 'Dewasa', dose: '5–10 tablet', unit: 'per hari' },
    { who: 'Anak-anak', dose: '3–5 tablet', unit: 'per hari' },
  ],
  note: 'Boleh dibagi beberapa kali minum, misalnya pagi dan sore. Butuh dosis khusus? Admin EVC bantu sesuaikan.',
}

/** Dosis dewasa untuk hitungan harga per hari. */
export const DAILY_TABLETS = 5

export type PackageKey = 'trial' | '60' | 'family'

export const packages: {
  key: PackageKey
  /** Slug produk di shop (/katalog/{slug}) — harga diambil dari produk ini. */
  slug: string
  name: string
  tablets: number
  detail: string
  badge: string
  highlight: boolean
  photo: string
}[] = [
  {
    key: 'trial',
    slug: 'paket-trial-30-hari-supergreen-food-sgf-150-tablet',
    name: 'Paket Trial 30 hari',
    tablets: 150,
    detail: '150 tablet · cocok untuk mulai mencoba',
    badge: 'UNTUK MULAI',
    highlight: false,
    photo: '/assets/sgf-paket-trial.png',
  },
  {
    key: '60',
    slug: 'paket-hemat-60-hari-supergreen-food-300-tablet',
    name: 'Paket 60 hari',
    tablets: 300,
    detail: '300 tablet · cukup untuk membangun kebiasaan',
    badge: 'PALING SEIMBANG',
    highlight: true,
    photo: '/assets/sgf-paket-60-hari.png',
  },
  {
    key: 'family',
    slug: 'paket-family-supergreen-food-700-tablet',
    name: 'Paket Family',
    tablets: 700,
    detail: '700 tablet · 140 hari untuk 1 orang, 70 hari berdua',
    badge: 'PALING HEMAT',
    highlight: false,
    photo: '/assets/sgf-paket-family.png',
  },
]

export const offer = {
  headline: 'Pilih paket mulai',
  sub: 'Harga sama dengan di shop.evcmercato.com. Hitungan per hari untuk dosis dewasa 5 tablet.',
  // Ongkir reguler gratis untuk belanja ≥ Rp80.000 (app/api/checkout) — semua paket SGF.
  perks: ['Gratis ongkir', 'Pendampingan admin'],
  cta: 'Beli paket ini',
}

export const consult = {
  headline: 'Bingung pilih paket? Admin bantu hitung kebutuhanmu.',
  body: 'Ceritakan pola makan dan aktivitasmu, admin EVC sarankan dosis dan paket yang pas. Tanpa wajib beli.',
  cta: 'Chat via WhatsApp',
  hours: 'Senin–Sabtu 09.00–17.00 WITA · di luar jam kerja dibalas pagi berikutnya',
}

export const testimonials = {
  headline: 'Kata mereka',
  /** Tampil dulu; sisanya muncul lewat tombol "Lihat semua cerita". */
  firstNames: ['Robby', 'Widie', 'Dini'],
  // Teks sama persis dengan v1.
  items: [
    {
      quote:
        'Dulu saya sering makan telat, kopi terus, sayur jarang. Awalnya coba Supergreen Food karena sadar pola makan saya berantakan. Yang saya rasakan, jadi lebih mudah punya rutinitas kecil untuk jaga tubuh.',
      name: 'Robby',
      label: 'pekerja aktif',
      photo: '/assets/testimoni-supergreen-1.png',
    },
    {
      quote:
        'Perut saya sering terasa tidak nyaman kalau makan sudah kacau. Supergreen Food bukan bikin saya bebas makan sembarangan, tapi membantu saya mulai lebih sadar memperhatikan asupan.',
      name: 'Miesye',
      label: 'Ibu Rumah Tangga',
      photo: '/assets/testimoni-supergreen-2.png',
    },
    {
      quote:
        'Saya suka karena praktis. Kalau hari lagi padat dan makan tidak ideal, setidaknya ada satu kebiasaan baik yang tetap bisa saya jalani.',
      name: 'Alex',
      label: 'Content Creator',
      photo: '/assets/testimoni-supergreen-3.png',
    },
    {
      quote:
        'Biasanya kalau sudah sibuk, makan saya asal banget. Supergreen Food membantu saya merasa punya langkah kecil untuk mulai memperbaiki rutinitas harian.',
      name: 'Tri',
      label: 'Forex Trader',
      photo: '/assets/testimoni-supergreen-4.png',
    },
    {
      quote:
        'Saya bukan tipe yang rajin minum suplemen. Tapi ini terasa simpel, jadi lebih mudah masuk ke kebiasaan pagi saya.',
      name: 'Dini',
      label: 'Banker',
      photo: '/assets/testimoni-supergreen-5.png',
    },
    {
      quote:
        'Jadwal sering memaksa saya menunda waktu makan. Sejak ada Supergreen Food, lambung saya tetap dapat bekerja sama dan aktivitas lancar. Saya selalu minum 2x sehari, pagi dan sore.',
      name: 'Widie',
      label: 'Pilates Trainer',
      photo: '/assets/testimoni-supergreen-6.png',
    },
    {
      quote:
        'Makanan pedas, seblak, bakso, gorengan ini aku suka bangett. Apalagi kalo stress target di kantor, malamnya maag-ku biasanya kumat dan aku minum obat maag. Untung dikenalin temen Supergreen Food, jadi aku beralih ke yang alami dan menyehatkan. Lambungku sekarang bisa diajak kompromi.',
      name: 'Neny',
      label: 'Marketing Otomotif',
      photo: '/assets/testimoni-supergreen-7.png',
    },
    {
      quote:
        'Sejak kehamilanku, stress meningkat, suplemen kehamilan membuatku susah BAB dan uring-uringan. Aku tambahkan Supergreen Food untuk nutrisi kehamilanku — BAB lancar, kehamilan lancar, anakku tumbuh sehat dengan ASI eksklusif. Selama menyusui aku selalu tambahkan Supergreen Food sebagai nutrisi wajibku.',
      name: 'Yanti',
      label: 'Ibu Menyusui',
      photo: '/assets/testimoni-supergreen-8.png',
    },
  ],
  disclaimer: 'Hasil dapat berbeda pada tiap individu.',
}

/**
 * FAQ — pertanyaan tetap; jawaban dari admin (site_settings `lp_faq:supergreen-food`).
 * `defaultAnswer` dipakai bila admin belum mengisi. Pertanyaan tanpa jawaban TIDAK dirender.
 */
export const FAQ_SETTING_KEY = 'lp_faq:supergreen-food'

export const faqQuestions: { id: string; q: string; defaultAnswer: string }[] = [
  {
    id: 'dosis',
    q: 'Berapa tablet sehari?',
    defaultAnswer:
      'Dewasa 5–10 tablet, anak-anak 3–5 tablet per hari. Boleh dibagi beberapa kali minum. Admin bisa bantu menyesuaikan.',
  },
  { id: 'kapan-terasa', q: 'Kapan mulai terasa?', defaultAnswer: '' },
  {
    id: 'arti-ti',
    q: 'Apa arti "Obat Tradisional Impor (TI)"?',
    // Teks penjelasan BPOM dari v1.
    defaultAnswer:
      'Supergreen Food memiliki izin edar BPOM TI044511731, dengan kategori Obat Tradisional Impor. Artinya, Supergreen Food berada pada kategori obat tradisional impor, berbeda dari produk makanan impor (ML) maupun suplemen kesehatan impor (SI).',
  },
  { id: 'aman-harian', q: 'Aman diminum setiap hari?', defaultAnswer: '' },
  { id: 'original', q: 'Apakah produknya original?', defaultAnswer: '' },
  { id: 'kenapa-mahal', q: 'Kenapa lebih mahal dari spirulina biasa?', defaultAnswer: '' },
]

export const closing = {
  headline: 'Mulai saat masih bisa memilih.',
  // {perDay} diganti harga per hari terendah dari database.
  body: 'Satu kebiasaan kecil hari ini, mulai {perDay} per hari.',
  ctaPrimary: 'Pilih paket sekarang',
  ctaWa: 'Konsultasi dulu via WhatsApp',
}

export const footer = {
  bpom: 'Supergreen Food terdaftar BPOM TI044511731 sebagai Obat Tradisional Impor.',
  company:
    'Dikelola CV EVC Nusantara Sukses, Mitra Usaha Resmi KKI Group (KKD 12081020) sejak 2003. Bukan official store KKI Group.',
  privacyUrl: 'https://shop.evcmercato.com/privacy-policy',
}
