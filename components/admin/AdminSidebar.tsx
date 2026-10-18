'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    href: '/sambers',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/sambers/produk',
    label: 'Produk',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/sambers/kategori',
    label: 'Kategori',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: '/sambers/pesanan',
    label: 'Pesanan',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/sambers/payment-link',
    label: 'Payment Link',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">💳</span>
    ),
  },
  {
    href: '/sambers/pengiriman',
    label: 'Pengiriman',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">🚚</span>
    ),
  },
  {
    href: '/sambers/poin',
    label: 'EVC Points',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">💎</span>
    ),
  },
  {
    href: '/sambers/member',
    label: 'Member',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">👥</span>
    ),
    children: [
      {
        href: '/sambers/leads',
        label: 'Database Leads',
        icon: (
          <span className="w-5 h-5 flex items-center justify-center text-base leading-none">🎯</span>
        ),
      },
      {
        href: '/sambers/broadcast',
        label: 'Broadcast Campaign',
        icon: (
          <span className="w-5 h-5 flex items-center justify-center text-base leading-none">📢</span>
        ),
      },
      {
        href: '/sambers/chat',
        label: 'Chat Member',
        icon: (
          <span className="w-5 h-5 flex items-center justify-center text-base leading-none">📨</span>
        ),
      },
    ],
  },
  {
    href: '/sambers/tampilan',
    label: 'Tampilan Toko',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">🎨</span>
    ),
    children: [
      {
        href: '/sambers/tampilan/banner',
        label: 'Banner Hero',
        icon: (
          <span className="w-5 h-5 flex items-center justify-center text-base leading-none">🖼️</span>
        ),
      },
      {
        href: '/sambers/tampilan/produk-unggulan',
        label: 'Susun Produk Unggulan',
        icon: (
          <span className="w-5 h-5 flex items-center justify-center text-base leading-none">⭐</span>
        ),
      },
    ],
  },
  {
    href: '/sambers/cetak-resi',
    label: 'Cetak Resi',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">🖨️</span>
    ),
  },
  {
    href: '/sambers/affiliate',
    label: 'Affiliate',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">🤝</span>
    ),
  },
  {
    href: '/sambers/testimoni',
    label: 'Testimoni',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">💬</span>
    ),
  },
  {
    href: '/sambers/landing-pages',
    label: 'Landing Pages',
    icon: (
      <span className="w-5 h-5 flex items-center justify-center text-base leading-none">📄</span>
    ),
  },
]

interface AdminSidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ open = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/sambers') return pathname === '/sambers'
    return pathname.startsWith(href)
  }
  const groupActive = (item: MenuItem) => isActive(item.href) || !!item.children?.some((c) => isActive(c.href))
  // Grup sub-menu terbuka otomatis bila halaman aktif ada di dalamnya.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const isExpanded = (item: MenuItem) => expanded[item.href] ?? groupActive(item)

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-[#7FB300] text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-[#7FB300] flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">EVC Mercato</div>
            <div className="text-xs text-slate-400">Admin Panel</div>
          </div>
          {/* Close btn mobile */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) =>
            item.children ? (
              <div key={item.href}>
                <div className="flex items-center gap-1">
                  <Link href={item.href} prefetch={false} onClick={onClose} className={`flex-1 ${linkCls(isActive(item.href) && !item.children.some((c) => isActive(c.href)))}`}>
                    {item.icon}
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [item.href]: !isExpanded(item) }))}
                    aria-expanded={isExpanded(item)}
                    aria-label={`${isExpanded(item) ? 'Tutup' : 'Buka'} sub-menu ${item.label}`}
                    className="flex h-10 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded(item) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {isExpanded(item) && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} prefetch={false} onClick={onClose} className={linkCls(isActive(child.href))}>
                        {child.icon}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.href} href={item.href} prefetch={false} onClick={onClose} className={linkCls(isActive(item.href))}>
                {item.icon}
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Toko
          </Link>
        </div>
      </aside>
    </>
  )
}
