import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Regression Tests — Bug fixes', () => {
  test('[BUG#1] GET /api/cart tidak return 500 untuk authenticated user', async ({ page }) => {
    await login(page)
    const response = await page.request.get('/api/cart')

    // Status check
    expect(response.status()).not.toBe(500)
    expect(response.status()).toBe(200)

    // Response shape validation
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(body.data).toBeDefined()
    expect(body.data).not.toBeNull()
    expect(typeof body.data).toBe('object')
    expect(body.data).toHaveProperty('items')
    expect(Array.isArray(body.data.items)).toBe(true)
    expect(body.data).toHaveProperty('item_count')
    expect(typeof body.data.item_count).toBe('number')
    expect(body.data).toHaveProperty('subtotal')
    expect(typeof body.data.subtotal).toBe('number')
  })

  test('[BUG#1b] GET /api/cart unauthenticated → 401 (bukan 500)', async ({ page }) => {
    // Akses tanpa login — harus 401 bukan 500
    const response = await page.request.get('/api/cart')
    expect(response.status()).toBe(401)
    expect(response.status()).not.toBe(500)
  })

  test('[BUG#3] Login redirect_to param dipakai setelah login', async ({ page }) => {
    await page.goto('/login?redirect_to=/katalog')
    await page.fill('input[type="email"]', 'e2e.test@evcmercato.com')
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/katalog/, { timeout: 10000 })
    expect(page.url()).toContain('/katalog')
  })

  test('[BUG-IMG] Gambar produk dari Supabase Storage tampil (tidak 400)', async ({ page }) => {
    await page.goto('/katalog')
    // Cek tidak ada image dengan error
    const failedImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs.filter(img => !img.complete || img.naturalWidth === 0).length
    })
    expect(failedImages).toBe(0)
  })

  test('[BUG-NESTED] Produk card di /katalog bisa diklik', async ({ page }) => {
    await page.goto('/katalog')
    // Card produk (Link ke detail) harus ada dan clickable
    // New design: entire card is a Link, no separate "Beli" button on card
    const productCard = page.locator('a[href*="/katalog/"]').first()
    await expect(productCard).toBeVisible({ timeout: 5000 })
    await expect(productCard).toBeEnabled()
  })
})
