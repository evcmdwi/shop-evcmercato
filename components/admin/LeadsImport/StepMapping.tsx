'use client'

import { useState } from 'react'

export interface ColumnDef {
  name: string
  samples: string[]
}

export type FieldKey = 'name' | 'phone' | 'city' | 'ignore'

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: 'ignore', label: 'Abaikan' },
  { value: 'name', label: 'Nama' },
  { value: 'phone', label: 'No HP/WA' },
  { value: 'city', label: 'Kota' },
]

const FIELD_LABEL: Record<FieldKey, string> = {
  name: 'Nama',
  phone: 'No HP/WA',
  city: 'Kota',
  ignore: 'Abaikan',
}

interface StepMappingProps {
  columns: ColumnDef[]
  onImport: (mapping: Record<string, FieldKey>) => void
  importing: boolean
}

function autoDetect(columns: ColumnDef[]): Record<string, FieldKey> {
  const mapping: Record<string, FieldKey> = {}
  const assigned = new Set<FieldKey>()

  for (const col of columns) {
    const lower = col.name.toLowerCase()
    let detected: FieldKey = 'ignore'

    if (!assigned.has('phone') && (
      lower.includes('hp') || lower.includes('phone') || lower.includes('wa') ||
      lower.includes('whatsapp') || lower.includes('nomor') || lower.includes('handphone') ||
      lower.includes('telepon') || lower.includes('telp') || lower.includes('no.')
    )) {
      detected = 'phone'
    } else if (!assigned.has('name') && (
      lower.includes('nama') || lower.includes('name')
    )) {
      detected = 'name'
    } else if (!assigned.has('city') && (
      lower.includes('kota') || lower.includes('city') || lower.includes('domisili') || lower.includes('asal')
    )) {
      detected = 'city'
    }

    if (detected !== 'ignore') assigned.add(detected)
    mapping[col.name] = detected
  }

  return mapping
}

export default function StepMapping({ columns, onImport, importing }: StepMappingProps) {
  const [mapping, setMapping] = useState<Record<string, FieldKey>>(() => autoDetect(columns))

  const phoneAssigned = Object.values(mapping).includes('phone')

  // Prevent duplicate assignment for name/phone/city
  const usedFields = (excludeCol: string): Set<FieldKey> => {
    const used = new Set<FieldKey>()
    for (const [col, field] of Object.entries(mapping)) {
      if (col !== excludeCol && field !== 'ignore') used.add(field)
    }
    return used
  }

  const handleChange = (colName: string, value: FieldKey) => {
    setMapping(prev => ({ ...prev, [colName]: value }))
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">Langkah 2 — Mapping Kolom</h2>
      <p className="text-sm text-slate-500 mb-6">
        Tentukan kolom mana di file Excel yang berisi data apa. Sistem sudah mencoba mendeteksi otomatis.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="px-4 py-3 font-semibold text-slate-600 w-1/3">Kolom File</th>
              <th className="px-4 py-3 font-semibold text-slate-600 w-1/3">Contoh Data</th>
              <th className="px-4 py-3 font-semibold text-slate-600 w-1/3">Mapping ke Field</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => {
              const currentVal = mapping[col.name] ?? 'ignore'
              const used = usedFields(col.name)

              return (
                <tr key={col.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-xs font-mono">
                      {col.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {col.samples.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {col.samples.slice(0, 2).map((s, i) => (
                          <span key={i} className="truncate max-w-[160px] block">{s || <em className="text-slate-300">kosong</em>}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={currentVal}
                      onChange={e => handleChange(col.name, e.target.value as FieldKey)}
                      className={`w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] transition-colors
                        ${currentVal === 'ignore' ? 'border-slate-200 text-slate-400' : 'border-[#7FB300] text-slate-800 bg-green-50'}`}
                    >
                      {FIELD_OPTIONS.map(opt => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={opt.value !== 'ignore' && opt.value !== currentVal && used.has(opt.value)}
                        >
                          {opt.label}
                          {opt.value !== 'ignore' && opt.value !== currentVal && used.has(opt.value) ? ' (sudah dipakai)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(['name', 'phone', 'city'] as FieldKey[]).map(field => {
          const assignedCol = Object.entries(mapping).find(([, v]) => v === field)?.[0]
          return (
            <div
              key={field}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
                ${assignedCol
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : field === 'phone'
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
            >
              {assignedCol ? '✅' : field === 'phone' ? '❌' : '○'}
              <span>{FIELD_LABEL[field]}</span>
              {assignedCol && <span className="font-mono text-xs opacity-70">← {assignedCol}</span>}
            </div>
          )
        })}
      </div>

      {!phoneAssigned && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
          <span>⚠️</span>
          <span>Field <strong>No HP/WA</strong> wajib di-mapping ke salah satu kolom sebelum import.</span>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => onImport(mapping)}
          disabled={!phoneAssigned || importing}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7FB300] text-white font-bold rounded-xl hover:bg-[#6B9700] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {importing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Mengimpor...
            </>
          ) : (
            <>📥 Import Sekarang</>
          )}
        </button>
      </div>
    </div>
  )
}
