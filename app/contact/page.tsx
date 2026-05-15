import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hubungi Kami — EVC Mercato',
  description: 'Hubungi tim EVC Mercato untuk pertanyaan produk, pesanan, atau konsultasi.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Hubungi Kami</h1>
        <p className="text-sm text-gray-400 mb-8">Kami siap membantu Anda</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <a
            href="https://wa.me/6285820852908"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-[#f8fce8] rounded-2xl border border-[#7FB300]/20 hover:shadow-sm transition-shadow"
          >
            <span className="text-3xl">💬</span>
            <div>
              <p className="font-semibold text-gray-900">WhatsApp CS</p>
              <p className="text-sm text-gray-500">+62 858-2085-2908</p>
              <p className="text-xs text-[#7FB300] mt-1">Chat Sekarang →</p>
            </div>
          </a>
          <a
            href="mailto:cs@evcmercato.com"
            className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-sm transition-shadow"
          >
            <span className="text-3xl">✉️</span>
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p className="text-sm text-gray-500">cs@evcmercato.com</p>
              <p className="text-xs text-gray-400 mt-1">Respon dalam 1x24 jam</p>
            </div>
          </a>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="text-gray-400 w-32 flex-shrink-0">Alamat</span>
              <span>Plaza Aminta Lantai 5/504, Jalan Letnan Jendral TB Simatupang Kav 10, Pondok Pinang, Kebayoran Lama, Jakarta Selatan, DKI Jakarta 12310</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-32 flex-shrink-0">Telepon</span>
              <span>+62 858-2085-2908</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-32 flex-shrink-0">Email</span>
              <span>cs@evcmercato.com</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-32 flex-shrink-0">Jam Layanan</span>
              <span>Senin–Sabtu, 09.00–17.00 WITA</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pertanyaan Umum</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <details className="bg-gray-50 rounded-xl p-4">
              <summary className="cursor-pointer font-medium text-gray-900">Bagaimana cara melacak pesanan saya?</summary>
              <p className="mt-2">Login ke akun Anda di shop.evcmercato.com → menu Pesanan untuk melihat status dan nomor resi pengiriman.</p>
            </details>
            <details className="bg-gray-50 rounded-xl p-4">
              <summary className="cursor-pointer font-medium text-gray-900">Berapa lama proses pengiriman?</summary>
              <p className="mt-2">Pengiriman reguler 1-3 hari kerja, Layanan Instan dan Sameday tersedia untuk 30 kota pilihan.</p>
            </details>
            <details className="bg-gray-50 rounded-xl p-4">
              <summary className="cursor-pointer font-medium text-gray-900">Apakah produk EVC Mercato original?</summary>
              <p className="mt-2">Ya, semua produk kami adalah produk original langsung dari KKI Group. EVC Mercato adalah mitra usaha resmi KKI Group sejak 2003.</p>
            </details>
          </div>
        </div>
      </main>
    </div>
  )
}
