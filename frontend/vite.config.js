// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      // Proxy all requests starting with /api to your backend
      '/api': {
        target: 'http://192.168.10.47:1080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
