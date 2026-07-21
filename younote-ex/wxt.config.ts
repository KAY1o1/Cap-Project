import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  // manifest
  manifest: {
    host_permissions: ['https://www.youtube.com/*'],
    permissions: ["storage"],
  },
  webExt: {
    // Don't open a browser automatically
    disabled: true,
  },
});