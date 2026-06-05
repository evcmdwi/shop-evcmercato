/**
 * Supergreen Food — Landing Page content & config (page-local).
 *
 * This LP is a bespoke 12-section conversion page. It intentionally does NOT use
 * the shared `LandingPageContent` type (that type powers the generic /lp/[slug]
 * route and other LPs, and can't express this 12-section narrative).
 *
 * WEBO team: edit copy, CTA URLs, packages, testimonials, and FAQ HERE.
 * Layout lives in app/(marketing)/lp/supergreen-food/page.tsx.
 *
 * BPOM: Obat Tradisional Impor — TI044511731.
 * Health claims are intentionally HEDGED ("membantu mendukung…"). Do not strengthen.
 */

// ── Global config ────────────────────────────────────────────────────────────

export interface SupergreenCTAConfig {
  /** Product / checkout URL (official EVC shop). */
  buyUrl: string
  /** WhatsApp URL — format https://wa.me/62... */
  whatsappUrl: string
  /** Evie Agent URL. TODO: replace placeholder with the real Evie Agent link. */
  evieUrl: string
}

// Single source of truth for every CTA on the page. Do not hardcode links in JSX.
export const cta: SupergreenCTAConfig = {
  buyUrl: 'https://shop.evcmercato.com/katalog/supergreen',
  whatsappUrl: 'https://wa.me/6285820852908',
  // PLACEHOLDER — konfirmasi URL Evie Agent yang benar.
  evieUrl: 'https://wa.me/6285820852908?text=Halo%20Evie%2C%20saya%20mau%20tanya%20Supergreen%20Food',
}

export const meta = {
  title: 'Supergreen Food — Mulai Bantu Tubuhmu Sebelum Ia Memaksa Berhenti',
  description:
    'Pola makan berantakan, kopi jalan terus, sayur jarang? Supergreen Food (Obat Tradisional Impor BPOM TI044511731) membantu melengkapi nutrisi hijau harian dari spirulina & chlorella. Beli resmi original di EVC Mercato.',
  ogImage: 'https://shop.evcmercato.com/assets/supergreen-hero.jpg',
  url: 'https://evcmercato.com/lp/supergreen-food',
}

// ── Section 1 — Hero ──────────────────────────────────────────────────────────

export const hero = {
  // Headline & sub-headline, each rendered as explicit lines (overlaid on the hero image).
  headlineLines: ['Makan Telat,', 'Kopi Jalan Terus,', 'Sayur? Jarang !'],
  subheadlineLines: ['Lalu heran...', 'Kenapa perut sering', 'tidak nyaman?'],
  body: [
    'Pagi buru-buru, kopi dulu.',
    'Siang makan telat karena kerjaan belum selesai.',
    'Sore tambah kopi dan snack manis karena badan mulai drop.',
    'Malam baru makan besar—seringnya pedas, gorengan, atau yang penting kenyang.',
  ],
  // Lead-in line before the pull quote.
  beforeQuote:
    'Lalu ketika perut mulai begah, badan terasa berat, dan fokus kerja mulai pecah, kamu masih bilang:',
  pullQuote: 'Mungkin cuma capek.',
  afterQuote:
    'Padahal tubuhmu mungkin sedang protes karena terlalu lama dipaksa kompromi.',
  microcopy:
    'Supergreen Food bukan sekadar gaya hidup sehat. Ini langkah kecil untuk mulai membantu tubuh mendapat nutrisi hijau harian yang selama ini sering terlewat.',
  scrollCue: 'Baca dulu sebelum pola ini kamu anggap normal ↓',
}

// ── Section 2 — Pattern Recognition (day-cycle timeline) ──────────────────────

export const patternRecognition = {
  headlineLines: ['Coba jujur sebentar.', 'Ini bukan kejadian sekali dua kali, kan?'],
  // Vertical timeline: Pagi → Siang → Sore → Malam → Larut malam → Besok pagi.
  // `icon` is the lucide icon name resolved in page.tsx.
  timeline: [
    {
      icon: 'Coffee',
      time: 'Pagi',
      text: 'Pagi bangun sudah buru-buru. Perut belum siap, tapi kopi sudah masuk duluan.',
    },
    {
      icon: 'Utensils',
      time: 'Siang',
      text: 'Kerjaan belum selesai. Makan ditunda. Lalu begitu sempat, pilih yang cepat: nasi, gorengan, pedas, atau apa pun yang penting kenyang.',
    },
    {
      icon: 'Cookie',
      time: 'Sore',
      text: 'Badan mulai drop. Cari kopi lagi. Tambah snack manis. Biar mata tetap terbuka, biar kerjaan tetap jalan.',
    },
    {
      icon: 'Moon',
      time: 'Malam',
      text: 'Baru merasa punya waktu. Makan besar. Pedas lagi. Gorengan lagi. Lalu “healing” dengan drakor, mabar, scrolling HP, atau video pendek sampai larut malam.',
    },
    {
      icon: 'Smartphone',
      time: 'Larut malam',
      text: 'Tidur telat. Tubuh tidak sempat recovery dengan benar.',
    },
    {
      icon: 'Sunrise',
      time: 'Besok pagi',
      text: 'Bangun tidak fit. Dan karena badan belum siap jalan… kopi lagi.',
    },
  ],
  transition:
    'Begitu terus. Muter terus. Sampai tubuh yang awalnya cuma terasa “tidak nyaman” mulai benar-benar berat diajak kerja sama.',
  closingCard:
    'Pola ini bukan musuhmu. Tapi kalau terus diulang setiap hari, tubuh akan makin sulit diajak kerja sama.',
}

// ── Section 3 — Fear Wake-Up / Consequence (dark, intentional) ────────────────

export const fear = {
  headlineLines: [
    'Jangan bangga kuat begadang, kuat kopi, kuat makan telat.',
    'Tubuhmu bukan mesin. Sekali dia minta berhenti, hidupmu ikut berantakan.',
  ],
  bodyTop: [
    'Selama ini kamu mungkin merasa masih aman karena masih bisa kerja. Masih bisa meeting. Masih bisa balas chat. Masih bisa menyelesaikan target.',
    'Tapi tubuh tidak selalu memberi peringatan besar di awal.',
  ],
  // Slow escalation of small signals.
  escalation: [
    'Awalnya cuma perut tidak nyaman.',
    'Lalu begah makin sering.',
    'Tidur makin tidak pulih.',
    'Fokus kerja makin gampang pecah.',
    'Mood makin mudah turun.',
  ],
  bodyMid: [
    'Dan pagi hari dimulai dengan kopi lagi—bukan karena ingin, tapi karena badan sudah tidak siap jalan tanpa dorongan.',
    'Yang bahaya bukan satu kali begadang. Bukan satu kali makan telat. Bukan satu gelas kopi.',
    'Yang bahaya adalah ketika pola itu jadi gaya hidup, lalu kamu tetap berharap tubuh bekerja normal seperti mesin baru.',
  ],
  punch: 'Kalau tubuh sudah memaksa berhenti, yang terganggu bukan cuma kesehatan.',
  consequences: [
    'Pekerjaan ikut kacau.',
    'Bisnis ikut terganggu.',
    'Keluarga ikut repot.',
    'Biaya keluar.',
    'Waktu hilang.',
  ],
  closing:
    'Dan rutinitas yang selama ini kamu bangun bisa berantakan hanya karena kamu terlalu lama mengabaikan sinyal kecil.',
}

// ── Section 4 — Mindset Shift ─────────────────────────────────────────────────

export const mindset = {
  // VERIFIKASI: menyebut "maag" — pastikan cocok dengan klaim disetujui BPOM TI044511731.
  headline:
    'Yang kamu sebut “cuma maag” hari ini, bisa jadi cara tubuh menagih semua kebiasaan yang kamu anggap biasa.',
  normalized: [
    'Makan telat dianggap biasa.',
    'Kopi saat perut kosong dianggap biasa.',
    'Pedas dan gorengan malam-malam dianggap biasa.',
    'Snack manis dianggap biasa.',
    'Sayur tidak masuk berhari-hari dianggap biasa.',
    'Tidur larut dianggap biasa.',
  ],
  afterNormalized: 'Sampai tubuh akhirnya berhenti ikut kompromi.',
  costIntro: 'Masalahnya, banyak orang baru serius menjaga tubuh setelah biayanya mahal.',
  costs: [
    'Mahal waktu.',
    'Mahal tenaga.',
    'Mahal biaya recovery.',
    'Mahal kesempatan kerja yang lewat.',
    'Mahal karena saat kamu drop, hidup tidak otomatis berhenti menunggu kamu pulih.',
  ],
  bridge: [
    'Kamu tidak harus langsung hidup sempurna. Tapi kamu harus mulai berhenti membiarkan tubuh jalan seadanya.',
    'Mulai dari yang paling dasar: perbaiki dukungan nutrisi harianmu.',
  ],
}

// ── Section 5 — Introduce Supergreen Food ─────────────────────────────────────

export const introduce = {
  headline: 'Di sinilah Supergreen Food masuk akal.',
  body: [
    // VERIFIKASI: klaim fungsi — pastikan cocok dengan klaim disetujui BPOM TI044511731.
    'Supergreen Food adalah produk berbasis nutrisi hijau dari spirulina dan chlorella untuk membantu melengkapi asupan harian, terutama ketika pola makanmu belum ideal.',
    'Saat makanan lebih sering “asal kenyang”, sayur jarang masuk, dan rutinitas sehat selalu kalah oleh kesibukan, Supergreen Food bisa menjadi langkah kecil yang lebih mudah dijalani.',
  ],
  // VERIFIKASI: status registrasi BPOM — pastikan nomor & kategori benar (TI044511731).
  trustTitle: 'Supergreen Food terdaftar BPOM TI044511731 sebagai Obat Tradisional Impor (TI).',
  trustBody:
    'Artinya, Supergreen Food berada pada kategori obat tradisional impor, berbeda dari produk makanan impor biasa maupun suplemen vitamin biasa.',
  positioning:
    'Bukan alasan untuk makan sembarangan. Tapi langkah yang lebih masuk akal daripada membiarkan tubuh terus menanggung pola yang sama.',
}

// ── Section 6 — Fungsi SGF yang Relate (benefit cards) ────────────────────────
// VERIFIKASI (semua kartu): pastikan setiap klaim fungsi cocok dengan klaim disetujui BPOM TI044511731.

export const benefits = {
  headline: 'Supergreen Food membantu mendukung keseimbangan tubuhmu.',
  subheadline:
    'Dengan nutrisi hijau berkualitas dari spirulina & chlorella untuk membantu melengkapi asupan harianmu.',
  items: [
    {
      icon: 'Leaf',
      title: 'Membantu melengkapi nutrisi hijau harian',
      desc: 'Spirulina & chlorella kaya nutrisi alami yang sering kurang dari pola makan sehari-hari.',
    },
    {
      icon: 'Scale',
      title: 'Membantu mendukung keseimbangan tubuh',
      desc: 'Membantu tubuh tetap fit menjalani aktivitas dan menjaga ritme harian yang padat.',
    },
    {
      icon: 'HeartPulse',
      // VERIFIKASI: klaim "kesehatan pencernaan" — pastikan cocok dengan klaim disetujui BPOM TI044511731.
      title: 'Membantu mendukung kesehatan pencernaan',
      desc: 'Serat alami membantu melancarkan pencernaan dan menjaga rasa nyaman di perut.',
    },
    {
      icon: 'Zap',
      // VERIFIKASI: klaim "energi & fokus" — pastikan cocok dengan klaim disetujui BPOM TI044511731.
      title: 'Membantu menjaga energi & fokus',
      desc: 'Nutrisi alami untuk membantu tubuh tetap bertenaga dan pikiran lebih fokus sepanjang hari.',
    },
    {
      icon: 'ShieldCheck',
      // VERIFIKASI: klaim "daya tahan tubuh" — pastikan cocok dengan klaim disetujui BPOM TI044511731.
      title: 'Membantu mendukung daya tahan tubuh',
      desc: 'Kandungan antioksidan alami membantu tubuh lebih siap menghadapi aktivitas harian.',
    },
    {
      icon: 'Sparkles',
      // VERIFIKASI: klaim "kulit & rambut" — pastikan cocok dengan klaim disetujui BPOM TI044511731.
      title: 'Membantu menjaga kesehatan kulit & rambut',
      desc: 'Nutrisi hijau alami untuk membantu kulit tampak lebih segar dan rambut lebih sehat dari dalam.',
    },
  ],
  positioning: {
    title: 'Bukan alasan untuk makan sembarangan.',
    body: 'Supergreen Food adalah langkah kecil untuk mulai memperbaiki pola dukungan nutrisi harian, sambil tetap memperbaiki pola makan dan gaya hidup.',
  },
  // VERIFIKASI: nomor & kategori BPOM TI044511731
  bpom: {
    label: 'Terdaftar BPOM',
    number: 'TI044511731',
    category: 'sebagai OBAT TRADISIONAL IMPOR (TI)',
    note: 'Artinya berbeda dengan makanan impor (ML) atau suplemen kesehatan impor (SI).',
  },
  closingBand: {
    line1: 'Langkah kecil hari ini, dukungan besar untuk tubuhmu di masa depan.',
    line2: 'Mulai dari perbaiki dukungan nutrisi harianmu.',
  },
}

// ── Section 7 — Testimonials ──────────────────────────────────────────────────
// PLACEHOLDER — SEMUA testimoni di bawah WAJIB diganti dengan testimoni pelanggan ASLI
// sebelum publish. Produk Obat Tradisional terdaftar BPOM: testimoni harus nyata & berizin.
// Jangan render foto orang asli sampai ada izin + testimoni real (saat ini pakai inisial/avatar).

export const testimonials = {
  headlineLines: [
    'Mereka mulai bukan karena pola hidupnya sudah rapi.',
    'Mereka mulai karena tubuhnya sudah terlalu sering memberi tanda.',
  ],
  subheadline:
    'Setiap orang punya kondisi yang berbeda. Tapi banyak yang merasa lebih mudah memulai rutinitas sehat ketika langkahnya sederhana dan bisa dijalani setiap hari.',
  // photo/verified opsional — item berfoto dirender sebagai kartu varian foto + badge.
  items: [
    {
      quote:
        'Dulu saya sering makan telat, kopi terus, sayur jarang. Awalnya coba Supergreen Food karena sadar pola makan saya berantakan. Yang saya rasakan, jadi lebih mudah punya rutinitas kecil untuk jaga tubuh.',
      name: 'Robby',
      label: 'pekerja aktif',
      photo: '/assets/testimoni-supergreen-1.png',
      verified: true,
    },
    {
      quote:
        'Perut saya sering terasa tidak nyaman kalau makan sudah kacau. Supergreen Food bukan bikin saya bebas makan sembarangan, tapi membantu saya mulai lebih sadar memperhatikan asupan.',
      name: 'Miesye',
      label: 'Ibu Rumah Tangga',
      photo: '/assets/testimoni-supergreen-2.png',
      verified: true,
    },
    {
      quote:
        'Saya suka karena praktis. Kalau hari lagi padat dan makan tidak ideal, setidaknya ada satu kebiasaan baik yang tetap bisa saya jalani.',
      name: 'Alex',
      label: 'Content Creator',
      photo: '/assets/testimoni-supergreen-3.png',
      verified: true,
    },
    {
      quote:
        'Biasanya kalau sudah sibuk, makan saya asal banget. Supergreen Food membantu saya merasa punya langkah kecil untuk mulai memperbaiki rutinitas harian.',
      name: 'Tri',
      label: 'Forex Trader',
      photo: '/assets/testimoni-supergreen-4.png',
      verified: true,
    },
    {
      quote:
        'Saya bukan tipe yang rajin minum suplemen. Tapi ini terasa simpel, jadi lebih mudah masuk ke kebiasaan pagi saya.',
      name: 'Dini',
      label: 'Banker',
      photo: '/assets/testimoni-supergreen-5.png',
      verified: true,
    },
    {
      quote:
        'Jadwal sering memaksa saya menunda waktu makan. Sejak ada Supergreen Food, lambung saya tetap dapat bekerja sama dan aktivitas lancar. Saya selalu minum 2x sehari, pagi dan sore.',
      name: 'Widie',
      label: 'Pilates Trainer',
      photo: '/assets/testimoni-supergreen-6.png',
      verified: true,
    },
    {
      // VERIFIKASI: kuat menyiratkan menggantikan obat maag — pastikan aman terhadap
      // aturan iklan Obat Tradisional BPOM sebelum publish.
      quote:
        'Makanan pedas, seblak, bakso, gorengan ini aku suka bangett. Apalagi kalo stress target di kantor, malamnya maag-ku biasanya kumat dan aku minum obat maag. Untung dikenalin temen Supergreen Food, jadi aku beralih ke yang alami dan menyehatkan. Lambungku sekarang bisa diajak kompromi.',
      name: 'Neny',
      label: 'Marketing Otomotif',
      photo: '/assets/testimoni-supergreen-7.png',
      verified: true,
    },
    {
      // VERIFIKASI (RISIKO TINGGI): klaim konsumsi saat hamil & menyusui + tumbuh kembang
      // anak. Obat Tradisional umumnya justru wajib mencantumkan peringatan konsultasi
      // dokter untuk ibu hamil/menyusui — WAJIB cek label & aturan iklan OT BPOM
      // sebelum publish. Pertimbangkan hapus/ubah testimoni ini.
      quote:
        'Sejak kehamilanku, stress meningkat, suplemen kehamilan membuatku susah BAB dan uring-uringan. Aku tambahkan Supergreen Food untuk nutrisi kehamilanku — BAB lancar, kehamilan lancar, anakku tumbuh sehat dengan ASI eksklusif. Selama menyusui aku selalu tambahkan Supergreen Food sebagai nutrisi wajibku.',
      name: 'Yanti',
      label: 'Ibu Menyusui',
      photo: '/assets/testimoni-supergreen-8.png',
      verified: true,
    },
  ] as Array<{
    quote: string
    name: string
    label: string
    photo?: string
    verified?: boolean
  }>,
  disclaimer: 'Hasil nutrisi Supergreen Food dapat berbeda pada tiap individu.',
}

// ── Section 8 — Decision Pressure ─────────────────────────────────────────────

export const decision = {
  headlineLines: [
    'Mau mulai saat masih bisa memilih,',
    'atau nanti saat tubuh sudah memaksa?',
  ],
  // Satu kalimat = satu paragraf — ritme lambat dengan jeda, tiap kalimat dibiarkan
  // mengendap dulu sebelum kalimat berikutnya (gaya direct-response).
  body: [
    'Kalau tubuhmu mulai sering protes, jangan tunggu sampai hidupmu ikut terganggu.',
    'Saat badan tidak fit, fokus kerja turun.',
    'Saat pencernaan tidak nyaman, mood ikut berubah.',
    'Saat tidur tidak pulih, pagi dimulai dengan beban.',
    'Saat performa menurun, pekerjaan tidak menunggu kamu siap.',
    'Di kantor, selalu ada orang lain yang bisa menggantikan peranmu.',
    'Di bisnis, peluang tidak menunggu kamu selesai recovery.',
    'Di rumah, tanggung jawab tetap datang meski tubuhmu sedang tidak kuat.',
    'Yang paling mahal dari menunda bukan cuma biaya berobat.',
    'Yang mahal adalah waktu produktif yang hilang.',
    'Momentum yang lewat.',
    'Dan tubuh yang makin sulit diajak kembali.',
  ],
  cardWait: {
    title: 'Kalau terus tunggu nanti',
    items: [
      'Pola makan tetap berantakan',
      'Sayur tetap jarang masuk',
      'Perut makin sering protes',
      'Fokus kerja makin mudah pecah',
      'Tubuh tetap jalan seadanya',
    ],
  },
  cardStart: {
    title: 'Kalau mulai hari ini',
    items: [
      'Ada satu kebiasaan kecil yang bisa dijalani',
      'Tubuh mulai mendapat dukungan nutrisi hijau',
      'Rutinitas sehat terasa lebih mudah dimulai',
      'Kamu berhenti menunggu sampai semuanya terlambat',
    ],
  },
  ctaPrimary: 'Lihat Paket Mulai Jaga Diri',
  ctaSecondary: 'Saya mau tanya dulu',
}

// ── Section 9 — Why Buy at EVC ────────────────────────────────────────────────
// Catatan brief: JANGAN menyebut marketplace/Shopee/Tokopedia atau mendorong perbandingan channel.

export const whyEvc = {
  headline: 'Kenapa beli Supergreen Food di EVC Mercato?',
  subheadline:
    'Produk resmi original hanya melalui distributor resmi yang berizin dan terdaftar di perusahaan.',
  body: [
    'Mulai 13 April 2026, produk KKI Group, termasuk Supergreen Food, diarahkan untuk dipasarkan melalui jalur distributor resmi dan website resmi distributor.',
    'Karena itu, saat membeli Supergreen Food, jangan hanya melihat produk dari kemasannya saja. Pastikan kamu membeli dari jalur yang benar.',
    'Produk nutrisi bukan barang coba-coba. Produk ini masuk ke tubuhmu. Maka kejelasan sumber, penyimpanan, layanan, dan pertanggungjawaban menjadi penting.',
  ],
  positioning:
    'EVC Mercato hadir sebagai distributor resmi untuk membantu kamu membeli Supergreen Food dengan lebih jelas, aman, dan nyaman.',
  benefits: [
    {
      icon: 'BadgeCheck',
      title: 'Produk resmi original',
      desc: 'Dibeli melalui jalur distributor resmi yang terdaftar.',
    },
    {
      icon: 'ShieldCheck',
      title: 'Distributor resmi berizin',
      desc: 'EVC Mercato merupakan jalur resmi yang berizin dan terdaftar di perusahaan.',
    },
    {
      icon: 'Wallet',
      title: 'Harga terbaik',
      desc: 'EVC Mercato memberikan harga terbaik untuk pembelian resmi.',
    },
    {
      icon: 'Truck',
      title: 'Bebas ongkir seluruh Indonesia',
      desc: 'Belanja lebih ringan dengan layanan bebas ongkir ke seluruh Indonesia.',
    },
    {
      icon: 'MessageCircle',
      title: 'Bisa konsultasi dulu',
      desc: 'Kalau masih ragu, kamu bisa bertanya dulu dengan tim EVC.',
    },
    {
      icon: 'Gift',
      title: 'Benefit member & EVC Points',
      desc: 'Pembelian melalui website resmi dapat mengikuti promo, benefit member, dan EVC Points.',
    },
  ],
  closingIntro: 'Kalau kamu sudah memutuskan mulai menjaga tubuh, jangan setengah-setengah di langkah pembelian.',
  closingList: ['Pilih produk yang jelas.', 'Pilih jalur yang resmi.', 'Pilih layanan yang bisa dibantu.'],
  closingPunch: 'Beli Supergreen Food resmi original hanya melalui EVC Mercato.',
  ctaPrimary: 'Beli Resmi di EVC Mercato',
  ctaSecondary: 'Chat CS EVC',
  microcopy: 'Harga terbaik + bebas ongkir seluruh Indonesia.',
}

// ── Section 10 — Offer / Package ──────────────────────────────────────────────
// HARGA BELUM FINAL → paket generik, TANPA angka. Jangan mengarang harga.
// PLACEHOLDER — konfirmasi penawaran/bonus/nominal hemat real sebelum publish.

export const offer = {
  headline: 'Paket Mulai Jaga Diri',
  subheadline:
    'Untuk kamu yang pola makannya belum sempurna, tapi sudah tidak mau terus membiarkan tubuh jalan seadanya.',
  body: [
    'Kamu tidak harus langsung berubah total malam ini.',
    'Tapi kamu bisa mulai dari satu hal yang praktis: membantu tubuh mendapat nutrisi hijau harian yang selama ini sering terlewat.',
    'Paket Mulai Jaga Diri dibuat untuk membantu langkah pertama terasa lebih ringan.',
  ],
  // PLACEHOLDER — harga (priceOriginal/pricePromo), foto paket (photo), dan link CTA
  // per paket (ctaUrl) masih dummy. WAJIB diisi nilai real sebelum publish.
  packages: [
    {
      name: 'Paket Family',
      tagline: '700 tablet — rekomendasi terbaik untuk konsistensi.',
      badge: 'Rekomendasi Terbaik · Paling Hemat',
      recommended: true,
      priceOriginal: 'Rp 1.400.000',
      pricePromo: 'Rp 850.000',
      discountBadge: 'HEMAT 39%',
      photo: '/assets/sgf-paket-family.png',
      ctaUrl: 'https://shop.evcmercato.com/katalog/paket-family-supergreen-food-700-tablet',
      ctaLabel: 'Pilih Paket Family',
    },
    {
      name: 'Paket 60 Hari',
      tagline: '300 tablet — pilihan seimbang untuk mulai rutin.',
      badge: '',
      recommended: false,
      priceOriginal: 'Rp 600.000',
      pricePromo: 'Rp 480.000',
      discountBadge: 'HEMAT 20%',
      photo: '/assets/sgf-paket-60-hari.png',
      ctaUrl: 'https://shop.evcmercato.com/katalog/paket-hemat-60-hari-supergreen-food-300-tablet',
      ctaLabel: 'Pilih Paket 60 Hari',
    },
    {
      name: 'Paket Trial 30 Hari',
      tagline: '150 tablet — langkah awal untuk mulai mencoba.',
      badge: '',
      recommended: false,
      priceOriginal: 'Rp 300.000',
      pricePromo: 'Rp 260.000',
      discountBadge: 'HEMAT 13%',
      photo: '/assets/sgf-paket-trial.png',
      ctaUrl: 'https://shop.evcmercato.com/katalog/paket-trial-30-hari-supergreen-food-sgf-150-tablet',
      ctaLabel: 'Pilih Paket Trial 30 Hari',
    },
  ],
  benefitBox: [
    'Produk resmi original',
    'Harga terbaik',
    'Bebas ongkir seluruh Indonesia',
    'Benefit member / EVC Points',
    'Bisa konsultasi dulu',
    'Pengiriman aman',
  ],
  ctaPrimary: 'Mulai dengan Paket Jaga Diri',
  ctaSecondary: 'Tanya Dulu via WhatsApp',
  promoNote: 'Promo dapat berubah sesuai periode campaign dan ketersediaan stok.',
}

// ── Section 11 — FAQ + Cara Konsumsi ──────────────────────────────────────────

export const faq = {
  items: [
    {
      q: 'Apakah Supergreen Food hanya suplemen biasa?',
      // VERIFIKASI: nomor & kategori BPOM TI044511731.
      a: 'Tidak. Supergreen Food memiliki izin edar BPOM TI044511731, dengan kategori Obat Tradisional Impor. Artinya, Supergreen Food berada pada kategori obat tradisional impor, berbeda dari produk makanan impor biasa maupun suplemen vitamin biasa. Produk ini digunakan sebagai bagian dari pendekatan tradisional untuk membantu mendukung keseimbangan tubuh dan rutinitas kesehatan harian.',
    },
    {
      q: 'Apakah Supergreen Food bisa membantu keluhan akibat pola makan berantakan?',
      // VERIFIKASI: klaim fungsi & menyebut area pencernaan — cocokkan dengan klaim disetujui BPOM TI044511731.
      a: 'Supergreen Food dapat digunakan untuk membantu mendukung tubuh saat pola makan harian sering tidak ideal—misalnya makan telat, kurang sayur, konsumsi kopi berlebihan, makanan pedas, gorengan, dan rutinitas tidur yang tidak teratur. Pada banyak orang, pola seperti ini dapat membuat tubuh terasa tidak nyaman, termasuk area pencernaan. Supergreen Food membantu memberi dukungan dari sisi asupan hijau harian agar tubuh tidak terus dibiarkan berjalan tanpa dukungan.',
    },
    {
      q: 'Apakah Supergreen Food cocok untuk lambung yang sensitif?',
      // VERIFIKASI: menyebut lambung sensitif/maag/asam lambung/GERD — cocokkan dengan klaim disetujui BPOM TI044511731.
      a: 'Supergreen Food sering dipilih oleh orang yang ingin mulai memperbaiki pola dukungan tubuh dari dalam, terutama saat pola makan masih sering berantakan. Untuk kamu yang memiliki lambung sensitif, maag, asam lambung, atau GERD, pendekatan terbaik tetap dimulai dari memperbaiki pola makan: jangan sering telat makan, kurangi pemicu pribadi, atur kopi, kurangi makanan pedas/berminyak, dan bantu tubuh dengan asupan yang lebih baik. Supergreen Food dapat menjadi bagian dari rutinitas tersebut sebagai produk obat tradisional impor yang membantu mendukung keseimbangan tubuh.',
    },
    {
      q: 'Apakah Supergreen Food menggantikan pola makan sehat?',
      a: 'Tidak. Supergreen Food bukan alasan untuk terus makan sembarangan. Justru Supergreen Food paling masuk akal digunakan sebagai langkah awal untuk mulai memperbaiki rutinitas harian—sambil tetap mengurangi kebiasaan yang membebani tubuh, seperti makan telat, kopi berlebihan, gorengan, pedas malam hari, kurang sayur, dan tidur larut.',
    },
    {
      q: 'Bagaimana cara konsumsi Supergreen Food?',
      // VERIFIKASI: aturan pakai/dosis — cocokkan dengan aturan pakai resmi pada kemasan / BPOM TI044511731.
      a: 'Supergreen Food dapat dikonsumsi saat perut kosong. Dewasa: 5–10 tablet per hari, dibagi menjadi 1–2 kali konsumsi. Waktu konsumsi yang disarankan: pagi dan/atau malam saat perut kosong. Anak-anak: 3–6 tablet per hari, dibagi menjadi 1–2 kali konsumsi. Waktu konsumsi yang disarankan: pagi dan/atau malam saat perut kosong. Untuk anak-anak, orang tua disarankan menyesuaikan dengan kondisi tubuh anak dan memulai secara bertahap bila diperlukan.',
    },
    {
      q: 'Kapan waktu konsumsi yang disarankan?',
      a: 'Ikuti aturan konsumsi pada kemasan atau panduan resmi produk. Untuk hasil yang lebih baik, konsumsi perlu dibarengi dengan perbaikan pola makan dan rutinitas harian.',
    },
    {
      q: 'Kalau sudah sering maag atau asam lambung, apakah cukup minum Supergreen Food saja?',
      // VERIFIKASI: menyebut maag/asam lambung — cocokkan dengan klaim disetujui BPOM TI044511731.
      a: 'Tidak cukup kalau pola makan tetap dihajar setiap hari. Kalau makan masih sering telat, kopi tetap berlebihan, pedas dan gorengan tetap jalan terus, tidur tetap larut, maka tubuh tetap akan menanggung beban yang sama. Supergreen Food dapat menjadi bagian dari langkah awal untuk membantu tubuh, tetapi perubahan kebiasaan tetap penting.',
    },
    {
      q: 'Kenapa sebaiknya beli di EVC Mercato?',
      a: 'Karena produk resmi original sebaiknya dibeli melalui distributor resmi yang berizin dan terdaftar di perusahaan. EVC Mercato menyediakan Supergreen Food resmi original dengan harga terbaik, bebas ongkir ke seluruh Indonesia, dan layanan konsultasi jika kamu ingin bertanya sebelum membeli.',
    },
    {
      q: 'Ingin tahu manfaat Supergreen Food lainnya untuk kesehatanmu?',
      // VERIFIKASI: klaim "banyak manfaat / berbagai keluhan kesehatan" — cocokkan dengan klaim disetujui BPOM TI044511731.
      a: 'Tablet Supergreen Food memiliki banyak manfaat untuk mendukung kesehatan tubuh dan sering digunakan untuk berbagai keluhan kesehatan lainnya. Karena setiap orang memiliki kondisi tubuh, pola makan, dan kebutuhan yang berbeda, kamu bisa konsultasi dulu sebelum membeli. Chat CS EVC atau cek dulu ke Evie Agent untuk mendapatkan arahan yang lebih sesuai dengan kebutuhanmu.',
    },
  ],
}

// ── Section 12 — Final CTA + Disclaimer ───────────────────────────────────────

export const finalCta = {
  headline: 'Jangan tunggu tubuh benar-benar tumbang baru mulai peduli.',
  body: [
    'Kalau pola makanmu masih sering berantakan, kopi masih jadi pegangan utama, sayur masih jarang masuk, dan tubuh sudah mulai sering memberi tanda…',
    'mungkin ini waktunya berhenti menunda.',
    'Mulai dari langkah kecil. Mulai dari yang praktis. Mulai dari nutrisi hijau harian bersama Supergreen Food.',
  ],
  ctaPrimary: 'Beli Resmi di EVC Mercato',
  ctaSecondary: 'Konsultasi Dulu via WhatsApp',
  emotionalLine: 'Tubuhmu sudah terlalu lama dipaksa kuat. Sekarang giliran kamu mulai membantunya.',
  // VERIFIKASI: disclaimer BPOM TI044511731 — pastikan kategori & nomor benar.
  disclaimer:
    'Supergreen Food terdaftar BPOM TI044511731 sebagai produk Obat Tradisional Impor. Hasil penggunaan dapat berbeda pada setiap individu, tergantung kondisi tubuh, pola makan, dan konsistensi rutinitas harian. Untuk keluhan berat atau kondisi medis khusus, tetap gunakan pertimbangan tenaga kesehatan.',
}
