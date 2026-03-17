/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    watch: {
      ignored: ['**/.bg-shell/**', '**/.planning/**', '**/.claude/**'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
