import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode (production/development)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    
    // Fixes the LightningCSS build error on Vercel
    css: {
      transformer: 'postcss',
    },
    build: {
      cssMinify: 'esbuild',
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  };
});