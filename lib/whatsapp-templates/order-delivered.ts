export function generateOrderDeliveredBuyerWA(orderShortId: string, customerName: string, deliveredNote?: string): string {
  let message = `Halo ${customerName}! 🎉

Pesanan #${orderShortId} sudah selesai dan diterima.`

  if (deliveredNote?.trim()) {
    message += `

Catatan: ${deliveredNote.trim()}`
  }

  message += `

Semoga puas dan salam Sehat selalu 🙏🏽

Ada pertanyaan lain? Hub Kami di Official WA ini.`

  return message
}
