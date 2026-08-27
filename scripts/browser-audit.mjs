import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const url = process.env.AUDIT_URL || 'http://127.0.0.1:4173';
const executablePath = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
const requestFailures = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('requestfailed', (request) => {
  const error = request.failure()?.errorText;
  // Navigation intentionally cancels in-flight image fetches before the
  // offline-reload exercise; retain every genuine network failure.
  if (error !== 'net::ERR_ABORTED') requestFailures.push({ url: request.url(), error });
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
const skipLinkFocused = await page.evaluate(() => document.activeElement?.classList.contains('skip-link') || false);
await page.keyboard.press('Escape');
const accessibility = await new AxeBuilder({ page }).analyze();
let serious = accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''));
await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
await page.waitForTimeout(150);
const darkAccessibility = await new AxeBuilder({ page }).analyze();
serious = serious.concat(darkAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')));
await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
const onlineErrors = [...errors];

await page.getByLabel('Deck name').fill('Biology finals');
await page.getByLabel('Cards seen before').fill('300');
await page.getByLabel('Brand-new cards').fill('80');
await page.getByLabel('Brand-new cards').press('Enter');
await page.locator('.day-card').first().waitFor();
const planAccessibility = await new AxeBuilder({ page }).analyze();
serious = serious.concat(planAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')));
await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
const darkPlanMobileAccessibility = await new AxeBuilder({ page }).analyze();
serious = serious.concat(darkPlanMobileAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')));
await page.setViewportSize({ width: 1440, height: 900 });
const darkPlanDesktopAccessibility = await new AxeBuilder({ page }).analyze();
serious = serious.concat(darkPlanDesktopAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')));
await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
await page.setViewportSize({ width: 390, height: 844 });
const days = await page.locator('.day-card').count();
await page.locator('.day-check').first().focus();
await page.keyboard.press('Space');
await page.waitForTimeout(300);
await page.reload({ waitUntil: 'networkidle' });
const persisted = await page.locator('.day-check').first().isChecked();
const download = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export calendar CSV' }).focus();
await page.keyboard.press('Enter');
const keyboardExported = Boolean(await download);

await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: 'networkidle' });
const cachedUrls = await page.evaluate(async () => {
  const names = await caches.keys();
  return (await Promise.all(names.map(async (name) => (await caches.open(name)).keys()))).flat().map((request) => request.url);
});
const controller = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || null);
await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('.day-card').first().waitFor({ timeout: 5000 }).catch(() => undefined);
const offlineDays = await page.locator('.day-card').count();
await context.setOffline(false);

const offlinePage = { title: await page.title(), text: (await page.locator('body').innerText()).slice(0, 300), htmlLength: (await page.content()).length, scripts: await page.locator('script[src]').evaluateAll((items) => items.map((item) => item.src)) };
await page.getByRole('button', { name: 'Your data' }).click();
await page.locator('#import-json').setInputFiles({ name: 'invalid-backup.json', mimeType: 'application/json', buffer: Buffer.from('{"input":{}}') });
const malformedImportMessage = await page.locator('#toast').innerText();
const malformedImportRetainedPlan = await page.locator('.day-card').count() === days;
await page.keyboard.press('Escape');

await page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('exam-deadline-map', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('state', 'readwrite');
    transaction.objectStore('state').put({ input: {} }, 'current');
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error);
  });
});
await page.reload({ waitUntil: 'networkidle' });
const recoveryVisible = await page.getByRole('button', { name: 'Clear invalid local data' }).isVisible();
await page.getByRole('button', { name: 'Clear invalid local data' }).click();
await page.getByRole('button', { name: 'Clear invalid local data' }).waitFor({ state: 'detached' });
const recoveryCleared = await page.getByRole('button', { name: 'Clear invalid local data' }).count() === 0;

const result = { seriousAxeViolations: serious.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map((node) => node.html) })), onlineConsoleErrors: onlineErrors, allConsoleErrors: errors, requestFailures, cachedUrls, controller, skipLinkFocused, generatedDays: days, persisted, keyboardExported, offlineDays, offlinePage, malformedImportMessage, malformedImportRetainedPlan, darkPlanMobileAxe: darkPlanMobileAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).map((item) => item.id), darkPlanDesktopAxe: darkPlanDesktopAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')).map((item) => item.id), recoveryVisible, recoveryCleared };
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (serious.length || onlineErrors.length || requestFailures.length || !skipLinkFocused || !persisted || !keyboardExported || !days || offlineDays !== days || malformedImportMessage !== 'That backup is not valid. No data was changed.' || !malformedImportRetainedPlan || !recoveryVisible || !recoveryCleared) process.exit(1);
