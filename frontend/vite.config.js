import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Any frontend fetch('/api/...') is forwarded to the Express backend
      // in dev, so lib/api.js can use relative paths and there's no CORS
      // dance. In production, VITE_API_BASE_URL is used directly instead.
      '/api': {
        target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
