import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'vantilburg-cards.js' },
    target: 'es2022',
    rolldownOptions: { output: { banner: '/*! vanTilburg Cards — AGPL-3.0-or-later. Based on thomasvt1/quatt-cards and thomasvt1/omnibattery-cards. Bundled Lit: BSD-3-Clause; see THIRD_PARTY_NOTICES.txt. */' } },
  },
});
