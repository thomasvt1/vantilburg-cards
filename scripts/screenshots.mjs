import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
const server = await createServer({ server: { host: '127.0.0.1', port: 4173 } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  await mkdir('examples', { recursive: true });
  for (const [name, width, height] of [['desktop', 1120, 650], ['mobile', 390, 900]]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:4173/?theme=${theme}`);
      await page.getByRole('button', { name: 'Living Room 20.0°' }).waitFor();
      await page.screenshot({ path: `examples/${name}-${theme}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Bedroom 18.9°' }).click();
      await page.getByRole('dialog', { name: 'Bedroom' }).waitFor();
      await page.screenshot({ path: `examples/popup-${name}-${theme}.png`, fullPage: true });
      if (errors.length) throw new Error(errors.join('\n'));
      await page.close();
    }
  }
} finally { await browser.close(); await server.close(); }
