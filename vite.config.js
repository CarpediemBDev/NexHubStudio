import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      // 프론트의 /api 호출을 로컬 백엔드(Spring Boot, HTTPS 8443)로 프록시
      // 백엔드가 mkcert 자체서명 인증서라 secure:false 로 검증 생략
      '/api': {
        target: 'https://localhost:8443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
