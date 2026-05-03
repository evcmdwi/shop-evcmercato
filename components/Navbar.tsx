'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Package } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useCartContext } from '@/components/CartContext'
import AuthNavButtons from '@/components/AuthNavButtons'

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-evcmercato.jpg" alt="EVC Mercato" width={32} height={32} className="rounded-full" />
            <span className="font-bold text-gray-900 hidden sm:block">EVC Mercato</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/katalog"
              prefetch={false}
              className={`hidden sm:block text-sm font-medium transition-colors hover:opacity-80 ${
                pathname?.startsWith('/katalog') ? 'text-[#7FB300]' : 'text-gray-600'
              }`}
            >
              Katalog
            </Link>

            {/* Cart icon — only when logged in */}
            {user && <NavCartIcon />}

            {/* Orders link — only when logged in */}
            {user && (
              <Link
                href="/orders"
                prefetch={false}
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80 ${
                  pathname?.startsWith('/orders') ? 'text-[#7FB300]' : 'text-gray-600'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="hidden sm:inline">Pesanan</span>
              </Link>
            )}

            <AuthNavButtons />
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavCartIcon() {
  const { itemCount } = useCartContext()
  return (
    <Link href="/keranjang" prefetch={false} className="relative p-1" aria-label="Keranjang">
      <ShoppingCart className="w-6 h-6 text-gray-700" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#7FB300] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  )
}
