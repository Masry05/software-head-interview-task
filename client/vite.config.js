// Still a bit noisy on purpose, but configured to run
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy the actual routes used in this messy app
      '/login': 'http://localhost:4000',
      '/logout': 'http://localhost:4000',
      '/me': 'http://localhost:4000',
      '/notes': 'http://localhost:4000',
      '/upload': 'http://localhost:4000',
      '/eval': 'http://localhost:4000',
      '/flaky': 'http://localhost:4000',
      '/admin': 'http://localhost:4000',
      '/metrics': 'http://localhost:4000',
      '/search': 'http://localhost:4000'
    }
  }
})
