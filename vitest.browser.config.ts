import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
export default defineConfig({
  optimizeDeps: { include: ['lit', 'lit/directives/keyed.js'] },
  test: {
    include: ['tests/browser/**/*.spec.ts'], allowOnly: !process.env.CI,
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }], viewport: { width: 1100, height: 800 } },
  },
});
