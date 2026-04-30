import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Orders', () => {
  test('[smoke] /orders render OK untuk authenticated user @smoke', async ({ page }) => {
    await login(page)
    await page.goto('/orders')
    await expect(page).not.toHaveURL(/\/login/)
    // Either empty state or list
    const content = page.locator('text=Belum ada pesanan, text=Pesanan Saya').first()
    await expect(content).toBeVisible({ timeout: 5000 })
  })

  test('/orders redirect ke /login tanpa auth', async ({ page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
