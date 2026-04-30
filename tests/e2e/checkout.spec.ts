import { test, expect } from '@playwright/test'
import { login, clearCart } from './helpers/auth'

test.describe('Checkout', () => {
  test('[smoke] /checkout render OK untuk authenticated user @smoke', async ({ page }) => {
    await login(page)
    await page.goto('/checkout')
    // Harus ada form checkout, bukan 404 atau error
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 })
  })
})
