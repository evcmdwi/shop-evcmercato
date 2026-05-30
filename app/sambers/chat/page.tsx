'use client'

import { useState, useEffect, useCallback } from 'react'

interface Member {
  id: string
  name: string
  email: string
  phone: string
}

interface MessageHistory {
  id: string
  message: string
  sent_at: string
  status: 'sent' | 'failed'
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'
interface Toast {
  id: number
  message: string
  type: ToastType
}

let toastId = 0

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return { toasts, show }
}

function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
            t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── Modal Compose ────────────────────────────────────────────────────────────

interface SendWAModalProps {
  member: Member
  onClose: () => void
  onSent: () => void
  showToast: (msg: string, type: ToastType) => void
}

function SendWAModal({ member, onClose, onSent, showToast }: SendWAModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const charCount = message.length

  async function handleSend() {
    if (charCount < 5 || charCount > 1000) return
    setLoading(true)
    try {
      const res = await fetch('/api/sambers/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: member.id, message }),
      })
      if (!res.ok) throw new Error('Gagal mengirim pesan')
      showToast(`Pesan berhasil dikirim ke ${member.name}`, 'success')
      onSent()
      onClose()
    } catch {
      showToast('Gagal mengirim pesan. Coba lagi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Kirim Pesan ke {member.name}
        </h2>
        <p className="text-sm text-slate-500 mb-1">
          Nomor: <span className="font-medium text-slate-700">{member.phone}</span>
        </p>
        <div className="mt-4">
          <textarea
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={5}
            maxLength={1000}
            placeholder="Tulis pesan WhatsApp... (min. 5 karakter)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className={`text-xs mt-1 text-right ${charCount > 1000 ? 'text-red-500' : 'text-slate-400'}`}>
            {charCount}/1000
          </p>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSend}
            disabled={loading || charCount < 5 || charCount > 1000}
            className="px-5 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Mengirim...
              </>
            ) : (
              <>
                <WhatsAppIcon />
                Kirim
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal History ────────────────────────────────────────────────────────────

interface HistoryModalProps {
  member: Member
  onClose: () => void
}

function HistoryModal({ member, onClose }: HistoryModalProps) {
  const [messages, setMessages] = useState<MessageHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sambers/chat/history/${member.id}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [member.id])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Riwayat Pesan — {member.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">Memuat riwayat...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Belum ada pesan yang dikirim ke member ini
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <p className="text-sm text-slate-800 leading-relaxed">{msg.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400">{formatDateTime(msg.sent_at)}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      msg.status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {msg.status === 'sent' ? 'Terkirim' : 'Gagal'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatMemberPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [composeTarget, setComposeTarget] = useState<Member | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Member | null>(null)
  const { toasts, show: showToast } = useToast()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/sambers/members?${params}`)
      const data = await res.json()
      setMembers(data.members ?? [])
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chat Member</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kirim pesan WhatsApp langsung ke member
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <WhatsAppIcon className="w-4 h-4 text-green-500" />
          <span>via Fonnte</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau nomor HP..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Memuat data member...</div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {debouncedSearch ? 'Tidak ada member yang cocok.' : 'Belum ada data member.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    No HP
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    WA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setHistoryTarget(member)}
                        className="font-medium text-slate-800 hover:text-green-600 transition-colors text-left"
                      >
                        {member.name || '(tanpa nama)'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{member.email}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {member.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => member.phone ? setComposeTarget(member) : undefined}
                        disabled={!member.phone}
                        title={member.phone ? `Kirim WA ke ${member.name}` : 'Tidak ada nomor HP'}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                          member.phone
                            ? 'text-green-600 hover:bg-green-50 hover:text-green-700'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        <WhatsAppIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {composeTarget && (
        <SendWAModal
          member={composeTarget}
          onClose={() => setComposeTarget(null)}
          onSent={fetchMembers}
          showToast={showToast}
        />
      )}
      {historyTarget && (
        <HistoryModal
          member={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}
