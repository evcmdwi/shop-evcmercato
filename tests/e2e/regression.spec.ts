import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Regression Tests — Bug fixes', () => {
  test('[BUG#1] GET /api/cart tidak return 500 untuk authenticated user', async ({ page }) => {
    await login(page)
    const response = await page.request.get('/api/cart')
    expect(response.status()).not.toBe(500)
    expect(response.status()).toBe(200)
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

  test('[BUG-NESTED] Tombol Beli di /katalog bisa diklik', async ({ page }) => {
    await page.goto('/katalog')
    await page.waitForSelector('[href*="/katalog/"]', { timeout: 5000 })
    // Tombol Beli harus ada dan clickable
    const beliBtn = page.locator('a:has-text("Beli")').first()
    await expect(beliBtn).toBeVisible()
    await expect(beliBtn).toBeEnabled()
  })
})
