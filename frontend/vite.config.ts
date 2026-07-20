import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080/JEB-1.0-SNAPSHOT',
        changeOrigin: true,
      },
    },
  },
})
