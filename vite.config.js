import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import dotenv from 'dotenv';
dotenv.config();
// https://vite.dev/config/
export default defineConfig({
  base: '/', // <--- Thêm dòng này
  server: {
    proxy: {
      '/api': {
        target: `http://${process.env.MYSQLHOST}:${process.env.PORT}`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },

  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['v-calendar'],
  },
});
