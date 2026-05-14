import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian & Refund — EVC Mercato',
  description: 'Informasi lengkap tentang kebijakan pengembalian produk dan refund di EVC Mercato.',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl text-gray-900 mb-2">Kebijakan Pengembalian &amp; Refund</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: Mei 2026</p>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Syarat Pengembalian</h2>
            <p>Produk dapat dikembalikan dalam kondisi:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Produk cacat/rusak saat diterima (dengan foto bukti)</li>
              <li>Produk tidak sesuai dengan pesanan</li>
              <li>Pengajuan dalam 7 hari kerja sejak produk diterima</li>
              <li>Produk belum dibuka / masih dalam kondisi original</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Produk yang Tidak Dapat Dikembalikan</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Produk yang sudah dibuka (seperti pembalut, suplemen yang sudah dibuka)</li>
              <li>Produk yang sudah digunakan</li>
              <li>Kerusakan akibat penyalahgunaan oleh pembeli</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Cara Mengajukan Return</h2>
            <ol className="list-decimal pl-5 space-y-1 mt-2">
              <li>Hubungi CS kami via WhatsApp: +62 858-2085-2908</li>
              <li>Sertakan nomor pesanan dan foto produk yang bermasalah</li>
              <li>Tim kami akan memverifikasi dalam 1×24 jam</li>
              <li>Instruksi pengiriman balik akan diberikan setelah approved</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Proses Refund</h2>
            <p>Setelah produk diterima dan diverifikasi:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Refund via transfer bank: 3–5 hari kerja</li>
              <li>Refund via EVC Points: langsung otomatis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Kontak untuk Dispute</h2>
            <p>
              Email: <a href="mailto:cs@evcmercato.com" className="text-[#7FB300] hover:underline">cs@evcmercato.com</a>
              {' '}| WhatsApp:{' '}
              <a href="https://wa.me/6285820852908" className="text-[#7FB300] hover:underline">+62 858-2085-2908</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
