export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Harga range untuk produk varian
export function formatPriceRange(variants: { price: number; is_active: boolean }[]): string {
  const activePrices = variants
    .filter(v => v.is_active)
    .map(v => v.price)

  if (activePrices.length === 0) return 'Rp 0'

  const min = Math.min(...activePrices)
  const max = Math.max(...activePrices)

  if (min === max) return formatRupiah(min)
  return `${formatRupiah(min)} - ${formatRupiah(max)}`
}

// Total stok dari semua varian aktif
export function getTotalStock(variants: { stock: number; is_active: boolean }[]): number {
  return variants
    .filter(v => v.is_active)
    .reduce((sum, v) => sum + v.stock, 0)
}

// Format sold count Tokopedia style
export function formatSoldCount(n: number): string {
  if (n < 1000) return `${n} terjual`
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.', ',')}rb terjual`
  if (n < 1000000) return `${Math.floor(n / 1000)}rb terjual`
  return `${(n / 1000000).toFixed(1).replace('.', ',')}jt terjual`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function deslugify(slug: string): string {
  return slug.replace(/-/g, ' ')
}
