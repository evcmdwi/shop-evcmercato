'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

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

            {user ? (
              <Link
                href="/profile"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 ${
                  pathname?.startsWith('/profile') ? 'text-[#534AB7]' : 'text-gray-600'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[#534AB7] text-xs font-bold">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span>Profil</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#534AB7' }}
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
