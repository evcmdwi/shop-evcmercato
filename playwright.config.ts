import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const isLocalRun = !process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // sequential untuk e-commerce flow
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Auto-start Next.js when running locally (no PLAYWRIGHT_BASE_URL set).
  // When PLAYWRIGHT_BASE_URL is set (Vercel preview / production), the
  // external server is already running — skip local server startup.
  ...(isLocalRun
    ? {
        webServer: {
          command: 'npm run build && npm run start',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
          env: {
            // Forward all required env vars to the Next.js process
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
            ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '',
            NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '',
            XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY ?? '',
            XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN ?? '',
            RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
            RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? '',
            RESEND_FROM_NAME: process.env.RESEND_FROM_NAME ?? '',
          },
        },
      }
    : {}),


  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
