import { defineConfig } from 'wxt';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Tells Chrome to enable chrome.storage for your group's code
  srcDir: 'src',
  manifest: {
    permissions: ['storage'],
  },

  vite: () => ({
    resolve: {
      alias: {
        '@web': fileURLToPath(new URL('../younote-web/src', import.meta.url)),
        'react': fileURLToPath(new URL('./node_modules/react', import.meta.url)),
        'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url)),
      },
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  }),
});
