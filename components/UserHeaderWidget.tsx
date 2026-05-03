'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'

interface UserProfile {
  name: string | null
  total_points: number
  tier: string
}

export default function UserHeaderWidget() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    fetch('/api/user/profile')
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((data) => {
        if (data) setProfile(data as UserProfile)
      })
      .catch(() => {
        // silently fail — widget degrades gracefully
      })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  // Avatar: initial dari nama atau email
  const displayName = profile?.name || user.email?.split('@')[0] || 'U'
  const initial = displayName.charAt(0).toUpperCase()
  const points = profile?.total_points ?? 0

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 hover:bg-[#E8F4D1] rounded-lg px-2 py-1.5 transition-colors min-h-[44px]"
    >
      {/* Avatar circle */}
      <div className="w-8 h-8 rounded-full bg-[#7FB300] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {initial}
      </div>

      {/* Name + points — hidden on very small screens */}
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
          {displayName.split(' ').slice(0, 2).join(' ')}
        </span>
        <span className="text-xs text-[#7FB300]">⭐ {points} pt</span>
      </div>

      {/* Points only on mobile (xs) */}
      <span className="sm:hidden text-xs text-[#7FB300] font-medium">
        {points} pt
      </span>
    </Link>
  )
}
