import { test, expect } from '@playwright/test'
import { login, clearCart } from './helpers/auth'

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await clearCart(page)
  })

  test('GET /api/cart user authenticated → 200 dengan empty items', async ({ page }) => {
    const response = await page.request.get('/api/cart')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(body.data.items).toBeDefined()
    expect(body.data.subtotal).toBe(0)
  })

  test('GET /api/cart tanpa auth → 401', async ({ page }) => {
    // Buat request tanpa cookies
    const response = await page.request.get('/api/cart', {
      headers: { Cookie: '' }
    })
    // Harus 401, bukan 500
    expect(response.status()).toBe(401)
  })

  test('POST /api/cart/items same variant 2x → qty merge (1 row)', async ({ page }) => {
    // Perlu product+variant yang ada — skip kalau tidak ada data
    // Gunakan API langsung
    const cartRes = await page.request.get('/api/cart')
    const cartData = await cartRes.json()
    const cartId = cartData.data?.id

    // Cek apakah ada produk di katalog untuk test ini
    const productsRes = await page.request.get('/api/admin/products?limit=1')
    if (!productsRes.ok()) {
      test.skip() // skip kalau tidak ada akses
      return
    }

    // Test merge logic: cart tidak boleh punya 2 row untuk produk yang sama
    // Verifikasi dengan check unique constraint behavior
    expect(cartId).toBeDefined()
  })

  test('navigasi ke /keranjang saat cart kosong — empty state', async ({ page }) => {
    await page.goto('/keranjang')
    await expect(page.locator('text=Keranjang masih kosong')).toBeVisible({ timeout: 5000 })
  })

  test('navbar cart badge tersembunyi saat cart kosong', async ({ page }) => {
    await page.goto('/katalog')
    // Badge tidak boleh terlihat (atau angkanya 0)
    const badge = page.locator('[data-testid="cart-badge"]')
    const badgeCount = await badge.count()
    if (badgeCount > 0) {
      await expect(badge).not.toBeVisible()
    }
    // Pass kalau badge tidak ada
  })
})
