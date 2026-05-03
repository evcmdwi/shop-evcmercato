import Link from 'next/link'

export const metadata = {
  title: 'Syarat & Ketentuan — EVC Mercato',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Syarat &amp; Ketentuan</h1>
      <p className="text-sm text-gray-500 mb-8">Terakhir diperbarui: Mei 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Penerimaan Syarat</h2>
          <p>Dengan menggunakan layanan shop.evcmercato.com, Anda menyetujui syarat dan ketentuan ini. Jika tidak setuju, mohon untuk tidak menggunakan layanan kami.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Akun Pengguna</h2>
          <p>Anda bertanggung jawab menjaga kerahasiaan akun dan kata sandi Anda. EVC Mercato tidak bertanggung jawab atas kerugian akibat akses tidak sah yang disebabkan kelalaian pengguna.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Pemesanan dan Pembayaran</h2>
          <p>Pesanan dianggap sah setelah pembayaran berhasil dikonfirmasi. Harga produk dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya. Pembayaran diproses melalui Xendit dengan berbagai metode yang tersedia.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pengiriman</h2>
          <p>Estimasi waktu pengiriman bersifat perkiraan dan dapat bervariasi tergantung lokasi dan kondisi logistik. EVC Mercato tidak bertanggung jawab atas keterlambatan yang disebabkan oleh mitra pengiriman.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. EVC Points</h2>
          <p>EVC Points tidak dapat diuangkan. Points memiliki masa berlaku dan dapat digunakan untuk penukaran produk pilihan sesuai ketentuan program loyalty yang berlaku.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Perubahan Syarat</h2>
          <p>EVC Mercato berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui halaman ini.</p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className="text-[#7FB300] hover:underline text-sm">← Kembali ke Beranda</Link>
      </div>
    </div>
  )
}
