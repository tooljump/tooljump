import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  build: {
    assetsInlineLimit: 12288,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        manualChunks: undefined, // Disable code splitting completely
        format: 'iife', // Build as IIFE for service worker
      },
    },
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
    emptyOutDir: false, // Don't empty the output directory
  },
  base: './', // Use relative paths
}); 