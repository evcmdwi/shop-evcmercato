export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount).replace('Rp\u00a0', 'Rp ')
}

export function formatPhone(phone: string): string {
  // Normalize Indonesian phone to 62xxx format
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) return '62' + clean.slice(1)
  if (clean.startsWith('62')) return clean
  if (clean.startsWith('+62')) return clean.slice(1)
  return '62' + clean
}
