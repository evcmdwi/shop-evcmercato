'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Package, User } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

// Halaman tanpa navigasi bawah: punya tombol tetap di bawah sendiri, atau bukan halaman toko.
const HIDDEN_PREFIXES = [
  '/keranjang', '/checkout', '/sambers', '/lp', '/login', '/register', '/lupa-password', '/reset-password',
]

/** Navigasi bawah — HP saja (disembunyikan mulai md). */
export default function BottomNav() {
  const pathname = usePathname() ?? '/'
  const { user } = useAuth()
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null

  const items = [
    { href: '/', label: 'Beranda', Icon: Home, active: pathname === '/' },
    { href: '/katalog', label: 'Kategori', Icon: LayoutGrid, active: pathname.startsWith('/katalog') },
    { href: user ? '/orders' : '/login?redirect_to=/orders', label: 'Pesanan', Icon: Package, active: pathname.startsWith('/orders') },
    {
      href: user ? '/dashboard' : '/login',
      label: 'Akun',
      Icon: User,
      active: ['/dashboard', '/profile', '/poin'].some((p) => pathname.startsWith(p)),
    },
  ]

  return (
    <>
      {/* Ruang kosong agar konten terakhir tidak tertutup bar */}
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-evc-border bg-evc-surface pb-[env(safe-area-inset-bottom)] font-jakarta md:hidden"
      >
        <ul className="grid h-16 grid-cols-4">
          {items.map(({ href, label, Icon, active }) => (
            <li key={label}>
              <Link
                href={href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? 'text-evc-green' : 'text-evc-muted'
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
