import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, sha256, exampleInputDigest } from './example-integrity.mjs';

const cards = [
  { type: 'home-room-card', slug: 'room', name: 'Room' },
  { type: 'home-house-card', slug: 'house', name: 'House' },
  { type: 'home-waste-card', slug: 'waste', name: 'Waste collection' },
];
const files = [];
const server = await createServer({ root, server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  await mkdir(resolve(root, 'examples'), { recursive: true });
  for (const [size, width, height] of [['desktop', 1120, 650], ['mobile', 390, 900]]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, locale: 'en-GB', timezoneId: 'Europe/Amsterdam', reducedMotion: 'reduce', colorScheme: theme });
      await page.clock.setFixedTime(new Date('2026-11-09T12:00:00Z'));
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${server.resolvedUrls.local[0]}?theme=${theme}`);
      await page.getByRole('button', { name: 'Living Room 20.0°' }).waitFor();
      const registered = await page.evaluate(() => window.customCards.filter(card => card.type !== 'bubble-card').map(card => card.type).sort());
      if (JSON.stringify(registered) !== JSON.stringify(cards.map(card => card.type).sort())) throw new Error('Every registered card needs an example fixture');
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.querySelectorAll('home-room-card, home-house-card, home-waste-card')].map(card => card.updateComplete));
      });
      async function capture(target, file, fullPage = false) {
        await target.screenshot({ path: resolve(root, 'examples', file), ...(fullPage ? { fullPage: true } : {}), animations: 'disabled' });
        files.push(file);
      }
      await capture(page, `${size}-${theme}.png`, true);
      for (const card of cards) await capture(page.locator(card.type).first(), `${card.slug}-${size}-${theme}.png`);
      await page.getByRole('button', { name: 'Bedroom 18.9°' }).click();
      await page.locator('[data-vantilburg-popup="#room-2"] .is-popup-opened').waitFor();
      await capture(page, `popup-${size}-${theme}.png`, true);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !location.hash);
      await page.evaluate(() => {
        const card = document.querySelector('home-house-card');
        const editor = document.createElement('hui-dialog-edit-card');
        card.replaceWith(editor); editor.append(card); card.preview = true;
      });
      await page.getByRole('button', { name: 'Popup', exact: true }).click();
      await page.getByRole('heading', { name: 'Stored energy' }).waitFor();
      await page.locator('hui-dialog-edit-card home-overview-popup home-house-card').waitFor();
      await capture(page.locator('hui-dialog-edit-card'), `editor-${size}-${theme}.png`);
      if (errors.length) throw new Error(errors.join('\n'));
      await page.close();
    }
  }
  const gallery = [
    '<!-- BEGIN GENERATED EXAMPLES -->',
    '![All three vanTilburg cards, desktop light theme with synthetic data](examples/desktop-light.png)',
    '',
    'Full dashboards: [desktop dark](examples/desktop-dark.png) · [phone light](examples/mobile-light.png) · [phone dark](examples/mobile-dark.png)',
    '', '### Card previews', '',
    'Synthetic readings only. Regenerate these images with `npm run update:examples`.', '',
    '| Card | Light theme | Dark theme |', '| --- | --- | --- |',
    ...cards.map(card => `| ${card.name} | ![${card.name}, light](examples/${card.slug}-desktop-light.png) | ![${card.name}, dark](examples/${card.slug}-desktop-dark.png) |`),
    '| Sectioned popup | ![Popup, light](examples/popup-desktop-light.png) | ![Popup, dark](examples/popup-desktop-dark.png) |',
    '| Editor popup preview | ![Editor preview, light](examples/editor-desktop-light.png) | ![Editor preview, dark](examples/editor-desktop-dark.png) |', '',
    'Phone previews: ' + [...cards, { slug: 'popup', name: 'Popup' }, { slug: 'editor', name: 'Editor preview' }].map(card => `${card.name} ([light](examples/${card.slug}-mobile-light.png), [dark](examples/${card.slug}-mobile-dark.png))`).join(' · '),
    '<!-- END GENERATED EXAMPLES -->',
  ].join('\n');
  const readmePath = resolve(root, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  const marker = /<!-- BEGIN GENERATED EXAMPLES -->[\s\S]*?<!-- END GENERATED EXAMPLES -->/;
  if (!marker.test(readme)) throw new Error('README is missing the generated gallery markers');
  await writeFile(readmePath, readme.replace(marker, gallery));
  const pngSha256 = Object.fromEntries(await Promise.all(files.map(async file => [file, sha256(await readFile(resolve(root, 'examples', file)))])));
  await writeFile(resolve(root, 'examples/screenshots.json'), JSON.stringify({ inputDigest: await exampleInputDigest(), files: files.sort(), pngSha256 }, null, 2) + '\n');
  console.log(`Updated ${files.length} screenshots, README gallery and source manifest.`);
} finally {
  await browser?.close();
  await server.close();
}
