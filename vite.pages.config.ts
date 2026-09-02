import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, 'pages-site'),
  base: '/marketpulse-bi/',
  publicDir: resolve(projectRoot, 'public'),
  plugins: [
    {
      name: 'strip-tailwind-from-pages',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('/app/globals.css')) return code.replace("@import 'tailwindcss';", '');
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      '@': projectRoot,
      'next/link': resolve(projectRoot, 'pages-site/next-link.tsx'),
      'next/navigation': resolve(projectRoot, 'pages-site/next-navigation.ts'),
    },
  },
  build: {
    outDir: resolve(projectRoot, 'pages-dist'),
    emptyOutDir: true,
  },
});
