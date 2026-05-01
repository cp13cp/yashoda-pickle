import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ],

  // Build optimizations
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router-vendor';
          }
          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'supabase-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  // Development server
  server: {
    port: 5173,
    host: true,
    cors: true,
  },

  // Preview server
  preview: {
    port: 4173,
    host: true,
  },

  // Environment variables
  envPrefix: ['VITE_', 'SUPABASE_'],

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
  },
}))