'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LeadForm = { id: string; nama: string; phone: string; kota: string; alamat: string; interest: string; notes: string; status: string }

const input = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]'

export default function LeadEditForm({ lead, statusLabel }: { lead: LeadForm; statusLabel: Record<string, string> }) {
  const router = useRouter()
  const [form, setForm] = useState(lead)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const set = (k: keyof LeadForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama.trim() || !form.phone.trim()) return setMsg({ ok: false, text: 'Nama dan No HP wajib diisi' })
    setSaving(true); setMsg(null)
    try {
      const res = await fetch(`/api/sambers/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: form.nama.trim(),
          phone: form.phone.trim(),
          kota: form.kota.trim() || null,
          alamat: form.alamat.trim() || null,
          interest: form.interest.trim() || null,
          notes: form.notes.trim() || null,
          status: form.status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return setMsg({ ok: false, text: data.error || 'Gagal menyimpan' })
      setMsg({ ok: true, text: 'Tersimpan' })
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => { setForm(lead); setOpen(true); setMsg(null) }}
          className="px-4 py-2 text-sm font-semibold border border-slate-200 bg-white rounded-xl hover:bg-slate-50">
          ✏️ Ubah data lead
        </button>
        {msg?.ok && <span className="text-sm text-green-700">✅ {msg.text}</span>}
      </div>
    )
  }

  return (
    <form onSubmit={save} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <h2 className="sm:col-span-2 font-semibold text-slate-700">Ubah data lead</h2>
      <label className="block text-xs font-semibold text-slate-600">Nama *
        <input className={`${input} mt-1`} value={form.nama} onChange={(e) => set('nama', e.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-slate-600">No HP/WA *
        <input className={`${input} mt-1`} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-slate-600">Kota
        <input className={`${input} mt-1`} value={form.kota} onChange={(e) => set('kota', e.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-slate-600">Interest / Produk
        <input className={`${input} mt-1`} value={form.interest} onChange={(e) => set('interest', e.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">Alamat
        <textarea rows={3} className={`${input} mt-1 resize-y`} value={form.alamat} onChange={(e) => set('alamat', e.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">Catatan
        <textarea rows={3} className={`${input} mt-1 resize-y`} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-slate-600">Status
        <select className={`${input} mt-1`} value={form.status} onChange={(e) => set('status', e.target.value)}>
          {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {msg && !msg.ok && <p className="sm:col-span-2 bg-red-50 text-red-700 text-sm px-4 py-2 rounded-xl">{msg.text}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={saving}
          className="bg-[#7FB300] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6B9700] disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50">Batal</button>
      </div>
    </form>
  )
}
