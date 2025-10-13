import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  build: {
    assetsInlineLimit: 12288,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        manualChunks: () => 'vendor', // Force all chunks into a single vendor chunk
      },
    },
    outDir: 'dist',
    sourcemap: 'inline',
    emptyOutDir: false, // Don't empty the output directory
  },
  base: './', // Use relative paths
}); 