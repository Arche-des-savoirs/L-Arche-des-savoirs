import { defineConfig } from '@playwright/test';

// Surface Go 3 mesurée le 16/11 : fenêtre CSS 1239 × 775 à l'échelle 1,55 (app installée).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/L-Arche-des-savoirs/',
    viewport: { width: 1239, height: 775 },
    deviceScaleFactor: 1.55,
    hasTouch: true,
    locale: 'fr-FR',
    serviceWorkers: 'allow'
  },
  projects: [{ name: 'surface-go-3', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/L-Arche-des-savoirs/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
