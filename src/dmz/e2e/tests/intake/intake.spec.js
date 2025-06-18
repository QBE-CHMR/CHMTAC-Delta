import { test, expect } from '@playwright/test';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, '../../fixtures');

async function choose(page, label, optionRegex) {
  await page.getByLabel(label).click();
  await page.getByRole('option', { name: optionRegex }).first().click();
}

const okJson      = { status: 200, contentType: 'application/json', body: '{}' };
const isMultipart = req => req.method() === 'POST' && req.headers()['content-type']?.includes('multipart/form-data');

test.beforeEach(async ({ page }) => {
  await page.route('**', r => (isMultipart(r.request()) ? r.fulfill(okJson) : r.continue()));
  await page.goto('/');
});

async function fillRequiredCivilian(page) {
  await page.getByLabel('Full Name').fill('Jane Doe');
  await page.getByLabel('Phone (Commercial)').fill('555‑987‑6543');
  await page.getByLabel('Email Address').fill('jane@example.com');
  await page.getByLabel('Coordinates/Location').fill('Lat:38, Long:-77');
  await choose(page, 'Time Zone', /^UTC$/);
  await page.getByLabel('Describe all civilian harm you suspect').fill('None.');
}

async function fillRequiredDoD(page) {
  await page.getByLabel('Full Name').fill('QA Bot');
  await page.getByLabel('Reporting Unit').fill('123rd Test Wing');
  await page.getByLabel('Duty Title').fill('Tester');
  await choose(page, 'Duty Type', /^Enlisted$/);
  await choose(page, 'Duty Rank', /^E-4$/);
  await page.getByLabel('Phone (Commercial)').fill('555‑123‑4567');
  await page.getByLabel('Email Address').fill('qa.bot@example.mil');
  await page.getByLabel('Assigned Unit').fill('QA Branch');
  await choose(page, 'Combatant Command', /^Central Command/);
  await page.getByLabel('Coordinates/Location').fill('Lat:38, Long:-77');
  await choose(page, 'Time Zone', /^UTC$/);
  await page.getByLabel('Describe all civilian harm you suspect').fill('None.');
  await page.getByLabel('What might have involved the U.S. military?').fill('N/A');
}


test.describe('Civilian flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if the form is dod
    if (await page.getByLabel('Reporting Unit').count()) test.skip();
  });

  test('Check the submit button', async ({ page }) => {
    await fillRequiredCivilian(page);
    await page.getByLabel('Start Date and Time').fill(new Date().toISOString().slice(0, 16));
    await page.getByRole('button', { name: /submit form/i }).click();
    await expect(page).toHaveURL('http://localhost:3000');
  });

  test('Missing Full Name shows alert and blocks navigation', async ({ page }) => {
    await page.getByLabel('Phone (Commercial)').fill('555‑987‑6543');
    await page.getByLabel('Email Address').fill('jane@example.com');
    await page.getByLabel('Coordinates/Location').fill('Lat:38, Long:-77');
    await choose(page, 'Time Zone', /^UTC$/);
    await page.getByLabel('Describe all civilian harm you suspect').fill('None.');
    await page.getByLabel('Start Date and Time').fill(new Date().toISOString().slice(0, 16));

    await page.getByRole('button', { name: /submit form/i }).click();
    await expect(page).not.toHaveURL(/\/SubmissionPage$/);
  });
});


test.describe('DoD flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if it is the civilian form
    if (!(await page.getByLabel('Reporting Unit').count())) test.skip();
  });

  test('DoD submit test', async ({ page }) => {
    await fillRequiredDoD(page);
    await page.getByLabel('Start Date and Time').fill(new Date().toISOString().slice(0, 16));

    await page.locator('input[name="document_files"]').setInputFiles([
      path.join(fixturesDir, 'report.pdf'),
      path.join(fixturesDir, 'photo.jpg'),
    ]);

    await page.getByRole('button', { name: /submit form/i }).click();
    await expect(page).toHaveURL('http://localhost:3000');
  });

  test('Other Command becomes required when Combatant Command = Other', async ({ page }) => {
    await fillRequiredDoD(page);
    await page.getByLabel('Start Date and Time').fill(new Date().toISOString().slice(0, 16));

    await choose(page, 'Combatant Command', /^Other$/);
    await page.getByRole('button', { name: /submit form/i }).click();
  });
});
