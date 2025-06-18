// e2e/playwright.config.js
// ------------------------------------------------------
// Runs against docker-compose (3000=intake UI, 3001=management UI)

import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

const PORT_INTAKE = process.env.PORT_INTAKE    || 3000;
const PORT_MAINT  = process.env.PORT_DMZ_MAINT || 3001;

export default defineConfig({
  timeout: 30_000,
  reporter: [['html', { open: 'never' }]],

  use: {
    headless: true,
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'intake',
      testDir: './tests/intake',
      use: {
        baseURL: `http://localhost:${PORT_INTAKE}`,
        permissions: ['geolocation'],
        geolocation: { latitude: 38, longitude: -77 },
      },
    },
    {
      name: 'maint',
      testDir: './tests/maint',
      use: {
        baseURL: `http://localhost:${PORT_MAINT}`,
      },
    },
  ],
});
