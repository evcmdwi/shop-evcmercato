export function generateAffiliateApprovedWA(customerName: string, affiliateCode: string, customNotes?: string): string {
  let msg = `🎉 Selamat, ${customerName}!

Pengajuan affiliate Anda telah DISETUJUI.

Kode Affiliate Anda: *${affiliateCode}*

Login ke shop.evcmercato.com → menu "Affiliate Program" untuk mulai generate link dan promosi.`

  if (customNotes?.trim()) msg += `\n\n📝 Catatan dari admin:\n${customNotes.trim()}`
  msg += `\n\nSelamat berbisnis!\n— Tim EVC Mercato`
  return msg
}

export function generateAffiliateRejectedWA(customerName: string, reason: string): string {
  return `Halo ${customerName},

Mohon maaf, pengajuan affiliate Anda belum dapat kami setujui dengan alasan:

${reason}

Anda dapat mengajukan kembali setelah memperbaiki informasi yang diperlukan.

Terima kasih.
— Tim EVC Mercato`
}

export function generateAffiliateNewMemberWA(affiliateName: string, memberFirstName: string, memberLastInitial: string): string {
  return `✨ Member baru lewat link Anda!

${memberFirstName} ${memberLastInitial}. baru saja bergabung EVC Mercato via link affiliate Anda.

Setiap pembelian mereka akan tercatat sebagai PV Anda — termasuk pembelian di masa depan!

— Tim EVC Mercato`
}

export function generateAffiliateOrderValidWA(
  affiliateName: string,
  orderShortId: string,
  memberFirstName: string,
  memberLastInitial: string,
  pvEarned: number,
  totalPeriodPv: number
): string {
  return `🎉 PV baru masuk!

Order #${orderShortId}
Member: ${memberFirstName} ${memberLastInitial}.
PV earned: ${pvEarned.toLocaleString('id-ID')}

Total PV periode ini: ${totalPeriodPv.toLocaleString('id-ID')}

Cek detail di: shop.evcmercato.com → Affiliate Dashboard

— Tim EVC Mercato`
}

export function generateAffiliateSuspendedWA(customerName: string, reason: string): string {
  return `⚠️ Akun Affiliate Anda Disuspend

Halo ${customerName},

Akun affiliate Anda telah disuspend dengan alasan:

${reason}

Hubungi admin EVC untuk informasi lebih lanjut.

— Tim EVC Mercato`
}
