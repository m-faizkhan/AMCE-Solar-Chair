import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('./public', import.meta.url));

// Tells the app which optional assets exist in /public without making
// network requests that could 404 in the console.
// Restart the dev server after adding or removing these files.
function amceAssets() {
  const id = 'virtual:amce-assets';
  const resolved = '\0' + id;
  return {
    name: 'amce-assets',
    resolveId(source) {
      if (source === id) return resolved;
      return null;
    },
    load(source) {
      if (source !== resolved) return null;
      const assets = {
        glb: fs.existsSync(`${publicDir}/models/amce-chair.glb`),
        hdr: fs.existsSync(`${publicDir}/hdr/studio.hdr`),
      };
      return `export default ${JSON.stringify(assets)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), amceAssets()],
  server: { host: true },
  build: { chunkSizeWarningLimit: 1200 },
});
