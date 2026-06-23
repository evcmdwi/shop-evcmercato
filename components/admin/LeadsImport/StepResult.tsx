'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface ImportResult {
  imported: number
  skipped: number
  skippedLeads: { name: string; phone: string; reason: string }[]
}

interface StepResultProps {
  result: ImportResult
  onReset: () => void
}

export default function StepResult({ result, onReset }: StepResultProps) {
  const [showSkipped, setShowSkipped] = useState(false)

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">Langkah 3 — Hasil Import</h2>
      <p className="text-sm text-slate-500 mb-6">Proses import selesai. Berikut ringkasannya.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-4xl">✅</div>
          <div>
            <div className="text-3xl font-bold text-green-700">{result.imported}</div>
            <div className="text-sm font-medium text-green-600 mt-0.5">leads berhasil diimport</div>
          </div>
        </div>

        {result.skipped > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <div className="text-3xl font-bold text-amber-700">{result.skipped}</div>
              <div className="text-sm font-medium text-amber-600 mt-0.5">leads di-skip</div>
              <div className="text-xs text-amber-500 mt-0.5">(nomor HP sudah ada)</div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="text-4xl">🎉</div>
            <div>
              <div className="text-3xl font-bold text-slate-600">0</div>
              <div className="text-sm font-medium text-slate-500 mt-0.5">leads di-skip</div>
              <div className="text-xs text-slate-400 mt-0.5">Semua data baru!</div>
            </div>
          </div>
        )}
      </div>

      {/* Skipped leads collapsible */}
      {result.skipped > 0 && result.skippedLeads.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowSkipped(s => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            <span className={`transition-transform duration-200 ${showSkipped ? 'rotate-90' : ''}`}>▶</span>
            {showSkipped ? 'Sembunyikan' : 'Lihat'} {result.skippedLeads.length} leads yang di-skip
          </button>

          {showSkipped && (
            <div className="mt-3 border border-amber-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-200 text-left">
                    <th className="px-4 py-2.5 font-semibold text-amber-700 text-xs">Nama</th>
                    <th className="px-4 py-2.5 font-semibold text-amber-700 text-xs">No HP/WA</th>
                    <th className="px-4 py-2.5 font-semibold text-amber-700 text-xs">Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  {result.skippedLeads.map((lead, i) => (
                    <tr key={i} className="border-b border-amber-100 last:border-0">
                      <td className="px-4 py-2.5 text-slate-700">{lead.name || <span className="text-slate-400 italic">—</span>}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{lead.phone}</td>
                      <td className="px-4 py-2.5 text-amber-600 text-xs">{lead.reason || 'Nomor HP sudah ada'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#7FB300] text-[#7FB300] font-semibold rounded-xl hover:bg-green-50 transition-colors text-sm"
        >
          📂 Import File Lain
        </button>
        <Link
          href="/sambers/leads"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7FB300] text-white font-semibold rounded-xl hover:bg-[#6B9700] transition-colors text-sm"
        >
          🎯 Lihat Semua Leads
        </Link>
      </div>
    </div>
  )
}
