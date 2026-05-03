'use client'
import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface WilayahResult {
  district_id: string
  district_name: string
  regency_id: string
  regency_name: string
  province_id: string
  province_name: string
  display: string
}

interface SelectedAddress {
  district_id: string
  district_name: string
  regency_id: string
  regency_name: string
  province_id: string
  province_name: string
}

interface Props {
  value: SelectedAddress | null
  onChange: (address: SelectedAddress | null) => void
  error?: string
}

export default function AddressAutocomplete({ value, onChange, error }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WilayahResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [fetchError, setFetchError] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    setFetchError(false)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    fetch(`/api/wilayah/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        setResults(data.results ?? [])
        setOpen(true)
        setActiveIndex(-1)
      })
      .catch(() => setFetchError(true))
      .finally(() => { setLoading(false); clearTimeout(timeout) })
    return () => { controller.abort(); clearTimeout(timeout) }
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: WilayahResult) => {
    onChange({
      district_id: item.district_id,
      district_name: item.district_name,
      regency_id: item.regency_id,
      regency_name: item.regency_name,
      province_id: item.province_id,
      province_name: item.province_name,
    })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleReset = () => {
    onChange(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(results[activeIndex]) }
    if (e.key === 'Escape') { setOpen(false) }
  }

  // SELECTED STATE
  if (value) {
    return (
      <div className={`border-2 rounded-xl p-4 ${error ? 'border-red-400' : 'border-[#7FB300] bg-[#F5FBE8]'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#7FB300] font-bold text-lg">✓</span>
              <span className="font-semibold text-gray-900">{value.district_name}</span>
            </div>
            <p className="text-sm text-gray-500">{value.regency_name}, {value.province_name}</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#7FB300] font-semibold border border-[#7FB300] rounded-lg px-3 py-1 hover:bg-[#E8F4D1] transition-colors whitespace-nowrap mt-1"
          >
            Ganti
          </button>
        </div>
      </div>
    )
  }

  // SEARCH STATE
  return (
    <div ref={wrapperRef} className="relative">
      <div className={`flex items-center border-2 rounded-xl px-4 py-3 gap-2 bg-white transition-colors ${error ? 'border-red-400' : open ? 'border-[#7FB300]' : 'border-gray-200 hover:border-gray-300'}`}>
        {loading
          ? <svg className="animate-spin w-4 h-4 text-[#7FB300] flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          : <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Ketik nama kecamatan..."
          className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Kecamatan tidak ditemukan. Coba kata kunci lain.
            </div>
          ) : fetchError ? (
            <div className="px-4 py-3 text-sm text-red-500 text-center">
              Gagal memuat. Coba lagi.
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={item.district_id}
                type="button"
                onMouseDown={() => handleSelect(item)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 min-h-[48px] transition-colors ${activeIndex === idx ? 'bg-[#E8F4D1]' : 'hover:bg-gray-50'}`}
              >
                <div className="font-semibold text-sm text-gray-900">{item.district_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.regency_name}, {item.province_name}</div>
              </button>
            ))
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
