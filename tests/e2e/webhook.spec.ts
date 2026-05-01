import { test, expect } from '@playwright/test'

const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || 'test-webhook-token'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Mock webhook payload dari Xendit
const PAID_PAYLOAD = {
  id: 'inv_test_123',
  external_id: 'mock-order-id-for-test',
  status: 'PAID',
  payment_method: 'BANK_TRANSFER',
  amount: 96000,
  paid_amount: 96000,
  paid_at: new Date().toISOString(),
  payer_email: 'test@evcmercato.com',
}

const EXPIRED_PAYLOAD = {
  ...PAID_PAYLOAD,
  status: 'EXPIRED',
  paid_at: undefined,
}

test.describe('Xendit Webhook', () => {
  test('webhook dengan invalid token → 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/xendit/webhook`, {
      headers: {
        'x-callback-token': 'wrong-token',
        'Content-Type': 'application/json',
      },
      data: PAID_PAYLOAD,
    })
    expect(response.status()).toBe(401)
  })

  test('webhook dengan valid token → 200 (even if order not found)', async ({ request }) => {
    // Dengan valid token, webhook harus return 200 (idempotent)
    // Order mungkin tidak ada di test DB, tapi 200 tetap di-return
    const response = await request.post(`${BASE_URL}/api/xendit/webhook`, {
      headers: {
        'x-callback-token': WEBHOOK_TOKEN,
        'Content-Type': 'application/json',
      },
      data: PAID_PAYLOAD,
    })
    // Webhook harus 200 (Xendit retry jika tidak 200)
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.received).toBe(true)
  })

  test('webhook EXPIRED dengan valid token → 200', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/xendit/webhook`, {
      headers: {
        'x-callback-token': WEBHOOK_TOKEN,
        'Content-Type': 'application/json',
      },
      data: EXPIRED_PAYLOAD,
    })
    expect(response.status()).toBe(200)
  })

  test('webhook dengan body invalid JSON → handled gracefully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/xendit/webhook`, {
      headers: {
        'x-callback-token': WEBHOOK_TOKEN,
        'Content-Type': 'application/json',
      },
      data: 'not-json',
    })
    // 400 Bad Request, bukan 500
    expect([400, 200]).toContain(response.status())
  })
})
