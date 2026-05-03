import Link from 'next/link'

export const metadata = {
  title: 'Kebijakan Pengembalian — EVC Mercato',
}

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Kebijakan Pengembalian</h1>
      <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: Mei 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Syarat Pengembalian</h2>
          <p>Pengembalian produk dapat dilakukan dalam <strong>7 hari kalender</strong> sejak produk diterima, dengan syarat:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Produk belum digunakan/dibuka</li>
            <li>Kemasan masih dalam kondisi utuh dan tersegel</li>
            <li>Disertai bukti pembelian (nomor order)</li>
            <li>Produk tidak termasuk kategori yang tidak dapat dikembalikan</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Produk yang Tidak Dapat Dikembalikan</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Produk yang sudah dibuka atau digunakan</li>
            <li>Produk dengan kemasan rusak akibat penggunaan pembeli</li>
            <li>Produk dalam kategori kesehatan yang sudah disegel dibuka</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Proses Pengembalian</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Hubungi CS kami via WhatsApp atau email dengan nomor order</li>
            <li>Tim kami akan memvalidasi permintaan dalam 1x24 jam</li>
            <li>Jika disetujui, instruksi pengiriman balik akan diberikan</li>
            <li>Setelah produk diterima dan diperiksa, refund diproses dalam 3-5 hari kerja</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Biaya Pengembalian</h2>
          <p>Biaya pengiriman pengembalian ditanggung pembeli, kecuali jika pengembalian disebabkan oleh kesalahan pengiriman dari pihak EVC Mercato.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Refund</h2>
          <p>Refund dikembalikan ke metode pembayaran asal. Untuk transfer bank, refund memerlukan 3-5 hari kerja. Untuk e-wallet, refund memerlukan 1-3 hari kerja.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Hubungi Kami</h2>
          <p>
            WhatsApp: <a href="https://wa.me/6285820852908" target="_blank" rel="noopener noreferrer" className="text-[#7FB300] hover:underline">+62 858-2085-2908</a><br />
            Email: <a href="mailto:cs@evcmercato.com" className="text-[#7FB300] hover:underline">cs@evcmercato.com</a>
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-[#7FB300] hover:underline text-sm">← Kembali ke Beranda</Link>
      </div>
    </div>
  )
}
