import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/marketplace.tsx/',
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  plugins: [react()],
})
