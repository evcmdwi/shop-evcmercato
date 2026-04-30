import { test, expect } from '@playwright/test'
import { TEST_USER, login, logout } from './helpers/auth'

test.describe('Authentication', () => {
  test('login sukses redirect ke dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL('/dashboard')
  })

  test('login dengan redirect_to — harus redirect ke path tujuan', async ({ page }) => {
    await login(page, '/katalog')
    await expect(page).toHaveURL('/katalog')
  })

  test('login dengan redirect_to=/keranjang', async ({ page }) => {
    await login(page, '/keranjang')
    await expect(page).toHaveURL('/keranjang')
  })

  test('redirect_to ke external domain diabaikan (security)', async ({ page }) => {
    await page.goto('/login?redirect_to=https://evil.com')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    // Harus redirect ke /dashboard, bukan evil.com
    await expect(page).toHaveURL('/dashboard')
  })

  test('logout berhasil', async ({ page }) => {
    await login(page)
    await logout(page)
    // Setelah logout, akses /profile harus redirect ke login
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('akses /profile tanpa login redirect ke /login', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('akses /keranjang tanpa login redirect ke /login dengan redirect_to', async ({ page }) => {
    await page.goto('/keranjang')
    await expect(page).toHaveURL(/\/login\?redirect_to/)
    await expect(page.url()).toContain('keranjang')
  })
})
