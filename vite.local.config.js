import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  build: {
    outDir: 'build',
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    proxy: {
      '/api/socket': {
        target: 'ws://127.0.0.1:9090',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:9090',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 3002,
    proxy: {
      '/api/socket': {
        target: 'ws://127.0.0.1:9090',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:9090',
        changeOrigin: true,
      },
    },
  },
  plugins: [svgr(), react()],
});
