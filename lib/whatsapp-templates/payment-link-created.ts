// Pesan WA berisi payment link, dikirim saat admin membuat link dengan No. WA.
export function paymentLinkCreatedMessage(nominal: number, deskripsi: string, url: string): string {
  return (
    `Pesanan Anda di EVC Mercato\n` +
    `Rp. ${new Intl.NumberFormat('id-ID').format(nominal)}\n` +
    `Untuk pembayaran: ${deskripsi}\n\n` +
    `Dapat dibayar melalui link dibawah ini:\n` +
    `${url}\n\n` +
    `Terima kasih`
  )
}
