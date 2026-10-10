import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { startPreview } from './preview-server.mjs';

await mkdir('artifacts', { recursive: true });
const report = { date: new Date().toISOString(), checks: [], viewports: [], contrast: [], errors: [], failedRequests: [], accessibility: [] };
const { server, url } = await startPreview();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.on('pageerror', error => report.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
page.on('response', response => { if (response.status() >= 400) report.failedRequests.push({ url: response.url(), status: response.status() }); });
const cards = () => page.locator('.post-card');
async function check(name, fn) {
  try { await fn(); report.checks.push({ name, result: 'PASS' }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, result: 'FAIL', error: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}
async function home() { await page.goto(url); await page.evaluate(() => document.fonts.ready); }
function contrast(foreground, background) {
  function luminance(color) {
    const components = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
    return components[0] * .2126 + components[1] * .7152 + components[2] * .0722;
  }
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

try {
  await check('Static subpath, metadata, local assets, and font', async () => {
    await home();
    assert.equal(await page.title(), 'The Pond — Top Identity.md tweets');
    assert.equal(await page.locator('h1').count(), 1);
    for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:image"]']) assert.ok(await page.locator(selector).getAttribute('content'));
    const sourceUrls = await page.locator('script[src],link[href],img[src]').evaluateAll(elements => elements.map(element => element.getAttribute('src') || element.getAttribute('href')));
    assert.ok(sourceUrls.every(path => !path.startsWith('/')), 'All runtime asset paths must be relative');
    for (const asset of ['favicon.svg', 'assets/pepe-squad.webp', 'assets/pond-social.jpg', 'assets/space-grotesk-latin.woff2']) assert.equal((await page.request.get(url + asset)).status(), 200);
    assert.equal(await page.evaluate(() => document.fonts.check('500 16px "Space Grotesk"')), true);
    assert.equal(await cards().count(), 4);
  });
  await check('Load more reveals the complete 8-post edition', async () => {
    await page.getByRole('button', { name: 'Show 4 more posts' }).click();
    assert.equal(await cards().count(), 8);
    assert.ok(await page.getByText('You’re all caught up with this selection.').isVisible());
  });
  await check('Topic filters and selected state', async () => {
    await page.getByRole('button', { name: 'Building', exact: true }).click();
    assert.equal(await cards().count(), 3);
    assert.equal(await page.getByRole('button', { name: 'Building', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.ok((await cards().locator('.topic-badge').allTextContents()).every(text => text === 'Building'));
    await page.getByRole('button', { name: 'Ecosystem', exact: true }).click();
    assert.equal(await cards().count(), 2);
  });
  await check('Search combines with topics and matches author handles', async () => {
    await page.getByRole('searchbox', { name: 'Search the feed' }).fill('  GOTHSA  ');
    assert.equal(await cards().count(), 1);
    await page.getByRole('button', { name: 'All posts', exact: true }).click();
    assert.equal(await cards().count(), 3);
  });
  await check('No-result state gives a working filter reset', async () => {
    await page.getByRole('searchbox').fill('a-query-with-no-matches');
    assert.equal(await cards().count(), 0);
    assert.ok(await page.getByText('Nothing in this corner of the pond.').isVisible());
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    assert.equal(await cards().count(), 4);
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
    assert.equal(await page.getByRole('searchbox').evaluate(node => node === document.activeElement), true);
  });
  await check('Newest and most-liked sort, including missing counts last', async () => {
    await page.getByRole('combobox', { name: 'Sort posts' }).selectOption('latest');
    assert.equal(await cards().first().getAttribute('data-post-id'), '2108737561514397824');
    await page.getByRole('combobox', { name: 'Sort posts' }).selectOption('likes');
    assert.equal(await cards().first().getAttribute('data-post-id'), '2096592364391240143');
    await page.getByRole('button', { name: 'Show 4 more posts' }).click();
    assert.equal(await cards().last().getAttribute('data-post-id'), '2108217956237009290');
  });
  await check('Save a post, show saved view, and persist across reload', async () => {
    await home();
    await cards().first().getByRole('button', { name: /^Save / }).click();
    assert.equal(await cards().first().locator('.save-button').getAttribute('aria-pressed'), 'true');
    await page.getByRole('link', { name: /^Saved posts/ }).click();
    assert.equal(await cards().count(), 1);
    await page.reload();
    assert.equal(await cards().count(), 1);
    assert.equal(await page.locator('#feed-heading').textContent(), 'Saved posts.');
  });
  await check('Unsave the final saved post and recover from the empty state', async () => {
    await cards().first().getByRole('button', { name: /^Unsave / }).click();
    assert.equal(await cards().count(), 0);
    assert.ok(await page.getByText('Keep a little signal.').isVisible());
    assert.equal(await page.locator('#feed-heading').evaluate(node => node === document.activeElement), true);
    await page.locator('.empty-state').getByRole('link', { name: 'Explore the feed' }).click();
    assert.equal(await cards().count(), 4);
  });
  await check('Hash history restores Saved and Feed views', async () => {
    await page.goBack();
    assert.ok(await page.getByText('Keep a little signal.').isVisible());
    await page.goForward();
    assert.equal(await cards().count(), 4);
  });
  await check('Copy-link action writes the original post URL', async () => {
    await cards().first().getByRole('button', { name: /^Copy link/ }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copied, 'https://x.com/taylor_/status/2108217956237009290');
    assert.ok(await page.locator('.toast-visible').getByText('Post link copied to your clipboard.').isVisible());
    await page.getByRole('button', { name: 'Dismiss message' }).click();
    assert.equal(await page.locator('.toast-visible').count(), 0);
  });
  await check('Original-post navigation opens the correct X URL', async () => {
    await context.route('https://x.com/**', route => route.fulfill({ status: 200, body: 'External navigation captured for validation.' }));
    const popupPromise = context.waitForEvent('page');
    await cards().first().getByRole('link', { name: /^Read .* on X/ }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    assert.equal(popup.url(), 'https://x.com/taylor_/status/2108217956237009290');
    await popup.close();
    await context.unroute('https://x.com/**');
  });
  await check('About dialog, source disclosure, focus trap and Escape return', async () => {
    await page.getByRole('button', { name: 'About the feed', exact: true }).focus();
    await page.keyboard.press('Enter');
    assert.ok(await page.getByRole('dialog').isVisible());
    assert.equal(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), true);
    await page.getByText('View the 8 source records').click();
    assert.equal(await page.locator('.source-list a').count(), 8);
    await page.getByRole('button', { name: 'Back to the pond' }).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('button', { name: 'Close about the feed' }).evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'About the feed', exact: true }).evaluate(node => node === document.activeElement), true);
  });
  await check('Keyboard skip link, search, filters and visible focus style', async () => {
    await home();
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('link', { name: 'Skip to content' }).evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Enter');
    await page.getByRole('searchbox').focus();
    await page.keyboard.type('swarm');
    assert.ok(await cards().count() > 0);
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('button', { name: 'Clear search' }).evaluate(node => node === document.activeElement), true);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('button', { name: 'All posts', exact: true }).evaluate(node => node === document.activeElement), true);
    const focus = await page.evaluate(() => ({ width: getComputedStyle(document.activeElement).outlineWidth, color: getComputedStyle(document.activeElement).outlineColor }));
    assert.equal(focus.width, '2px');
    await page.screenshot({ path: 'artifacts/keyboard-focus.jpg', type: 'jpeg', quality: 82 });
  });
  await check('Blocked browser storage retains session saves and explains persistence', async () => {
    const isolated = await browser.newContext();
    await isolated.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); }; });
    const denied = await isolated.newPage();
    await denied.goto(url);
    await denied.locator('.save-button').first().click();
    assert.ok(await denied.getByRole('alert').getByText(/Your browser blocked storage/).isVisible());
    await denied.getByRole('link', { name: /^Saved posts/ }).click();
    assert.equal(await denied.locator('.post-card').count(), 1);
    await isolated.close();
  });
  await check('Corrupt storage does not break the app', async () => {
    const isolated = await browser.newContext();
    await isolated.addInitScript(() => localStorage.setItem('identitymd-pond:saved:v1', '{malformed'));
    const corrupt = await isolated.newPage();
    await corrupt.goto(url + '#saved');
    assert.ok(await corrupt.getByText('Keep a little signal.').isVisible());
    await isolated.close();
  });
  await check('Clipboard denial shows an actionable error', async () => {
    const isolated = await browser.newContext();
    await isolated.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Denied')) } }); });
    const denied = await isolated.newPage();
    await denied.goto(url);
    await denied.locator('.copy-button').first().click();
    assert.ok(await denied.locator('.toast-visible').getByText(/Use Read on X/).isVisible());
    await isolated.close();
  });
  for (const width of [320, 390, 720, 900, 1100, 1440]) {
    await check(`Rendered layout at ${width}px, no horizontal overflow`, async () => {
      await page.setViewportSize({ width, height: width < 721 ? 844 : 1000 });
      await home();
      const metrics = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, heroActionBottom: document.querySelector('.hero .button').getBoundingClientRect().bottom, height: innerHeight }));
      report.viewports.push({ width, ...metrics });
      assert.ok(metrics.document <= width, `Document overflows by ${metrics.document - width}px`);
      assert.ok(metrics.heroActionBottom < metrics.height, 'Primary action must be in the first screen');
      if ([320, 390, 900, 1440].includes(width)) await page.screenshot({ path: `artifacts/viewport-${width}.jpg`, type: 'jpeg', quality: 85, fullPage: true });
      if (width === 390) await page.screenshot({ path: 'artifacts/mobile-first-screen.jpg', type: 'jpeg', quality: 90 });
      if ([390, 1440].includes(width)) {
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        report.accessibility.push({ width, violations: results.violations.map(item => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.map(node => node.target) })), incomplete: results.incomplete.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })) });
        assert.equal(results.violations.length, 0, results.violations.map(item => `${item.id}: ${item.nodes.map(node => node.target).join(', ')}`).join('; '));
      }
    });
  }
  await check('200% text enlargement and 320px reflow', async () => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await home();
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('searchbox').fill('swarm');
    assert.ok(await cards().count() > 0);
    await page.screenshot({ path: 'artifacts/text-enlargement.jpg', type: 'jpeg', quality: 80, fullPage: true });
  });
  await check('Reduced-motion mode disables interactive transitions', async () => {
    await home();
    assert.equal(await page.locator('.button-primary').first().evaluate(node => getComputedStyle(node).transitionDuration), '0s');
  });
  await check('Forced colors preserves explicit focus and selected boundaries', async () => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.getByRole('button', { name: 'All posts', exact: true }).focus();
    assert.equal(await page.locator('.filter-chip.selected').evaluate(node => getComputedStyle(node).borderTopWidth), '2px');
    assert.equal(await page.locator('.filter-chip.selected').evaluate(node => getComputedStyle(node).outlineWidth), '2px');
    await page.emulateMedia({ forcedColors: 'none' });
  });
  await check('Measured contrast for solid rendered text and control surfaces', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await home();
    for (const [label, selector, backgroundSelector, threshold] of [
      ['Card heading', '.post-copy h3', '.post-card', 4.5],
      ['Card body', '.post-copy p', '.post-card', 4.5],
      ['Secondary author handle', '.author-details > span', '.post-card', 4.5],
      ['Primary action', '.button-primary', '.button-primary', 4.5],
      ['Active navigation', '.nav-item.active', '.nav-item.active', 4.5],
      ['Selected filter', '.filter-chip.selected', '.filter-chip.selected', 4.5],
      ['Topic badge', '.topic-badge', '.topic-badge', 4.5],
      ['Page muted text', '.section-heading p', 'body', 4.5],
    ]) {
      const pair = await page.evaluate(({ selector, backgroundSelector }) => {
        let backgroundNode = document.querySelector(backgroundSelector);
        while (getComputedStyle(backgroundNode).backgroundColor === 'rgba(0, 0, 0, 0)' && backgroundNode.parentElement) backgroundNode = backgroundNode.parentElement;
        return { foreground: getComputedStyle(document.querySelector(selector)).color, background: getComputedStyle(backgroundNode).backgroundColor };
      }, { selector, backgroundSelector });
      const ratio = contrast(pair.foreground, pair.background);
      report.contrast.push({ label, ...pair, ratio: Number(ratio.toFixed(2)), required: threshold });
      assert.ok(ratio >= threshold, `${label}: ${ratio.toFixed(2)} < ${threshold}`);
    }
  });
  await check('No runtime errors, failed assets, or external runtime dependency', async () => {
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.failedRequests, []);
    const external = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => !entry.name.startsWith(location.origin)));
    assert.deepEqual(external, []);
  });
} finally {
  report.summary = { passed: report.checks.filter(check => check.result === 'PASS').length, failed: report.checks.filter(check => check.result === 'FAIL').length };
  report.limitations = ['Headless Chromium emulation, not a physical-device test or screen-reader session.', 'Text enlargement and 320px reflow were checked; browser-native 200% zoom was not.', 'Solid rendered color pairs were measured. Text over the hero image and translucent layers requires manual per-pixel contrast review.', 'Outbound X URL navigation was intercepted; third-party availability and authentication requirements are not certified.', 'Automated accessibility results are not a claim of full WCAG compliance.'];
  await writeFile('artifacts/interaction-results.json', JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  await new Promise(done => server.close(done));
}
console.log(JSON.stringify(report.summary));
if (report.summary.failed) process.exitCode = 1;
