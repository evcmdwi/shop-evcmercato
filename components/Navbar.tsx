'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, Search } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useCartContext } from '@/components/CartContext'

// Halaman yang tidak menampilkan kolom cari header (punya pencarian/alur sendiri).
const NO_SEARCH_PREFIXES = ['/katalog', '/keranjang', '/checkout', '/sambers', '/sambers-login']

export default function Navbar() {
  const pathname = usePathname() ?? '/'
  const { user } = useAuth()
  const showSearch = !NO_SEARCH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || pathname.startsWith('/katalog/')

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      prefetch={false}
      className={`hidden md:inline-flex min-h-[44px] items-center px-2 text-sm font-medium hover:text-evc-green ${
        pathname.startsWith(href) ? 'text-evc-green' : 'text-evc-muted'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 border-b border-evc-border bg-evc-surface font-jakarta">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="flex h-14 items-center gap-3 md:h-16">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="EVC Mercato — Beranda">
            <Image src="/logo-evcmercato.jpg" alt="" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-extrabold text-evc-ink">EVC Mercato</span>
          </Link>

          {showSearch && (
            <div className="hidden flex-1 md:block md:max-w-xl md:mx-auto">
              <HeaderSearch />
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            {navLink('/katalog', 'Katalog')}
            {user && navLink('/orders', 'Pesanan')}
            <Link
              href={user ? '/dashboard' : '/login'}
              prefetch={false}
              aria-label={user ? 'Akun saya' : 'Masuk atau daftar'}
              className="flex h-11 w-11 items-center justify-center rounded-full text-evc-ink hover:bg-evc-ground"
            >
              <User className="h-6 w-6" strokeWidth={1.75} />
            </Link>
            <NavCartIcon />
          </div>
        </div>

        {showSearch && (
          <div className="pb-3 md:hidden">
            <HeaderSearch />
          </div>
        )}
      </div>
    </nav>
  )
}

function HeaderSearch() {
  return (
    <form action="/katalog" method="get" role="search" className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-evc-muted" strokeWidth={1.75} />
      <input
        type="search"
        name="q"
        placeholder="Cari Natesh, SGF, FITSOL…"
        aria-label="Cari produk"
        className="h-11 w-full rounded-xl border border-transparent bg-evc-ground pl-10 pr-3 text-base text-evc-ink placeholder:text-evc-muted focus:border-evc-green focus:outline-none"
      />
    </form>
  )
}

function NavCartIcon() {
  const { itemCount } = useCartContext()
  return (
    <Link
      href="/keranjang"
      prefetch={false}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-evc-ink hover:bg-evc-ground"
      aria-label={itemCount > 0 ? `Keranjang, ${itemCount} barang` : 'Keranjang'}
    >
      <ShoppingCart className="h-6 w-6" strokeWidth={1.75} />
      {itemCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-evc-accent px-1 text-[10px] font-bold text-white">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  )
}
