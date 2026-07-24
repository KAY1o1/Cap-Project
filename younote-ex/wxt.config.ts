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
<<<<<<< HEAD
  webExt: {
    // Don't open a browser automatically
    disabled: true,
  },
});
=======
});
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
