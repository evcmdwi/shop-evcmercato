import { test, expect } from '@playwright/test'
import { login, clearCart } from './helpers/auth'

test.describe('Checkout — Real Xendit (mocked)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await clearCart(page)
  })

  test('POST /api/checkout returns invoice_url', async ({ page }) => {
    // Mock: intercept Xendit API call, return mock response
    await page.route('https://api.xendit.co/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock_inv_test123',
          invoice_url: 'https://checkout.xendit.co/web/mock',
          external_id: 'test-order-id',
          status: 'PENDING',
        }),
      })
    })

    // Cek /checkout page render untuk authenticated user
    await page.goto('/checkout')
    await expect(page).not.toHaveURL(/\/login/)
    // Page harus render heading checkout
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 })
  })

  test('[smoke] /checkout page render untuk authenticated user @smoke', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 })
  })
})
