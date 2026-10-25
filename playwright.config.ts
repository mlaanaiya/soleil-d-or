import { defineConfig, devices } from '@playwright/test'

const PORT = 3200
const BASE = `http://localhost:${PORT}`

/**
 * End-to-end tests run against the production build (`npm run build` first) with a fresh
 * data directory, seeded on boot from the restaurant's photographs.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: BASE, trace: 'retain-on-failure', locale: 'fr-FR', timezoneId: 'Europe/Paris' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `node -e "require('fs').rmSync('.e2e-data',{recursive:true,force:true})" && npx next start -p ${PORT}`,
    url: `${BASE}/robots.txt`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATA_DIR: '.e2e-data',
      SITE_URL: BASE,
      ADMIN_USERNAME: 'e2e',
      ADMIN_PASSWORD: 'e2e-mot-de-passe',
      NODE_ENV: 'production',
    },
  },
})
