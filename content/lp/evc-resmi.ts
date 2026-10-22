/**
 * EVC Resmi — Landing Page v2 (/lp/evc-resmi). Brief: BRIEF_LP_EVC_RESMI_V2 (22 Okt 2026).
 * Sasaran: pelanggan Shopee/Tokopedia yang kehilangan akses produk KKI.
 * Versi lama: content/lp/evc-resmi-v1.ts (/lp/evc-resmi-v1, Archived).
 *
 * TIDAK ADA HARGA DI SINI — harga produk diambil dari database (lib/lp/evc-resmi.ts).
 * Angka marketplace & screenshot ulasan diisi dari Sambers › Landing Pages › Edit angka
 * (site_settings `lp_content:evc-resmi`); nilai di bawah hanya bawaan.
 *
 * JANGAN sebut besaran diskon VIP (aturan KKI), nama vendor payment gateway, atau COD
 * sebagai keunggulan.
 */

export const meta = {
  title: 'Produk KKI Hilang dari Shopee & Tokopedia? Beli di Distributor Resminya | EVC Mercato',
  description:
    'EVC Mercato, Mitra Usaha Resmi KKI Group sejak 2003 (KKD 12081020). Natesh, Fitsol, Pearl Cream, SuperGreen Food original, dikirim ke seluruh Indonesia.',
  ogImage: 'https://evcmercato.com/assets/evc-resmi-hero-produk.webp',
  url: 'https://evcmercato.com/lp/evc-resmi',
}

export const WA_NUMBER = '6285820852908'

/** Konteks tombol WA umum → kode ref `resmi-{konteks}`. */
export type WaContext = 'header' | 'hero' | 'penutup' | 'sticky'

export function waGeneralText(context: WaContext): string {
  return `Halo Admin EVC, saya lihat iklan EVC Mercato dan mau tanya produk KKI. [ref: resmi-${context}]`
}

export const waVipText =
  'Halo Admin EVC, saya pelanggan toko EVC Mercato di Shopee/Tokopedia dan mau klaim undangan VIP. Akun Shopee/Tokopedia saya: ... [ref: resmi-vip]'

// ─── Angka marketplace (bisa diedit di admin) ───────────────────────

export const CONTENT_SETTING_KEY = 'lp_content:evc-resmi'

/** Semua teks bebas (mis. "23,3 rb") — ditampilkan apa adanya. */
export const statDefaults = {
  totalReviews: '32 rb+',
  rating: '5.0',
  shopeeYears: '4',
  shopeeChat: '99%',
  shopeeRatings: '23,3 rb',
  shopeeFollowers: '2,7 rb',
  tokopediaReviews: '9.249',
  tokopediaSold: '43 rb+',
}
export type StatKey = keyof typeof statDefaults

export const statLabels: Record<StatKey, string> = {
  totalReviews: 'Total ulasan gabungan (hero)',
  rating: 'Rating bintang',
  shopeeYears: 'Lama di Shopee (tahun)',
  shopeeChat: 'Performa chat Shopee',
  shopeeRatings: 'Jumlah penilaian Shopee',
  shopeeFollowers: 'Pengikut Shopee',
  tokopediaReviews: 'Jumlah ulasan Tokopedia',
  tokopediaSold: 'Produk terjual Tokopedia',
}

export const MAX_SCREENSHOTS = 4

// ─── Produk (urutan tetap — 85% pembeli web adalah Natesh) ─────────

export const products: { id: string; label: string; popular?: boolean; wide?: boolean }[] = [
  { id: 'd821dc72-9a5f-4404-be45-066af1256164', label: 'Natesh Pantyliner', popular: true },
  { id: '650b1995-cc69-42b2-bb77-090af9e543e8', label: 'Natesh Day', popular: true },
  { id: '20032496-ac87-4e00-b930-23bd3499bd7f', label: 'Natesh Night', popular: true },
  { id: '4ef1f896-091b-435e-8548-3f7b50695bb4', label: 'Natesh Night Extra Long', popular: true },
  { id: '9dbac7be-eccd-47df-a89a-870d3ce2e455', label: 'Fitsol Set (CN, CE, CM)' },
  { id: '21128a31-597c-4530-9c5e-8b261822af77', label: 'Pearl Cream Kristine Ko Kool' },
  { id: '62caf1eb-096f-4830-a01a-2239b4ef8d4b', label: 'SuperGreen Food · Trial 30 hari', wide: true },
]

// ─── Teks halaman ───────────────────────────────────────────────────

export const hero = {
  headline: 'Produk KKI hilang dari Shopee & Tokopedia? Beli langsung di distributor resminya.',
  sub: 'Mitra Usaha Resmi KKI Group sejak 2003 · KKD 12081020. Produk original, dikirim ke seluruh Indonesia.',
  proofSub: 'Toko EVC Mercato di Shopee & Tokopedia · Star+ Seller',
  ctaPrimary: 'Cari produk saya',
  ctaWa: 'Tanya admin dulu',
  imageAlt: 'Kemasan asli Natesh, Fitsol CN CE CM, SuperGreen Food, dan Pearl Cream Kristine Ko Kool',
}

export const why = {
  headline: 'Kenapa produknya hilang dari marketplace?',
  // **…** ditebalkan.
  paragraphs: [
    'Sejak **15 Januari 2026**, **PP Nomor 3 Tahun 2026** melarang produk penjualan langsung (MLM) dijual di marketplace. KKI Group kemudian resmi melarang distributornya berjualan di marketplace.',
    '**Produknya tetap asli dan tetap diproduksi.** Yang berubah hanya tempat belinya. Sekarang kamu bisa membelinya langsung di web resmi distributor seperti kami.',
  ],
  linkText: 'Baca PP No. 3 Tahun 2026',
  linkUrl: 'https://www.peraturan.go.id/files/pp-no-3-tahun-2026.pdf',
}

/** {shopeeYears} & {shopeeChat} diganti angka dari admin. */
export const about = {
  headline: 'Siapa kami',
  facts: [
    { label: 'Kemitraan', title: 'Mitra Usaha Resmi KKI Group', note: 'KKD 12081020' },
    { label: 'Pengalaman', title: 'Sejak 2003', note: '23 tahun menjual produk KKI' },
    { label: 'Badan hukum', title: 'CV EVC Nusantara Sukses', note: 'Jakarta' },
    { label: 'Marketplace', title: '{shopeeYears} tahun di Shopee', note: 'Star+ Seller · chat {shopeeChat}' },
  ],
}

export const stores = {
  headline: 'Toko kami di marketplace. Cek sendiri.',
  sub: 'Pelanggan yang sama, sekarang belanja di web resmi kami.',
  shopee: { url: 'https://shopee.co.id/evc_mercato', name: 'EVC Mercato di Shopee' },
  tokopedia: { url: 'https://www.tokopedia.com/evcm', name: 'EVC Mercato di Tokopedia' },
  screenshotsAlt: 'Screenshot ulasan asli pembeli di toko EVC Mercato (nama disamarkan)',
}

export const vip = {
  chip: 'Khusus pelanggan lama',
  headline: 'Pernah belanja di toko EVC di Shopee atau Tokopedia? Kamu langsung jadi VIP Member.',
  body: 'Biasanya harus belanja minimal Rp500.000 dulu. Untuk pelanggan lama kami, undangan VIP langsung diberikan, dengan harga khusus member.',
  cta: 'Klaim undangan VIP via WhatsApp',
  note: 'Sebutkan nama akun Shopee/Tokopedia kamu, admin akan mengecek riwayat belanjamu.',
}

export const productSection = {
  headline: 'Produk yang biasa kamu beli',
  allLink: 'Semua produk',
  body: 'Harga jelas tanpa syarat: tidak wajib paylater, bukan promo khusus pengguna baru, dan bisa dikirim instan. VIP Member lebih hemat lagi.',
  popularLabel: 'Paling sering dibeli',
  cta: 'Beli',
}

export const safety = {
  headline: 'Belanja di sini tetap aman',
  items: [
    { title: 'Transaksi dengan badan hukum resmi', body: 'CV EVC Nusantara Sukses, Mitra Usaha Resmi KKI Group.' },
    {
      title: 'Bayar lewat payment gateway resmi',
      body: 'Virtual account, e-wallet, QRIS, atau minimarket. Tidak ada transfer ke rekening pribadi.',
    },
    { title: 'Jaminan produk original', body: 'Semua produk resmi KKI Group.' },
    { title: 'Kendala pengiriman diselesaikan cepat', body: 'Resi bisa dilacak. Ada masalah? Admin langsung bantu.' },
    { title: 'Chat admin fast response', body: 'Senin–Sabtu, 09.00–17.00 WITA, dibalas orang.' },
  ],
}

export const howTo = {
  headline: 'Cara belanja',
  steps: ['Daftar dengan nomor WhatsApp', 'Pilih produk & bayar', 'Lacak pesanan & kumpulkan EVC Points'],
}

export const faq = [
  {
    q: 'Ini resmi atau penipuan?',
    a: 'Kami Mitra Usaha Resmi KKI Group (KKD 12081020) sejak 2003, berbadan hukum CV EVC Nusantara Sukses. Toko kami di Shopee dan Tokopedia bisa kamu cek sendiri di atas.',
  },
  {
    q: 'Kenapa tidak jualan di Shopee/Tokopedia lagi?',
    a: 'PP Nomor 3 Tahun 2026 melarang produk MLM dijual di marketplace, dan KKI Group melarang distributornya berjualan di sana.',
  },
  {
    q: 'Harga di marketplace kadang terlihat lebih murah?',
    a: 'Harga promo marketplace biasanya bersyarat: wajib paylater, khusus pengguna baru, atau tidak bisa instan. Harga di sini berlaku tanpa syarat, dan VIP Member lebih hemat lagi.',
  },
  {
    q: 'Bisa COD?',
    a: 'Belum. Pembayaran lewat payment gateway resmi, sehingga transaksimu tercatat dan aman.',
  },
  {
    q: 'Kalau barang bermasalah atau tidak sampai?',
    a: 'Hubungi admin lewat WhatsApp dengan nomor pesanan. Kendala pengiriman kami selesaikan secepatnya.',
  },
]

export const closing = {
  headline: 'Ragu? Tanya admin. Dibalas orang, bukan bot.',
  ctaPrimary: 'Cari produk saya',
  ctaWa: 'Chat admin via WhatsApp',
  hours: 'Senin–Sabtu, 09.00–17.00 WITA',
}

export const footer = {
  text: 'Dikelola CV EVC Nusantara Sukses, Mitra Usaha Resmi KKI Group (KKD 12081020) sejak 2003. Website ini bukan official store KKI Group; pembelian di sini tidak termasuk fasilitas member KKI (PV/BV).',
  termsUrl: 'https://shop.evcmercato.com/terms',
  privacyUrl: 'https://shop.evcmercato.com/privacy-policy',
}
