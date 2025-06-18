import { test, expect } from '@playwright/test';

const list = {
  totalCount: 2,
  reports: [
    { id: 'r-001', status: 'submitted',  submittedAt: '2025‑06‑07T10:00:00Z' },
    { id: 'r-002', status: 'promotable', submittedAt: '2025‑06‑08T11:00:00Z' },
  ],
};
const details = {
  ...list.reports[0],
  full_name: 'John Doe',
  phone_number: '555‑123‑1234',
  email_address: 'john@example.com',
  location: 'Lat:38, Long:-77',
  total_harm: 'None',
  filereferences: [],
};

test('Management list → view → update', async ({ page }) => {
  /* mock list + detail + update */
  await page.route('**/management?*', r => r.fulfill({ status: 200, body: JSON.stringify(list) }));
  await page.route('**/management/r-001', r => {
    if (r.request().method() === 'GET')
      return r.fulfill({ status: 200, body: JSON.stringify(details) });
    if (r.request().method() === 'PUT')
      return r.fulfill({ status: 200, body: '{}' });
    r.fallback();
  });

  await page.goto('/');                         // SPA mounts at root

  await expect(page.getByRole('row', { name: /r-001/i })).toBeVisible();

  await page.getByRole('button', { name: /^view$/i }).first().click();
  await expect(page.getByText('John Doe')).toBeVisible();

  await page.getByRole('button', { name: /^update$/i }).first().click();
  await page.getByLabel('New Status').click();
  await page.getByRole('option', { name: /^Promotable$/ }).click();
  await page.getByRole('button', { name: /^save$/i }).click();

  await expect(
    page.getByRole('row', { name: /r-001/i }).getByText('Promotable')
  ).toBeVisible();
});
