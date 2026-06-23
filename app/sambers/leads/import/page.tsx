'use client'

import { useState } from 'react'
import Link from 'next/link'
import StepUpload from '@/components/admin/LeadsImport/StepUpload'
import StepMapping, { type ColumnDef, type FieldKey } from '@/components/admin/LeadsImport/StepMapping'
import StepResult, { type ImportResult } from '@/components/admin/LeadsImport/StepResult'

type Step = 'upload' | 'mapping' | 'result'

const STEP_META: { key: Step; label: string; number: number }[] = [
  { key: 'upload', label: 'Upload File', number: 1 },
  { key: 'mapping', label: 'Mapping Kolom', number: 2 },
  { key: 'result', label: 'Hasil Import', number: 3 },
]

export default function LeadsImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [columns, setColumns] = useState<ColumnDef[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const handleColumnsReady = (cols: ColumnDef[]) => {
    setColumns(cols)
    setStep('mapping')
  }

  const handleImport = async (mapping: Record<string, FieldKey>) => {
    setImporting(true)
    setImportError('')
    try {
      const res = await fetch('/api/sambers/leads/import-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)

      setImportResult({
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        skippedLeads: data.skippedLeads ?? [],
        errors: data.errors ?? [],
      })
      setStep('result')
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import gagal. Silakan coba lagi.')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setColumns([])
    setImportResult(null)
    setImportError('')
  }

  const currentStepNum = STEP_META.find(s => s.key === step)?.number ?? 1

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/sambers/leads" className="hover:text-[#7FB300] transition-colors font-medium">
          🎯 Database Leads
        </Link>
        <span>›</span>
        <span className="text-slate-700 font-semibold">Import via XLSX</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-800 mb-1">Import Leads via Excel</h1>
      <p className="text-sm text-slate-500 mb-8">Upload file .xlsx, petakan kolom, dan import leads ke database secara massal.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
        {STEP_META.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-0 min-w-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0
              ${step === s.key
                ? 'bg-[#7FB300] text-white'
                : currentStepNum > s.number
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-400'
              }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s.key ? 'bg-white text-[#7FB300]' : currentStepNum > s.number ? 'bg-green-600 text-white' : 'bg-slate-300 text-white'}`}>
                {currentStepNum > s.number ? '✓' : s.number}
              </span>
              <span className="text-xs sm:text-sm">
                <span className="sm:hidden">{s.key === 'upload' ? 'Upload' : s.key === 'mapping' ? 'Mapping' : 'Hasil'}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            </div>
            {idx < STEP_META.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-8 shrink-0 mx-1 ${currentStepNum > s.number + 1 ? 'bg-green-400' : currentStepNum > s.number ? 'bg-[#7FB300]' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {step === 'upload' && (
          <StepUpload onColumnsReady={handleColumnsReady} />
        )}

        {step === 'mapping' && columns.length > 0 && (
          <>
            {importError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                <span className="mt-0.5">❌</span>
                <span>{importError}</span>
              </div>
            )}
            <StepMapping
              columns={columns}
              onImport={handleImport}
              importing={importing}
            />
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Ganti file
              </button>
            </div>
          </>
        )}

        {step === 'result' && importResult && (
          <StepResult result={importResult} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
