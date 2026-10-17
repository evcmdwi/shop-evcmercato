// Pesan WA ke pembeli setelah Payment Link (PAYLINK-*) lunas.
export function paymentLinkPaidMessage(paidAt: string): string {
  const d = new Date(paidAt)
  const tgl = d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })
  const jam = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
  return (
    `Terima kasih untuk pembayaran Anda pada ${tgl} pukul ${jam} WIB, pesanan Anda akan segera diproses.\n\n` +
    `Pesan ini dikirimkan oleh sistem kami.`
  )
}
