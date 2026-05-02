'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { ToastContainer } from '@/components/admin/Toast'

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-slate-800 text-sm">EVC Mercato Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
