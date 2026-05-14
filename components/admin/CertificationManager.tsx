'use client'
import { useState, useEffect } from 'react'

interface Certification {
  id: string
  authority: string
  cert_name: string
  cert_code: string
  expired_date: string | null
  is_verified: boolean
}

export default function CertificationManager({ productId }: { productId: string }) {
  const [certs, setCerts] = useState<Certification[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ authority: 'BPOM', cert_name: '', cert_code: '', expired_date: '' })

  const load = () => {
    fetch(`/api/sambers/products/${productId}/certifications`)
      .then(r => r.json())
      .then(d => setCerts(d.certifications ?? []))
      .catch(() => {})
  }

  useEffect(() => { load() }, [productId])

  const handleAdd = async () => {
    const res = await fetch(`/api/sambers/products/${productId}/certifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ authority: 'BPOM', cert_name: '', cert_code: '', expired_date: '' })
      setAdding(false)
      load()
    }
  }

  const handleDelete = async (certId: string) => {
    await fetch(`/api/sambers/products/${productId}/certifications?cert_id=${certId}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      {certs.length === 0 && !adding && (
        <p className="text-sm text-gray-400 mb-3">Belum ada sertifikasi.</p>
      )}
      <div className="space-y-2 mb-3">
        {certs.map(cert => (
          <div key={cert.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
            <div>
              <span className="text-xs font-semibold text-[#7FB300]">{cert.authority}</span>
              <span className="text-xs text-gray-500 ml-2">{cert.cert_name}</span>
              <span className="text-xs text-gray-400 ml-2">· {cert.cert_code}</span>
              {cert.expired_date && <span className="text-xs text-gray-400 ml-2">exp: {cert.expired_date}</span>}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(cert.id)}
              className="text-red-400 hover:text-red-600 text-xs px-2"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lembaga</label>
              <select
                value={form.authority}
                onChange={e => setForm(p => ({ ...p, authority: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option>BPOM</option>
                <option>LPPOM MUI</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama Sertifikasi</label>
              <input
                type="text"
                value={form.cert_name}
                onChange={e => setForm(p => ({ ...p, cert_name: e.target.value }))}
                placeholder="Suplemen Kesehatan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nomor Sertifikasi</label>
              <input
                type="text"
                value={form.cert_code}
                onChange={e => setForm(p => ({ ...p, cert_code: e.target.value }))}
                placeholder="SD245055771"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Exp. Date (opsional)</label>
              <input
                type="date"
                value={form.expired_date}
                onChange={e => setForm(p => ({ ...p, expired_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="text-sm bg-[#7FB300] text-white px-4 py-2 rounded-lg font-semibold"
            >
              Simpan
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-sm text-[#7FB300] font-semibold hover:underline"
        >
          + Tambah Sertifikasi
        </button>
      )}
    </div>
  )
}
