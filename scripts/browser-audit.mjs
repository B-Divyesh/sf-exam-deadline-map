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
page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText }));

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

await page.getByRole('button', { name: /Draw my plan/i }).click();
await page.locator('.day-card').first().waitFor();
const planAccessibility = await new AxeBuilder({ page }).analyze();
serious = serious.concat(planAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact || '')));
const days = await page.locator('.day-card').count();
await page.locator('.day-check').first().check();
await page.waitForTimeout(300);
await page.reload({ waitUntil: 'networkidle' });
const persisted = await page.locator('.day-check').first().isChecked();

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
const result = { seriousAxeViolations: serious.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map((node) => node.html) })), onlineConsoleErrors: onlineErrors, allConsoleErrors: errors, requestFailures, cachedUrls, controller, skipLinkFocused, generatedDays: days, persisted, offlineDays, offlinePage };
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (serious.length || onlineErrors.length || !skipLinkFocused || !persisted || !days || offlineDays !== days) process.exit(1);
