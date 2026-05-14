import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'FAQ — Pertanyaan yang Sering Ditanyakan | EVC Mercato',
  description: 'Temukan jawaban atas pertanyaan umum tentang produk, pengiriman, pembayaran, return, dan akun di EVC Mercato.',
}

const faqData = [
  {
    category: '🛍️ Tentang Produk',
    items: [
      {
        q: 'Apakah produk di EVC Mercato original?',
        a: 'Ya, semua produk kami adalah produk original yang bersumber langsung dari KKI Group. EVC Mercato adalah Mitra Usaha Resmi KKI Group (KKD 12081020) yang beroperasi sejak 2003.',
      },
      {
        q: 'Apakah ada masa kedaluwarsa yang perlu diperhatikan?',
        a: 'Semua produk yang kami kirimkan memiliki masa kedaluwarsa minimal 6 bulan dari tanggal pengiriman. Informasi kedaluwarsa tertera pada kemasan produk.',
      },
      {
        q: 'Bagaimana cara mengetahui detail produk sebelum membeli?',
        a: 'Setiap halaman produk menyertakan deskripsi lengkap, komposisi, cara pemakaian, dan gambar produk. Anda juga bisa menghubungi CS kami untuk konsultasi produk.',
      },
      {
        q: 'Apakah EVC Mercato adalah official store KKI Group?',
        a: 'EVC Mercato adalah Mitra Usaha Resmi KKI Group, bukan official store pusat KKI Group. Pembelian di sini tidak memberikan fasilitas member KKI (PV, BV, PR, komisi). Produk yang kami jual adalah produk KKI Group asli.',
      },
    ],
  },
  {
    category: '🚚 Pengiriman',
    items: [
      {
        q: 'Berapa lama estimasi pengiriman?',
        a: 'Pengiriman reguler 1–3 hari kerja untuk Jawa-Bali, 3–5 hari kerja untuk luar Jawa. Sameday tersedia untuk area Balikpapan dan sekitarnya (pemesanan sebelum pukul 12.00 WITA).',
      },
      {
        q: 'Kurir apa yang digunakan?',
        a: 'Kami menggunakan JNT Express sebagai kurir utama, serta Grab Express untuk pengiriman sameday area Balikpapan.',
      },
      {
        q: 'Bagaimana cara melacak pesanan saya?',
        a: 'Login ke akun Anda → menu Pesanan → pilih pesanan yang ingin dilacak. Nomor resi akan tersedia setelah pesanan dikirim. Anda juga akan mendapat notifikasi WhatsApp/email.',
      },
      {
        q: 'Apa yang harus dilakukan jika paket tidak sampai?',
        a: 'Hubungi CS kami via WhatsApp +62 858-2085-2908 dengan menyertakan nomor pesanan. Kami akan membantu investigasi dengan pihak kurir.',
      },
    ],
  },
  {
    category: '💳 Pembayaran',
    items: [
      {
        q: 'Metode pembayaran apa yang tersedia?',
        a: 'Kami menerima transfer bank (BCA, BRI, Mandiri, BNI), virtual account, QRIS, GoPay, OVO, Dana, dan kartu kredit/debit Visa/Mastercard melalui Xendit.',
      },
      {
        q: 'Berapa lama link pembayaran berlaku?',
        a: 'Link pembayaran berlaku selama 24 jam sejak pesanan dibuat. Pesanan yang tidak dibayar setelah 24 jam akan otomatis dibatalkan.',
      },
      {
        q: 'Apakah pembayaran di EVC Mercato aman?',
        a: 'Ya. Semua transaksi diproses oleh Xendit, penyedia payment gateway yang terdaftar dan diawasi oleh Bank Indonesia. Data kartu Anda tidak disimpan di server kami.',
      },
    ],
  },
  {
    category: '↩️ Return & Refund',
    items: [
      {
        q: 'Kapan saya bisa mengajukan return?',
        a: 'Return dapat diajukan dalam 3 hari kerja sejak produk diterima, untuk kasus produk cacat/rusak atau produk tidak sesuai pesanan. Produk harus belum dibuka dan dalam kondisi original.',
      },
      {
        q: 'Berapa lama proses refund?',
        a: 'Setelah produk diterima dan diverifikasi, refund via transfer bank memakan waktu 3–5 hari kerja. Refund via EVC Points dikreditkan langsung otomatis.',
      },
      {
        q: 'Bagaimana cara mengajukan return?',
        a: 'Hubungi CS kami via WhatsApp +62 858-2085-2908 dengan menyertakan nomor pesanan dan foto produk yang bermasalah. Tim kami akan merespons dalam 1×24 jam.',
      },
    ],
  },
  {
    category: '👤 Akun & EVC Points',
    items: [
      {
        q: 'Bagaimana cara mendaftar akun?',
        a: 'Klik tombol "Daftar" di pojok kanan atas, masukkan nama, email, dan buat password. Verifikasi email Anda, dan akun siap digunakan.',
      },
      {
        q: 'Apa itu EVC Points?',
        a: 'EVC Points adalah program loyalitas EVC Mercato. Setiap pembelian memberikan poin yang dapat digunakan sebagai diskon untuk pembelian berikutnya.',
      },
      {
        q: 'Bagaimana cara menggunakan EVC Points?',
        a: 'Saat checkout, Anda akan melihat opsi untuk menggunakan EVC Points yang tersedia. Poin akan dikurangkan dari total belanja Anda secara otomatis.',
      },
    ],
  },
]

export default function FAQPage() {
  // FAQPage JSON-LD schema
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.flatMap(section =>
      section.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      }))
    ),
  }

  return (
    <div className="min-h-screen bg-white">
      <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Pertanyaan yang Sering Ditanyakan</h1>
        <p className="text-sm text-gray-400 mb-10">Temukan jawaban cepat atas pertanyaan umum Anda</p>

        <div className="space-y-8">
          {faqData.map((section) => (
            <div key={section.category}>
              <h2 className="text-base font-semibold text-gray-900 mb-3">{section.category}</h2>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <details key={item.q} className="bg-gray-50 rounded-xl p-4 group">
                    <summary className="cursor-pointer font-medium text-gray-900 text-sm list-none flex items-center justify-between gap-2">
                      {item.q}
                      <span className="text-gray-400 flex-shrink-0 text-xs group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#f8fce8] rounded-2xl p-6 text-center">
          <p className="text-gray-700 font-medium mb-2">Tidak menemukan jawaban yang Anda cari?</p>
          <p className="text-sm text-gray-500 mb-4">Tim CS kami siap membantu Anda</p>
          <a
            href="https://wa.me/6285820852908"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#7FB300] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#6a9700] transition-colors"
          >
            💬 Chat WhatsApp CS
          </a>
        </div>
      </main>
    </div>
  )
}
