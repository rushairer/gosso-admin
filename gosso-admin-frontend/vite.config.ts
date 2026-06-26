import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8083,
    host: '0.0.0.0',
    proxy: {
      '/readiness': 'http://localhost:8080',
      '/api/v1': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/oidc': 'http://localhost:8080',
      '/.well-known': 'http://localhost:8080'
    }
  }
})
