// Isi teks beranda (shop.evcmercato.com) — ubah di sini, tanpa menyentuh komponen.

export const WA_ADMIN_URL = 'https://wa.me/6285820852908'

/**
 * Penawaran pesanan pertama. Kosongkan ('') untuk menyembunyikan kalimatnya —
 * kartu sambutan tetap tampil dengan judul + tombol. Logika bonusnya di checkout
 * BELUM ada; jangan isi sebelum aturannya diputuskan.
 * Bagian di antara **…** ditebalkan.
 */
export const FIRST_ORDER_OFFER_TEXT = ''

/**
 * Urutan manual "Paling sering dibeli ulang" (slug produk, mis. 'natesh-day-pembalut-siang-24cm').
 * Kosong = otomatis: pembeli ulang terbanyak dari pesanan web, lalu angka terjual.
 */
export const FEATURED_PRODUCT_SLUGS: string[] = []

export type CompareCell = { main: string; sub?: string }
export const COMPARISON_ROWS: { label: string; marketplace: CompareCell; evc: CompareCell }[] = [
  { label: 'Harga', marketplace: { main: 'Sama' }, evc: { main: 'Sama' } },
  { label: 'EVC Points', marketplace: { main: 'Tidak ada' }, evc: { main: 'Ada', sub: 'Tukar produk gratis' } },
  {
    label: 'Kecepatan kirim',
    marketplace: { main: 'Instan / Reguler SPX', sub: 'Lebih lama' },
    evc: { main: 'J&T, JNE, Grab', sub: 'Lebih cepat' },
  },
  { label: 'Tanya produk', marketplace: { main: 'Chat toko' }, evc: { main: 'WA admin', sub: 'Langsung dijawab' } },
]

export const NEED_CARDS: { title: string; desc: string; href: string }[] = [
  { title: 'Kewanitaan', desc: 'Pembalut & pantyliner Natesh', href: '/katalog?category=natesh' },
  { title: 'Nutrisi harian', desc: 'SGF, Vitayang, susu kedelai', href: '/katalog?category=suplemen' },
  { title: 'Perawatan wajah', desc: 'Kristine Ko, Glanz, Beautyzen', href: '/katalog?category=kecantikan' },
  { title: 'Paket hemat', desc: 'Stok 30–60 hari, lebih irit', href: '/katalog?q=paket' },
]

export const SIGNUP_STEPS: { title: string; desc: string }[] = [
  // Form daftar saat ini: nama, No. WA, email, password. Ubah teks ini bila alurnya dipersingkat.
  { title: 'Daftar dengan nomor WhatsApp', desc: 'Isi nama, nomor WA, email, dan password — kurang dari satu menit.' },
  { title: 'Pilih produk & bayar', desc: 'Transfer, e-wallet, minimarket, atau COD lewat admin.' },
  { title: 'Lacak pesanan & kumpulkan poin', desc: 'Status kiriman dan EVC Points tercatat otomatis di akun Anda.' },
]

export const PAYMENT_METHODS = [
  'BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'Alfamart', 'Indomaret', 'COD via admin',
]
export const COURIERS = ['J&T Express', 'JNE', 'Grab Express (same-day)']
