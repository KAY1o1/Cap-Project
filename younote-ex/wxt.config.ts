import { defineConfig } from 'wxt';
import { fileURLToPath } from 'node:url';

export default defineConfig({

  srcDir: 'src',
  manifest:
  {
    permissions: ['storage', 'identity'], // redirect back to page, 
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
