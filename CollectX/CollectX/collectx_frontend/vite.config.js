import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8888',
      '/portfolio': 'http://localhost:8888',
      '/strategy': 'http://localhost:8888',
      '/dunning': 'http://localhost:8888',
      '/agent': 'http://localhost:8888',
      '/payment': 'http://localhost:8888',
      '/field': 'http://localhost:8888',
      '/legal': 'http://localhost:8888',
      '/report': 'http://localhost:8888',
      '/notify': 'http://localhost:8888',
      '/customer': 'http://localhost:8888',
    }
  }
})
