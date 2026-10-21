'use client'

import { createContext, useContext } from 'react'
import type { AdminAccount } from '@/lib/admin-auth'

// Akun Sambers yang sedang login (null = login lama via email di ADMIN_EMAIL).
const AdminAccountContext = createContext<AdminAccount | null>(null)

export const AdminAccountProvider = AdminAccountContext.Provider

export function useAdminAccount() {
  return useContext(AdminAccountContext)
}

/** Kode admin yang terkunci ke login ini, atau null bila boleh memilih sendiri. */
export function useLockedAdminCode(): string | null {
  const account = useAdminAccount()
  return account && !account.is_owner && account.admin_code ? account.admin_code : null
}
