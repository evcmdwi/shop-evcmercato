import Link from 'next/link'
import Image from 'next/image'
import FAQSection from '@/components/FAQSection'

// Stats data
const stats = [
  { number: '36.000+', label: 'Transaksi Berhasil' },
  { number: '32.000+', label: '★ Reviews Marketplace', starStat: true },
  { number: '23 Tahun', label: 'Pengalaman Sejak 2003' },
  { number: '30', label: 'Hub Pengiriman' },
]

// Trust cards
const trustCards = [
  {
    icon: '🚚',
    iconColor: 'text-[#7FB300]',
    title: 'KIRIMAN PRIORITAS',
    body: 'Instan / Same-day di 30 kota Indonesia.\nNext-day / Reguler ke seluruh Indonesia.\nLEBIH cepat dibanding Marketplace.',
    border: 'border-gray-200',
  },
  {
    icon: '🎁',
    iconColor: 'text-amber-500',
    title: 'EVC POINTS',
    body: 'Produk GRATIS untuk penukaran EVC Points Anda.\nRp 1.000 = 1 EVC Points',
    border: 'border-amber-200',
  },
  {
    icon: '✓',
    iconColor: 'text-[#7FB300]',
    title: 'ORIGINAL & TERPERCAYA',
    body: 'Distributor resmi KKI Group sejak 2003.\n23 Tahun membangun kepercayaan.',
    border: 'border-gray-200',
  },
]

// Category icons
const categories = [
  { name: 'Natesh', slug: 'natesh', emoji: '🩱' },
  { name: 'Fitsol', slug: 'fitsol', emoji: '💊' },
  { name: 'Suplemen', slug: 'suplemen', emoji: '🌿' },
  { name: 'Kecantikan', slug: 'kecantikan', emoji: '✨' },
  { name: 'Lihat Semua', slug: '', emoji: '🛍️' },
]

// FAQ
const faqs = [
  {
    q: 'Bagaimana cara pemesanan di EVC Mercato?',
    a: 'Pilih produk → Tambah ke Keranjang → Checkout → Pilih metode pembayaran. Setelah pembayaran berhasil, pesanan akan diproses dan dikirim sesuai estimasi.',
  },
  {
    q: 'Berapa lama pengiriman ke alamat saya?',
    a: 'Untuk 30 kota di Hub EVC: tersedia instan / same-day. Next-day maupun Reguler untuk kota lain di Indonesia: 1-4 hari kerja melalui partner JNE/JNT.',
  },
  {
    q: 'Bagaimana cara mendapat dan menggunakan EVC Points?',
    a: 'Setiap pembelian Rp 1.000 = 1 EVC Point otomatis masuk akun Anda. Tukar Points dengan produk pilihan di halaman "Tukar Points" (login required).',
  },
  {
    q: 'Apakah produk dijamin original?',
    a: '100% original. EVC Mercato adalah distributor resmi KKI Group sejak 2003. Setiap produk dikirim langsung dari gudang resmi dengan packaging segel.',
  },
  {
    q: 'Bisa dikembalikan jika produk tidak sesuai?',
    a: 'Bisa, dalam 7 hari sejak diterima dengan syarat produk belum dipakai dan kemasan utuh. Detail di halaman Kebijakan Pengembalian.',
  },
]

// Payment & shipping
const paymentMethods = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'Permata', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Visa', 'Mastercard', 'JCB', 'Alfamart', 'Indomaret']
const shippingMethods = ['JNE', 'JNT', 'Grab Express', 'Gojek']

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#E8F4D1] to-[#F0FDF4] py-16 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Belanja Nyaman Terpercaya,<br />Sejak 2003
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 font-medium mb-10">
          Kiriman LEBIH Cepat untuk Anda ⚡
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#7FB300]">{s.number}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {'starStat' in s && s.starStat ? (
                  <>5 ⭐️ Review di Marketplace</>
                ) : s.label}
              </p>
            </div>
          ))}
        </div>

        <Link href="/katalog" className="inline-flex items-center gap-2 bg-[#7FB300] hover:bg-[#6B9700] text-white font-bold text-lg px-8 py-4 rounded-full transition-all hover:scale-105 hover:shadow-lg">
          Mulai Belanja Sekarang
        </Link>
      </section>

      {/* KENAPA EVC - 4 CARDS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">KENAPA BELANJA DI EVC?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cards 1-3 */}
            {trustCards.map(card => (
              <div key={card.title} className={`bg-white border ${card.border} rounded-2xl p-6 hover:shadow-md transition-shadow`}>
                <div className="flex flex-col items-center text-center">
                  <div className={`text-5xl mb-4 ${card.iconColor}`}>{card.icon}</div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{card.body}</p>
                </div>
              </div>
            ))}

            {/* Card 4 — Evie Health: Full poster, clickable */}
            <a
              href="https://t.me/evie_evc_bot?start=6285820852908"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden hover:scale-105 transition-all hover:shadow-xl cursor-pointer"
            >
              <div className="relative w-full" style={{ minHeight: '280px' }}>
                <Image
                  src="/evie-health-reference.jpg"
                  alt="Evie Health — Konsultasi Kesehatan 24 Jam"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              <div className="bg-white py-2 px-3 text-center">
                <p className="text-sm text-gray-500 italic">Klik gambar untuk memulai konsultasi</p>
              </div>
            </a>
          </div>

          {/* CTA bawah */}
          <div className="text-center mt-12">
            <Link href="/katalog" className="inline-flex items-center gap-2 bg-[#7FB300] hover:bg-[#6B9700] text-white font-bold text-lg px-8 py-4 rounded-full transition-all hover:scale-105 hover:shadow-lg">
              MULAI BELANJA SEKARANG
            </Link>
          </div>
        </div>
      </section>

      {/* JELAJAHI PRODUK */}
      <section className="py-16 px-4 bg-[#F9FAFB]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">JELAJAHI PRODUK</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {categories.map(cat => (
              <Link
                key={cat.name}
                href={cat.slug ? `/katalog?category=${cat.slug}` : '/katalog'}
                className="flex flex-col items-center group"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E8F4D1] border-4 border-[#7FB300] flex items-center justify-center group-hover:scale-105 group-hover:shadow-lg transition-all">
                  <span className="text-xs sm:text-sm font-bold text-[#5B8400] text-center px-1 leading-tight">{cat.name}</span>
                </div>

              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection faqs={faqs} />

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          <div>
            <h3 className="font-bold text-gray-900 mb-4">💬 CHAT CS</h3>
            <div className="space-y-2 text-sm">
              <a href="https://wa.me/6285820852908" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-[#7FB300]">
                📱 +62 858-2085-2908
              </a>
              <a href="mailto:cs@evcmercato.com" className="flex items-center gap-2 text-gray-600 hover:text-[#7FB300]">
                ✉️ cs@evcmercato.com
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">💳 PEMBAYARAN</h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map(m => (
                <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{m}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Powered by Xendit</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">🚚 PENGIRIMAN</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {shippingMethods.map(m => (
                <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{m}</span>
              ))}
            </div>
            <h3 className="font-bold text-gray-900 mb-2">📱 IKUTI KAMI</h3>
            <a href="https://instagram.com/evcmercato" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-[#7FB300]">
              📸 @evcmercato
            </a>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">⚖️ LEGAL</h3>
            <div className="space-y-2 text-sm">
              <Link href="/privacy" prefetch={false} className="block text-gray-600 hover:text-[#7FB300]">Kebijakan Privasi</Link>
              <Link href="/syarat-ketentuan" prefetch={false} className="block text-gray-600 hover:text-[#7FB300]">Syarat &amp; Ketentuan</Link>
              <Link href="/return-policy" prefetch={false} className="block text-gray-600 hover:text-[#7FB300]">Kebijakan Pengembalian</Link>
            </div>
          </div>
        </div>

        {/* Disclosure Banner — di bawah LEGAL, sebelum copyright */}
        <div className="max-w-6xl mx-auto px-4 pb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex gap-2">
              <span className="text-amber-600 flex-shrink-0 text-xs mt-0.5">ℹ️</span>
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">INFORMASI PENTING</p>
                <p>
                  shop.evcmercato.com dikelola secara independen oleh <strong>Mitra Usaha Resmi KKI Group (KKD 12081020)</strong>.
                  Website ini <strong>BUKAN</strong> merupakan official store KKI Group.
                </p>
                <p className="mt-1">
                  Pembelian di sini tidak memberikan fasilitas member KKI (PV, BV, PR, komisi).
                  Untuk menjadi member KKI, daftar langsung ke KKI Group resmi.
                </p>
                <p className="mt-1.5">
                  <Link href="/syarat-ketentuan" prefetch={false} className="text-[#7FB300] font-semibold hover:underline">
                    Baca selengkapnya di Syarat &amp; Ketentuan →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#F9FAFB] border-t border-gray-200 py-4 text-center">
          <p className="text-xs text-gray-400">© 2026 EVC Mercato — Mitra Usaha Resmi KKI Group (KKD 12081020). Website ini bukan merupakan official store KKI Group.</p>
        </div>
      </footer>
    </div>
  )
}
