import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Web-only config for development in environments without GUI (like WSL)
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  },
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}))