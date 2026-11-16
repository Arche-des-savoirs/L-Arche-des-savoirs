import { defineConfig } from '@playwright/test';

// Surface Go 3 : écran 1920 × 1280 à 150 % → fenêtre CSS d'environ 1280 × 853.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/L-Arche-des-savoirs/',
    viewport: { width: 1280, height: 853 },
    deviceScaleFactor: 1.5,
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
