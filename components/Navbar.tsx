'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: '#534AB7' }}>
            <ShoppingBag className="w-6 h-6" />
            <span>EVC Mercato</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-4">
            <Link
              href="/katalog"
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                pathname?.startsWith('/katalog') ? 'text-[#534AB7]' : 'text-gray-600'
              }`}
            >
              Katalog
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#534AB7' }}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
