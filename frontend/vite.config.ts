import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind 0.0.0.0 instead of just localhost — reachable by IP, LAN, or a tunnel
    strictPort: true,
    allowedHosts: ['.trycloudflare.com', '.stressmonitors.app'],
  },
})