import Link from 'next/link'

export const metadata = {
  title: 'Kebijakan Privasi — EVC Mercato',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Kebijakan Privasi</h1>
      <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: Mei 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar, melakukan pemesanan, atau menghubungi layanan pelanggan kami. Informasi ini meliputi nama, alamat email, nomor telepon, dan alamat pengiriman.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Penggunaan Informasi</h2>
          <p>Informasi Anda digunakan untuk memproses pesanan, mengirimkan notifikasi transaksi, memberikan dukungan pelanggan, dan meningkatkan layanan kami.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Keamanan Data</h2>
          <p>Kami menggunakan enkripsi dan protokol keamanan standar industri untuk melindungi data pribadi Anda. Data pembayaran diproses secara aman melalui Xendit dan tidak disimpan di server kami.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Berbagi Data</h2>
          <p>Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak ketiga. Data hanya dibagikan kepada mitra pengiriman dan penyedia pembayaran yang diperlukan untuk memproses pesanan Anda.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Hak Pengguna</h2>
          <p>Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda. Hubungi kami di cs@evcmercato.com untuk permintaan tersebut.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Hubungi Kami</h2>
          <p>Pertanyaan tentang kebijakan privasi: <a href="mailto:cs@evcmercato.com" className="text-[#7FB300] hover:underline">cs@evcmercato.com</a></p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-[#7FB300] hover:underline text-sm">← Kembali ke Beranda</Link>
      </div>
    </div>
  )
}
