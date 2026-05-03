'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'
import UserHeaderWidget from './UserHeaderWidget'

export default function AuthNavButtons() {
  const { user, loading } = useAuth()

  // Show skeleton while loading initial state
  if (loading) return <div className="w-20 h-10" />

  if (user) return <UserHeaderWidget />

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="text-sm text-gray-600 hover:text-[#7FB300] px-3 py-2.5">
        Masuk
      </Link>
      <Link href="/register" className="text-sm bg-[#7FB300] text-white px-4 py-2.5 rounded-lg hover:bg-[#4338a0]">
        Daftar
      </Link>
    </div>
  )
}
