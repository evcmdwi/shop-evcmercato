'use client'

import { useState, useRef } from 'react'
import { Printer } from 'lucide-react'

interface ResiForm {
  ekspedisi: 'jnt' | 'grab'
  noResi: string
  namaPenerima: string
  noPenerima: string
  alamatPenerima: string
  namaPengirim: string
  noPesanan: string
  tanggalPesanan: string
}

const today = new Date().toISOString().split('T')[0]

export default function CetakResiPage() {
  const [form, setForm] = useState<ResiForm>({
    ekspedisi: 'jnt',
    noResi: '',
    namaPenerima: '',
    noPenerima: '',
    alamatPenerima: '',
    namaPengirim: 'EVC Mercato',
    noPesanan: '',
    tanggalPesanan: today,
  })
  const printRef = useRef<HTMLDivElement>(null)

  const set = (k: keyof ResiForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const formatDate = (d: string) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handlePrint = () => {
    const content = printRef.current?.innerHTML
    if (!content) return
    const win = window.open('', '_blank', 'width=600,height=700')
    if (!win) return
    const barcodeScript = form.ekspedisi === 'jnt' && form.noResi
      ? `<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/barcodes/JsBarcode.code128.min.js"></script>
         <script>setTimeout(function(){ try { JsBarcode("#barcode-svg","${form.noResi}",{format:"CODE128",width:2,height:40,displayValue:false,margin:0}); } catch(e){} }, 100);</script>`
      : ''
    win.document.write(`<!DOCTYPE html>
<html><head>
<title>Resi ${form.noPesanan || 'Custom'}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#f5f5f5; font-family:system-ui,sans-serif; }
@media print { body { background:white; } }
.resi { width:10cm; height:10cm; border:2px solid black; background:white; display:flex; flex-direction:column; padding:0.2cm; overflow:hidden; }
.header { display:flex; justify-content:space-between; align-items:center; height:1.4cm; margin-bottom:0.12cm; border-bottom:1px solid #ccc; padding-bottom:0.1cm; }
.header-left span { font-size:0.55cm; color:#333; font-weight:bold; }
.courier-label { font-size:0.9cm; font-weight:900; letter-spacing:0.05cm; }
.barcode-section { display:flex; flex-direction:column; align-items:center; flex-shrink:0; border-bottom:1px solid #ccc; margin-bottom:0.1cm; padding:0.05cm 0; max-height:2.0cm; overflow:hidden; }
#barcode-svg { max-width:8cm; max-height:1.8cm; display:block; }
.resi-number-text { font-size:0.3cm; font-family:monospace; font-weight:bold; text-align:center; margin-top:0.05cm; }
.no-pesanan-text { font-size:0.32cm; font-family:monospace; font-weight:bold; text-align:center; border:1px dashed #999; padding:0.08cm; margin:0.08cm 0; }
.address-section { display:flex; flex:1; min-height:0; overflow:hidden; gap:0.15cm; margin-bottom:0.1cm; }
.penerima { flex:7; border-right:1px solid #ccc; padding-right:0.15cm; }
.pengirim { flex:3; }
.addr-heading { font-size:0.3cm; font-weight:bold; text-transform:uppercase; margin-bottom:0.08cm; }
.addr-name { font-size:0.44cm; font-weight:bold; line-height:1.2; }
.addr-phone { font-size:0.34cm; margin:0.06cm 0; }
.addr-detail { font-size:0.27cm; line-height:1.4; color:#333; }
.footer { display:flex; justify-content:space-between; flex-shrink:0; border-top:1px solid #ccc; padding-top:0.1cm; font-size:0.28cm; color:#555; }
</style>
</head><body>${content}${barcodeScript}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
  }

  const isComplete = form.namaPenerima && form.namaPengirim && form.noPesanan && (form.ekspedisi === 'grab' || form.noResi)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Cetak Resi</h1>
      <p className="text-sm text-slate-500 mb-6">Untuk pesanan di luar web (WA / offline)</p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        {/* Ekspedisi */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Ekspedisi</label>
          <div className="flex gap-4">
            {(['jnt', 'grab'] as const).map((e) => (
              <label key={e} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${form.ekspedisi === e ? 'border-[#7FB300] bg-[#F0F9E0]' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="ekspedisi" value={e} checked={form.ekspedisi === e}
                  onChange={() => set('ekspedisi', e)} className="accent-[#7FB300]" />
                <span className="font-semibold text-sm">{e === 'jnt' ? 'JNT' : 'Grab Express'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* No Resi JNT */}
        {form.ekspedisi === 'jnt' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              No Resi JNT <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.noResi} onChange={e => set('noResi', e.target.value)}
              placeholder="Contoh: JP0012345678"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
        )}

        {/* Nama Penerima */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Penerima <span className="text-red-400">*</span></label>
            <input type="text" value={form.namaPenerima} onChange={e => set('namaPenerima', e.target.value)}
              placeholder="Contoh: Sirrin Sumaya"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">No HP Penerima</label>
            <input type="text" value={form.noPenerima} onChange={e => set('noPenerima', e.target.value)}
              placeholder="08xxx"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
        </div>

        {/* Alamat Penerima */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alamat Penerima</label>
          <textarea value={form.alamatPenerima} onChange={e => set('alamatPenerima', e.target.value)}
            rows={2} placeholder="Jl. ..., Kecamatan, Kota, Provinsi"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300] resize-none" />
        </div>

        {/* Pengirim + No Pesanan */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Pengirim <span className="text-red-400">*</span></label>
            <input type="text" value={form.namaPengirim} onChange={e => set('namaPengirim', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">No Pesanan <span className="text-red-400">*</span></label>
            <input type="text" value={form.noPesanan} onChange={e => set('noPesanan', e.target.value)}
              placeholder="Contoh: WA-20260530-001"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
          </div>
        </div>

        {/* Tanggal */}
        <div className="w-1/2">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal Pesanan</label>
          <input type="date" value={form.tanggalPesanan} onChange={e => set('tanggalPesanan', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7FB300]" />
        </div>
      </div>

      {/* Preview Resi */}
      {isComplete && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700">Preview Resi</h2>
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-[#7FB300] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6B9700] transition-colors">
              <Printer className="w-4 h-4" />
              Cetak Resi
            </button>
          </div>

          {/* Resi preview box */}
          <div className="bg-gray-100 rounded-2xl p-6 flex justify-center">
            <div ref={printRef}>
              <div className="resi" style={{
                width: '10cm', height: '10cm', border: '2px solid black', background: 'white',
                display: 'flex', flexDirection: 'column', padding: '0.2cm', overflow: 'hidden',
                fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '1.4cm', marginBottom: '0.15cm', borderBottom: '1px solid #ccc', paddingBottom: '0.1cm', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.55cm', fontWeight: 'bold', color: '#333' }}>EVC Mercato</span>
                  <span style={{ fontSize: '0.75cm', fontWeight: '900', color: form.ekspedisi === 'jnt' ? '#d10000' : '#00B14F', letterSpacing: '0.05cm' }}>
                    {form.ekspedisi === 'jnt' ? 'JNT' : 'GRAB'}
                  </span>
                </div>

                {/* Barcode JNT or No Pesanan */}
                {form.ekspedisi === 'jnt' && form.noResi ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #ccc', marginBottom: '0.1cm', padding: '0.05cm 0', maxHeight: '2.0cm', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.3cm', fontFamily: 'monospace', fontWeight: 'bold', color: '#555' }}>No Resi: {form.noResi}</div>
                    <div style={{ fontSize: '0.25cm', fontFamily: 'monospace', color: '#888' }}>(Barcode tampil saat cetak)</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: '0.38cm', fontFamily: 'monospace', fontWeight: 'bold', border: '1px dashed #999', padding: '0.1cm', margin: '0.1cm 0', letterSpacing: '0.05cm', flexShrink: 0 }}>
                    {form.noPesanan}
                  </div>
                )}

                {/* Address section */}
                <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', gap: '0.15cm', marginBottom: '0.1cm' }}>
                  {/* Penerima */}
                  <div style={{ flex: 7, borderRight: '1px solid #ccc', paddingRight: '0.15cm', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.3cm', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.08cm' }}>PENERIMA</div>
                    <div style={{ fontSize: '0.44cm', fontWeight: 'bold', lineHeight: 1.2 }}>{form.namaPenerima}</div>
                    {form.noPenerima && <div style={{ fontSize: '0.34cm', margin: '0.06cm 0' }}>{form.noPenerima}</div>}
                    {form.alamatPenerima && <div style={{ fontSize: '0.27cm', lineHeight: 1.4, color: '#333' }}>{form.alamatPenerima}</div>}
                  </div>
                  {/* Pengirim */}
                  <div style={{ flex: 3, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.3cm', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.08cm' }}>PENGIRIM</div>
                    <div style={{ fontSize: '0.36cm', fontWeight: 'bold', lineHeight: 1.2 }}>{form.namaPengirim}</div>
                    <div style={{ fontSize: '0.27cm', color: '#555', marginTop: '0.05cm' }}>Balikpapan</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0, borderTop: '1px solid #ccc', paddingTop: '0.1cm', fontSize: '0.28cm', color: '#555' }}>
                  <span>{formatDate(form.tanggalPesanan)}</span>
                  <span>shop.evcmercato.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isComplete && (
        <p className="mt-4 text-sm text-slate-400 text-center">Isi Nama Penerima, Nama Pengirim, dan No Pesanan untuk preview resi</p>
      )}
    </div>
  )
}
