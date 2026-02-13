import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      jit: true,
    }),
  ],
  resolve: {
    mainFields: ['module'],
  },
  // Base set to './' ensures assets load correctly on GitHub Pages
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    // Polyfill process.env for libraries that might expect it
    'process.env': {},
  },
});