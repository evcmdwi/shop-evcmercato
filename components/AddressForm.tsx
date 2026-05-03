'use client'

import { useState, useEffect } from 'react'
import { Address } from '@/types/address'
import { getProvinces, getCitiesByProvince } from '@/lib/indonesia-regions'

interface AddressFormProps {
  initialData?: Address | null
  onSuccess: () => void
  onCancel: () => void
}

export default function AddressForm({ initialData, onSuccess, onCancel }: AddressFormProps) {
  const [form, setForm] = useState({
    recipient_name: initialData?.recipient_name ?? '',
    phone: initialData?.phone ?? '',
    province: initialData?.province ?? '',
    city: initialData?.city ?? '',
    postal_code: initialData?.postal_code ?? '',
    full_address: initialData?.full_address ?? '',
    is_default: initialData?.is_default ?? false,
  })
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const provinces = getProvinces()

  useEffect(() => {
    if (form.province) {
      const c = getCitiesByProvince(form.province)
      setCities(c)
      // reset city if province changed and current city not in new list
      if (!c.includes(form.city)) {
        setForm(prev => ({ ...prev, city: '' }))
      }
    } else {
      setCities([])
    }
  }, [form.province]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const validate = (): string | null => {
    if (!form.recipient_name.trim()) return 'Nama penerima wajib diisi'
    if (!form.phone.trim()) return 'Nomor telepon wajib diisi'
    if (form.phone.replace(/\D/g, '').length < 10) return 'Nomor telepon minimal 10 digit'
    if (!form.province) return 'Provinsi wajib dipilih'
    if (!form.city) return 'Kota wajib dipilih'
    if (!form.full_address.trim()) return 'Alamat lengkap wajib diisi'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const isEdit = !!initialData?.id
      const url = isEdit ? `/api/addresses/${initialData.id}` : '/api/addresses'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Gagal menyimpan alamat')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#7FB300] focus:border-transparent'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="recipient_name" className={labelClass}>Nama Penerima <span className="text-red-500">*</span></label>
        <input
          id="recipient_name"
          name="recipient_name"
          type="text"
          required
          value={form.recipient_name}
          onChange={handleChange}
          className={inputClass}
          placeholder="Nama lengkap penerima"
        />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Nomor Telepon <span className="text-red-500">*</span></label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          value={form.phone}
          onChange={handleChange}
          className={inputClass}
          placeholder="08xxxxxxxxxx"
        />
      </div>

      <div>
        <label htmlFor="province" className={labelClass}>Provinsi <span className="text-red-500">*</span></label>
        <select
          id="province"
          name="province"
          required
          value={form.province}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">Pilih Provinsi</option>
          {provinces.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="city" className={labelClass}>Kota / Kabupaten <span className="text-red-500">*</span></label>
        <select
          id="city"
          name="city"
          required
          value={form.city}
          onChange={handleChange}
          disabled={!form.province}
          className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-400`}
        >
          <option value="">{form.province ? 'Pilih Kota/Kabupaten' : 'Pilih provinsi dulu'}</option>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="postal_code" className={labelClass}>Kode Pos</label>
        <input
          id="postal_code"
          name="postal_code"
          type="text"
          value={form.postal_code}
          onChange={handleChange}
          className={inputClass}
          placeholder="Contoh: 76115"
          maxLength={5}
        />
      </div>

      <div>
        <label htmlFor="full_address" className={labelClass}>Alamat Lengkap <span className="text-red-500">*</span></label>
        <textarea
          id="full_address"
          name="full_address"
          required
          value={form.full_address}
          onChange={handleChange}
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="Nama jalan, No. rumah, RT/RW, Kelurahan, Kecamatan"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_default"
          name="is_default"
          type="checkbox"
          checked={form.is_default}
          onChange={handleChange}
          className="w-4 h-4 accent-[#7FB300]"
        />
        <label htmlFor="is_default" className="text-sm text-gray-700">Jadikan alamat utama</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#7FB300' }}
        >
          {loading ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Tambah Alamat'}
        </button>
      </div>
    </form>
  )
}
