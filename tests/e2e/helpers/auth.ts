import { Page } from '@playwright/test'

export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e.test@evcmercato.com',
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
  name: 'E2E Test User',
}

export async function login(page: Page, redirectTo?: string) {
  const url = redirectTo ? `/login?redirect_to=${encodeURIComponent(redirectTo)}` : '/login'
  await page.goto(url)
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(redirectTo || '/dashboard', { timeout: 10000 })
}

export async function logout(page: Page) {
  await page.goto('/profile')
  await page.click('button:has-text("Keluar")')
  await page.waitForURL('/', { timeout: 5000 })
}

export async function clearCart(page: Page) {
  // Clear cart via API before test
  const response = await page.request.post('/api/cart/clear')
  return response.ok()
}
