import Link from 'next/link'
import { ShoppingBag, ArrowRight, Star, Shield, Truck } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 font-bold text-lg" style={{ color: '#534AB7' }}>
              <ShoppingBag className="w-6 h-6" />
              <span>EVC Mercato</span>
            </div>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#534AB7' }}
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 px-4 text-center" style={{ background: 'linear-gradient(135deg, #EEEDFE 0%, #ffffff 60%)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: '#EEEDFE', color: '#534AB7' }}>
              <Star className="w-4 h-4" />
              <span>Program EVC Points — Belanja & Dapatkan Reward</span>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#534AB7' }}>
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Selamat Datang di{' '}
              <span style={{ color: '#534AB7' }}>EVC Mercato</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
              Temukan produk KKI pilihan terbaik. Belanja, kumpulkan EVC Points, dan tukar dengan produk gratis.
            </p>

            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-lg transition-opacity hover:opacity-90 shadow-lg"
              style={{ backgroundColor: '#534AB7' }}
            >
              Lihat Produk
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Star, title: 'EVC Points', desc: '1 poin per Rp 1.000 belanja. Tukar dengan produk gratis!' },
              { icon: Shield, title: 'Produk Terpercaya', desc: 'Produk KKI original dengan jaminan kualitas terbaik.' },
              { icon: Truck, title: 'Pengiriman Balikpapan', desc: 'Layanan pengiriman cepat ke seluruh Balikpapan & sekitarnya.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEEDFE' }}>
                  <Icon className="w-6 h-6" style={{ color: '#534AB7' }} />
                </div>
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 border-t border-gray-100">
        © 2026 EVC Mercato, Balikpapan. All rights reserved.
      </footer>
    </div>
  )
}
