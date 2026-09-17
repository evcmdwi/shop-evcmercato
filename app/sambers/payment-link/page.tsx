'use client'

import React, { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────

type PLStatus = 'pending' | 'paid' | 'expired' | 'failed'

interface PaymentLink {
  id: string
  description: string
  amount: number
  status: PLStatus
  payment_url: string
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: PLStatus }) {
  const map: Record<PLStatus, { label: string; cls: string }> = {
    pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-800' },
    paid:    { label: 'Lunas ✓',  cls: 'bg-green-100 text-green-800' },
    expired: { label: 'Kedaluwarsa', cls: 'bg-gray-100 text-gray-600' },
    failed:  { label: 'Gagal',    cls: 'bg-red-100 text-red-700' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────

function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Tersalin!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

// ─── History Card (mobile) ────────────────────────────────────────────

function HistoryCard({ item }: { item: PaymentLink }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-800">{item.description || '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="text-base font-semibold text-gray-900">{formatRupiah(item.amount)}</p>
      <div className="flex items-center gap-2 pt-1">
        <a
          href={item.payment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Buka
        </a>
        <CopyButton text={item.payment_url} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function PaymentLinkPage() {
  // Form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // History state
  const [history, setHistory] = useState<PaymentLink[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // ── Load history ────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    setHistoryError(null)
    try {
      const res = await fetch('/api/sambers/payment-link')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setHistoryError(`Error ${res.status}: ${err.error ?? 'Gagal memuat history'}`)
        return
      }
      const data = await res.json()
      setHistory(data.data ?? data.links ?? data ?? [])
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  // ── Format nominal input ────────────────────────────────────────────
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits
    const raw = e.target.value.replace(/\D/g, '')
    setAmount(raw)
  }

  const displayAmount = amount
    ? new Intl.NumberFormat('id-ID').format(Number(amount))
    : ''

  // ── Generate payment link ───────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setGeneratedUrl(null)

    const amountNum = Number(amount)
    if (!amountNum || amountNum < 1000) {
      setFormError('Nominal minimal Rp 1.000')
      return
    }
    if (!description.trim()) {
      setFormError('Deskripsi wajib diisi')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/sambers/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, description: description.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error ?? 'Gagal membuat payment link')
        return
      }
      const url = data.payment_url ?? data.url ?? data.invoice_url ?? data.data?.payment_url
      if (!url) {
        setFormError('Response tidak valid dari server')
        return
      }
      setGeneratedUrl(url)
      // Reset form
      setAmount('')
      setDescription('')
      // Refresh history
      loadHistory()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💳 Payment Link</h1>
        <p className="text-sm text-gray-500 mt-1">Buat link pembayaran instan via Xendit.</p>
      </div>

      {/* ── Create form ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Buat Payment Link</h2>

        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Nominal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nominal (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="0"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50 focus:border-[#7FB300]"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: Pembayaran pesanan khusus Rina"
              required
              maxLength={200}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]/50 focus:border-[#7FB300]"
            />
          </div>

          {/* Error */}
          {formError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={generating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7FB300] hover:bg-[#6a9700] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Membuat link…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Generate Payment Link
              </>
            )}
          </button>
        </form>

        {/* Generated URL result */}
        {generatedUrl && (
          <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
            <p className="text-sm font-medium text-green-800">✅ Payment link berhasil dibuat!</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <a
                href={generatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline underline-offset-2 break-all flex-1"
              >
                {generatedUrl}
              </a>
              <CopyButton text={generatedUrl} label="Salin Link" />
            </div>
          </div>
        )}
      </div>

      {/* ── History ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-base font-semibold text-gray-800">📋 History Payment Link</h2>
          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {historyError && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ❌ {historyError}
          </div>
        )}

        {loadingHistory ? (
          <div className="py-12 text-center text-sm text-gray-400">Memuat history…</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Belum ada payment link yang dibuat.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Deskripsi</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">
                        {item.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={item.payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka link"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Buka
                          </a>
                          <CopyButton text={item.payment_url} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {history.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
