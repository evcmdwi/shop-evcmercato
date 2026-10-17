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
  { label: 'Harga', marketplace: { main: 'Lebih tinggi 20%' }, evc: { main: 'Sesuai ketentuan', sub: 'Ada diskon' } },
  { label: 'EVC Points', marketplace: { main: 'Tidak ada' }, evc: { main: 'Ada', sub: 'Tukar produk gratis' } },
  {
    label: 'Kecepatan kirim',
    marketplace: { main: 'Instan / Reguler SPX', sub: 'Lebih lama' },
    evc: { main: 'J&T, JNE, Grab', sub: 'Lebih cepat' },
  },
  { label: 'Tanya produk / beli', marketplace: { main: 'Dibalas AI toko' }, evc: { main: 'WA Admin', sub: 'Fast response' } },
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
  { title: 'Pilih produk & bayar', desc: 'QRIS, virtual account, OVO, kartu kredit, atau minimarket.' },
  { title: 'Lacak pesanan & kumpulkan poin', desc: 'Status kiriman dan EVC Points tercatat otomatis di akun Anda.' },
]

export const PAYMENT_METHODS = [
  'QRIS', 'Virtual Account', 'BCA', 'Mandiri', 'BNI', 'Permata', 'OVO', 'Visa', 'Mastercard', 'JCB', 'Alfamart', 'Indomaret',
]
// EVC tidak melayani COD — jangan tambahkan COD di mana pun.
export const COURIERS: { label: string; items: string[] }[] = [
  { label: 'Instan / Sameday', items: ['Grab'] },
  { label: 'Reguler', items: ['J&T', 'JNE'] },
]
