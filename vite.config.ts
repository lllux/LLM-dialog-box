import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173, // 前端端口
    strictPort: false,
    proxy: {
      // 匹配以 /api 开头的请求，转发到 3000 端口
      '/api': {
        target: 'http://localhost:3000',
        // changeOrigin: true,
      },
    },
  },
})
