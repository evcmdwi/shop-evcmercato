import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { checkAdminAuth } from '@/lib/admin-auth'
import { isKkiPhone, loadKkiPhones } from '@/lib/kki'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import LeadEditForm from './LeadEditForm'

// Detail satu lead (dibuka dari nama di Database Leads): data lengkap termasuk alamat,
// ubah data, status member/KKI, riwayat pesan WA & follow up.

const STATUS_LABEL: Record<string, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  interested: 'Tertarik',
  converted: 'Konversi',
  not_interested: 'Tidak Tertarik',
}

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Makassar', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

function waLink(phone: string) {
  const d = phone.replace(/\D/g, '')
  return `https://wa.me/${d.startsWith('0') ? '62' + d.slice(1) : d}`
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdminAuth()
  if (!auth.ok) redirect('/sambers-login')

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const admin = getSupabaseAdmin()
  const [{ data: lead }, { data: messages }, { data: followups }, kkiPhones] = await Promise.all([
    admin.from('leads').select('*').eq('id', id).maybeSingle(),
    admin.from('lead_messages').select('id, message, status, sent_at').eq('lead_id', id).order('sent_at', { ascending: false }).limit(50),
    admin.from('lead_followups').select('id, admin_code, created_at, expires_at, result, result_at').eq('lead_id', id).order('created_at', { ascending: false }).limit(50),
    loadKkiPhones(admin),
  ])
  if (!lead) notFound()
  const kkiViaMember = !lead.kki_distributor && isKkiPhone(kkiPhones, lead.phone)

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 border-b border-slate-50 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 whitespace-pre-line break-words">{value || '—'}</dd>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link href="/sambers/leads" className="text-sm text-slate-500 hover:underline">← Database Leads</Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-800">{lead.nama}</h1>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          {STATUS_LABEL[lead.status] ?? lead.status}
        </span>
        {lead.converted_user_id && (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">👤 Member</span>
        )}
        {(lead.kki_distributor || kkiViaMember) && (
          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">🚫 KKI</span>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <dl className="text-sm">
          {row('HP/WA', (
            <span className="flex flex-wrap items-center gap-3">
              <span className="font-mono">{lead.phone}</span>
              <a href={waLink(lead.phone)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-700 hover:underline">Buka WhatsApp ↗</a>
            </span>
          ))}
          {row('Kota', lead.kota)}
          {row('Alamat', lead.alamat)}
          {row('Interest', lead.interest)}
          {row('Catatan', lead.notes)}
          {row('Sumber', lead.source)}
          {row('Ditambahkan', fmt(lead.created_at))}
          {row('Diperbarui', fmt(lead.updated_at))}
          {lead.converted_user_id && row('Jadi member', (
            <span>
              {fmt(lead.converted_at)}{lead.converted_by_admin ? ` · admin ${lead.converted_by_admin}` : ''} ·{' '}
              <Link href={`/sambers/member/${lead.converted_user_id}`} className="text-[#5E8500] font-semibold hover:underline">Lihat member →</Link>
            </span>
          ))}
          {(lead.kki_distributor || kkiViaMember) && row('Distributor KKI', kkiViaMember
            ? 'Nomor ini ditandai KKI di halaman Member'
            : `Ditandai ${fmt(lead.kki_marked_at)}${lead.kki_note ? ` — ${lead.kki_note}` : ''}`)}
        </dl>
      </div>

      <LeadEditForm
        lead={{
          id: lead.id,
          nama: lead.nama ?? '',
          phone: lead.phone ?? '',
          kota: lead.kota ?? '',
          alamat: lead.alamat ?? '',
          interest: lead.interest ?? '',
          notes: lead.notes ?? '',
          status: lead.status,
        }}
        statusLabel={STATUS_LABEL}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-700 mb-3">Follow up</h2>
        {(followups ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">Belum pernah di-follow up.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(followups ?? []).map((f) => (
              <li key={f.id} className="text-slate-700">
                <span className="text-slate-400">{fmt(f.created_at)}</span> · admin <strong>{f.admin_code}</strong>
                {f.result ? ` · hasil: ${f.result}` : ''}
                {f.expires_at ? <span className="text-slate-400"> · dipegang s.d. {fmt(f.expires_at)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-700 mb-3">Pesan WA terkirim</h2>
        {(messages ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada pesan.</p>
        ) : (
          <ul className="space-y-3">
            {(messages ?? []).map((m) => (
              <li key={m.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-400 mb-1">
                  {fmt(m.sent_at)} · {m.status === 'sent' ? 'terkirim' : m.status === 'failed' ? <span className="text-red-600">gagal</span> : m.status}
                </p>
                <p className="whitespace-pre-wrap text-slate-700">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
