import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig((mode) => {
  const env = loadEnv(mode, process.cwd());
  return {
    optimizeDeps: {
      noDiscovery: true,
      include: ['leaflet', 'moment', 'moment/locale/id'],
    },
    plugins: [
      vue(),
      Components({
        resolvers: [PrimeVueResolver()]
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // 'fast-deep-equal': 'fast-deep-equal/index.js',
      }
    },
    server: {
      host: env.VITE_APP_HOST,
      port: env.VITE_APP_PORT,
    },
  };
});
